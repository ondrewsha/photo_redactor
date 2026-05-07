from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.settings import Settings


class EmailConfigurationError(RuntimeError):
    pass


async def send_email(
    *,
    settings: Settings,
    to_email: str,
    subject: str,
    text: str,
    html: str | None = None,
) -> None:
    if not settings.smtp_host:
        raise EmailConfigurationError("Не настроена отправка писем (SMTP).")

    from_email = settings.smtp_from or settings.smtp_username
    if not from_email:
        raise EmailConfigurationError("Не указан адрес отправителя (SMTP_FROM).")

    message = EmailMessage()
    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text)
    if html:
        message.add_alternative(html, subtype="html")

    smtp = aiosmtplib.SMTP(
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=settings.smtp_use_tls,
        use_tls=settings.smtp_use_ssl,
        timeout=20,
    )
    await smtp.connect()
    try:
        if settings.smtp_username and settings.smtp_password:
            await smtp.login(settings.smtp_username, settings.smtp_password)
        await smtp.send_message(message)
    finally:
        await smtp.quit()

