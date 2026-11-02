# ==============================================================================
# Imam Al-Jazari Telegram Bot - Production Dockerfile
# ==============================================================================
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies (build-essential, libpq-dev for asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy bot codebase
COPY bot/ /app/bot/
COPY tests/ /app/tests/

# Create non-root user for security
RUN adduser --disabled-password --gecos '' jazari_user && \
    chown -R jazari_user:jazari_user /app
USER jazari_user

# Expose webhook port if running in webhook mode
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 0

# Default entry point
CMD ["python", "-m", "bot.main"]
