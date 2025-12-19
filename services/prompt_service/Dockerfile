FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY services/prompt_service/pyproject.toml services/prompt_service/README.md /app/
COPY services/prompt_service/app /app/app
COPY shared /app/shared

RUN pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir /app/shared \
  && pip install --no-cache-dir /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
