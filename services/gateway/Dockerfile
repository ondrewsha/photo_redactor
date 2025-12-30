FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY services/gateway/pyproject.toml services/gateway/README.md /app/
COPY alembic.ini /app/
COPY alembic /app/alembic
COPY services/gateway/app /app/app
COPY shared /app/shared

RUN pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir /app/shared \
  && pip install --no-cache-dir /app

EXPOSE 8000

CMD ["bash", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
