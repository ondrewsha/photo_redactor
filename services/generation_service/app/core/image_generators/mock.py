from __future__ import annotations

import binascii
import hashlib
import struct
import zlib

from app.core.image_generators.base import GeneratedImage


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    length = struct.pack(">I", len(data))
    crc = struct.pack(">I", binascii.crc32(chunk_type + data) & 0xFFFFFFFF)
    return length + chunk_type + data + crc


def _solid_rgba_png(width: int, height: int, rgba: tuple[int, int, int, int]) -> bytes:
    r, g, b, a = rgba
    pixel = bytes([r, g, b, a])
    row = b"\x00" + (pixel * width)
    raw = row * height
    compressed = zlib.compress(raw, level=6)

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return signature + _png_chunk(b"IHDR", ihdr) + _png_chunk(b"IDAT", compressed) + _png_chunk(b"IEND", b"")


class MockImageGenerator:
    async def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        seed: int | None,
        source_images: list[bytes] | None = None,
    ) -> GeneratedImage:
        images_blob = b"".join(source_images or [])
        key = f"{seed}:{width}x{height}:{prompt}".encode("utf-8", errors="ignore") + images_blob
        digest = hashlib.sha256(key).digest()
        rgba = (digest[0], digest[1], digest[2], 255)
        content = _solid_rgba_png(width=width, height=height, rgba=rgba)
        return GeneratedImage(content=content, mime_type="image/png")
