from __future__ import annotations

import base64
import inspect
import io
import logging
import re
import socket
from typing import Literal
from urllib.parse import urlparse

import httpx

from app.core.errors import GeneratorConfigurationError, UnsupportedImageSizeError, UnsupportedSourceImagesError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings

logger = logging.getLogger(__name__)

_OpenAISize = Literal[
    "256x256",
    "512x512",
    "1024x1024",
    "1536x1024",
    "1024x1536",
    "1792x1024",
    "1024x1792",
]

_OpenAIEditSize = Literal[
    "auto",
    "256x256",
    "512x512",
    "1024x1024",
    "1536x1024",
    "1024x1536",
]

_DALLE2_MAX_PROMPT_LEN = 1000
_DALLE2_MAX_IMAGE_BYTES = 4_000_000


def _is_dalle2(model: str) -> bool:
    return model.strip().lower() == "dall-e-2"


def _is_dalle3(model: str) -> bool:
    return model.strip().lower() == "dall-e-3"


def _allowed_generate_sizes(model: str) -> set[_OpenAISize]:
    if _is_dalle2(model):
        return {"256x256", "512x512", "1024x1024"}
    if _is_dalle3(model):
        return {"1024x1024", "1792x1024", "1024x1792"}
    return {"1024x1024", "1536x1024", "1024x1536"}


def _trim_prompt(prompt: str, *, max_len: int) -> str:
    value = " ".join(prompt.split()).strip()
    if len(value) <= max_len:
        return value

    cut = value[:max_len].rstrip()
    # Try to avoid cutting in the middle of a word/sentence.
    for sep in ("\n", ". ", "! ", "? ", "; ", ": ", ", ", " "):
        pos = cut.rfind(sep)
        if pos >= max_len - 120 and pos > 0:
            cut = cut[:pos].rstrip()
            break
    return cut.strip() or value[:max_len].strip()


def _prepare_images_for_dalle2_edit(
    source_images: list[bytes],
    *,
    requested_side: int,
) -> tuple[bytes, _OpenAISize]:
    try:
        from PIL import Image, ImageOps
    except Exception as exc:  # noqa: BLE001
        raise GeneratorConfigurationError(
            "Не установлена библиотека pillow. Добавьте зависимость `pillow` и пересоберите generation_service."
        ) from exc

    def _combine_to_square_png(images: list[bytes], *, side: int) -> bytes:
        opened: list[Image.Image] = []
        for raw in images:
            try:
                im = Image.open(io.BytesIO(raw))
                im = ImageOps.exif_transpose(im)
                opened.append(im.convert("RGBA"))
            except Exception:
                continue

        if not opened:
            raise RuntimeError("Не удалось прочитать фото")

        if len(opened) == 1:
            canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            fitted = ImageOps.contain(opened[0], (side, side), Image.LANCZOS)
            canvas.paste(fitted, ((side - fitted.width) // 2, (side - fitted.height) // 2), fitted)
        else:
            rows, cols = (1, 2) if len(opened) == 2 else (2, 2)
            cell_w, cell_h = side // cols, side // rows
            canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            for idx, im in enumerate(opened[: rows * cols]):
                r, c = divmod(idx, cols)
                fitted = ImageOps.contain(im, (cell_w, cell_h), Image.LANCZOS)
                x = c * cell_w + (cell_w - fitted.width) // 2
                y = r * cell_h + (cell_h - fitted.height) // 2
                canvas.paste(fitted, (x, y), fitted)

        buf = io.BytesIO()
        canvas.save(buf, format="PNG", optimize=True)
        return buf.getvalue()

    side = 1024
    if requested_side in (256, 512, 1024):
        side = requested_side

    candidates: list[int] = [side]
    if side == 1024:
        candidates += [512, 256]
    elif side == 512:
        candidates += [256]

    last_bytes: bytes | None = None
    for cand in candidates:
        data = _combine_to_square_png(source_images, side=cand)
        last_bytes = data
        if len(data) <= _DALLE2_MAX_IMAGE_BYTES:
            size_out: _OpenAISize = f"{cand}x{cand}"  # type: ignore[assignment]
            return data, size_out

    assert last_bytes is not None
    return last_bytes, "256x256"


def _redact_proxy_url(proxy_url: str) -> str:
    parsed = urlparse(proxy_url)
    if parsed.username or parsed.password:
        host = parsed.hostname or ""
        if parsed.port is not None:
            host = f"{host}:{parsed.port}"
        return parsed._replace(netloc=host).geturl()
    return proxy_url


def _is_proxy_reachable(proxy_url: str, *, timeout_s: float = 1.5) -> bool:
    parsed = urlparse(proxy_url)
    host = parsed.hostname
    if not host:
        return False
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80
    try:
        with socket.create_connection((host, port), timeout=timeout_s):
            return True
    except OSError:
        return False


def _map_size(width: int, height: int) -> _OpenAISize:
    mapping: dict[tuple[int, int], _OpenAISize] = {
        (256, 256): "256x256",
        (512, 512): "512x512",
        (1024, 1024): "1024x1024",
        (1536, 1024): "1536x1024",
        (1024, 1536): "1024x1536",
        (1792, 1024): "1792x1024",
        (1024, 1792): "1024x1792",
    }
    size = mapping.get((width, height))
    if size is None:
        raise UnsupportedImageSizeError(width=width, height=height)
    return size


def _map_size_edit(width: int, height: int) -> _OpenAIEditSize:
    mapping: dict[tuple[int, int], _OpenAIEditSize] = {
        (256, 256): "256x256",
        (512, 512): "512x512",
        (1024, 1024): "1024x1024",
        (1536, 1024): "1536x1024",
        (1024, 1536): "1024x1536",
    }
    return mapping.get((width, height), "auto")


def _mime_from_format(fmt: str) -> str:
    if fmt == "png":
        return "image/png"
    if fmt == "jpeg":
        return "image/jpeg"
    if fmt == "webp":
        return "image/webp"
    return "application/octet-stream"


def _detect_mime(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8"):
        return "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


def _file_ext_from_mime(mime: str) -> str:
    if mime == "image/png":
        return "png"
    if mime == "image/jpeg":
        return "jpg"
    if mime == "image/webp":
        return "webp"
    return "bin"


def _unknown_parameter_name(exc: Exception) -> str | None:
    status_code = getattr(exc, "status_code", None)
    body = getattr(exc, "body", None)
    if status_code == 400 and isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            code = err.get("code")
            param = err.get("param")
            if code == "unknown_parameter" and isinstance(param, str) and param:
                return param
            msg = err.get("message")
            if isinstance(msg, str) and msg:
                match = re.search(r"Unknown parameter: ['\"]([^'\"]+)['\"]", msg)
                if match:
                    return match.group(1)

    msg = getattr(exc, "message", None)
    if not isinstance(msg, str) or not msg:
        msg = str(exc)
    match = re.search(r"Unknown parameter: ['\"]([^'\"]+)['\"]", msg)
    if match:
        return match.group(1)
    match = re.search(r"Unknown parameter: ([a-zA-Z0-9_]+)", msg)
    if match:
        return match.group(1)
    return None


class OpenAIImageGenerator:
    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings
        try:
            from openai import AsyncOpenAI
        except Exception as exc:  # noqa: BLE001
            raise GeneratorConfigurationError(
                "Не установлена библиотека openai. Добавьте зависимость `openai` и пересоберите generation_service."
            ) from exc

        if not self._settings.openai_api_key:
            raise GeneratorConfigurationError("Задай GEN_SERVICE_OPENAI_API_KEY для image_provider=openai")

        proxy = self._settings.openai_proxy_url or None
        if proxy and not _is_proxy_reachable(proxy):
            logger.warning("OpenAI proxy is not reachable, disabling proxy: %s", _redact_proxy_url(proxy))
            proxy = None

        timeout = httpx.Timeout(
            connect=min(5.0, self._settings.http_timeout_s),
            read=self._settings.http_timeout_s,
            write=self._settings.http_timeout_s,
            pool=self._settings.http_timeout_s,
        )
        self._http = httpx.AsyncClient(timeout=timeout, proxy=proxy)
        self._client = AsyncOpenAI(
            api_key=self._settings.openai_api_key,
            base_url=self._settings.openai_base_url,
            http_client=self._http,
            max_retries=0,
            timeout=self._settings.http_timeout_s,
        )

        try:
            self._generate_signature = inspect.signature(self._client.images.generate)
        except Exception:  # noqa: BLE001
            self._generate_signature = None
        try:
            self._edit_signature = inspect.signature(self._client.images.edit)
        except Exception:  # noqa: BLE001
            self._edit_signature = None

    async def close(self) -> None:
        await self._http.aclose()

    async def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        seed: int | None,
        source_images: list[bytes] | None = None,
    ) -> GeneratedImage:
        _ = seed
        if source_images:
            if not _is_dalle2(self._settings.openai_model):
                raise UnsupportedSourceImagesError(model=self._settings.openai_model)
            return await self._edit(prompt=prompt, width=width, height=height, source_images=source_images)
        return await self._generate(prompt=prompt, width=width, height=height)

    async def _generate(self, *, prompt: str, width: int, height: int) -> GeneratedImage:
        model = self._settings.openai_model
        if _is_dalle2(model):
            prompt = _trim_prompt(prompt, max_len=_DALLE2_MAX_PROMPT_LEN)
            if width != height or width not in (256, 512, 1024):
                raise UnsupportedImageSizeError(width=width, height=height)
        size = _map_size(width, height)
        if size not in _allowed_generate_sizes(model):
            raise UnsupportedImageSizeError(width=width, height=height)

        kwargs: dict[str, object] = {}
        if self._settings.openai_style is not None and not _is_dalle2(model):
            kwargs["style"] = self._settings.openai_style

        base_kwargs: dict[str, object] = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": size,
            "response_format": "b64_json",
            "output_format": self._settings.openai_output_format if not _is_dalle2(model) else None,
            "quality": self._settings.openai_quality if not _is_dalle2(model) else None,
            **kwargs,
        }
        base_kwargs = {k: v for k, v in base_kwargs.items() if v is not None}
        if self._generate_signature is not None:
            allowed = set(self._generate_signature.parameters.keys())
            base_kwargs = {k: v for k, v in base_kwargs.items() if k in allowed}

        call_kwargs = dict(base_kwargs)
        retries_left = 3
        while True:
            try:
                response = await self._client.images.generate(**call_kwargs)
                break
            except TypeError:
                response = await self._client.images.generate(
                    model=self._settings.openai_model,
                    prompt=prompt,
                    size=size,
                    response_format="b64_json",
                )
                break
            except Exception as exc:  # noqa: BLE001 - normalize SDK/server incompatibilities
                unknown_param = _unknown_parameter_name(exc)
                if (
                    retries_left > 0
                    and isinstance(unknown_param, str)
                    and unknown_param
                    and unknown_param in call_kwargs
                    and unknown_param in {"output_format", "quality", "style"}
                ):
                    retries_left -= 1
                    call_kwargs.pop(unknown_param, None)
                    continue
                raise

        return await self._response_to_image(response)

    async def _edit(self, *, prompt: str, width: int, height: int, source_images: list[bytes]) -> GeneratedImage:
        model = self._settings.openai_model
        if _is_dalle2(model):
            prompt = _trim_prompt(prompt, max_len=_DALLE2_MAX_PROMPT_LEN)
            if width != height or width not in (256, 512, 1024):
                raise UnsupportedImageSizeError(width=width, height=height)
            prepared, size = _prepare_images_for_dalle2_edit(source_images, requested_side=width)
            image_file = io.BytesIO(prepared)
            image_file.name = "input.png"
        else:
            size = _map_size_edit(width, height)
            raw = source_images[0]
            mime = _detect_mime(raw)
            image_file = io.BytesIO(raw)
            image_file.name = f"input.{_file_ext_from_mime(mime)}"

        base_kwargs: dict[str, object] = {
            "model": model,
            "prompt": prompt,
            "image": image_file,
            "n": 1,
            "size": size,
            "response_format": "b64_json",
            "output_format": self._settings.openai_output_format if not _is_dalle2(model) else None,
            "quality": self._settings.openai_quality if not _is_dalle2(model) else None,
        }
        base_kwargs = {k: v for k, v in base_kwargs.items() if v is not None}
        if self._edit_signature is not None:
            allowed = set(self._edit_signature.parameters.keys())
            base_kwargs = {k: v for k, v in base_kwargs.items() if k in allowed}

        call_kwargs = dict(base_kwargs)
        retries_left = 3
        while True:
            try:
                response = await self._client.images.edit(**call_kwargs)
                break
            except TypeError:
                response = await self._client.images.edit(
                    model=self._settings.openai_model,
                    prompt=prompt,
                    image=image_file,
                    size=size,
                    response_format="b64_json",
                )
                break
            except Exception as exc:  # noqa: BLE001 - normalize SDK/server incompatibilities
                unknown_param = _unknown_parameter_name(exc)
                if (
                    retries_left > 0
                    and isinstance(unknown_param, str)
                    and unknown_param
                    and unknown_param in call_kwargs
                    and unknown_param in {"output_format", "quality", "style"}
                ):
                    retries_left -= 1
                    call_kwargs.pop(unknown_param, None)
                    continue
                raise

        return await self._response_to_image(response)

    async def _response_to_image(self, response: object) -> GeneratedImage:
        data = getattr(response, "data", None)
        if not data:
            raise RuntimeError("OpenAI images response missing data")
        image = data[0]

        image_b64 = getattr(image, "b64_json", None)
        if image_b64:
            content = base64.b64decode(image_b64)
            mime = _detect_mime(content)
            if mime == "application/octet-stream":
                mime = _mime_from_format(self._settings.openai_output_format)
            return GeneratedImage(content=content, mime_type=mime)

        image_url = getattr(image, "url", None)
        if isinstance(image_url, str) and image_url:
            resp = await self._http.get(image_url)
            resp.raise_for_status()
            content = resp.content
            mime = resp.headers.get("content-type") or _detect_mime(content)
            return GeneratedImage(content=content, mime_type=mime)

        raise RuntimeError("OpenAI images response missing image content")
