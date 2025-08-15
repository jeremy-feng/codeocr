# Multi-stage build for CodeOCR application
# Stage 1: Build frontend
FROM node:20.17.0-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy frontend source code
COPY frontend/ .

# Build frontend for production
RUN pnpm run build

# Stage 2: Python backend builder
FROM python:3.12-slim AS backend-builder

# Install uv for Python package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy backend configuration files
COPY backend/pyproject.toml backend/uv.lock ./

# Install Python dependencies
RUN uv sync --frozen --no-dev

# Stage 3: Production image with minimal runtime
FROM python:3.12-slim AS production

# Install Node.js and bash
RUN apt-get update && \
    apt-get install -y curl bash && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy uv from builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy Python virtual environment from builder
COPY --from=backend-builder /app/.venv /app/.venv

# Copy backend source code
COPY backend/*.py ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/.next/standalone /app/
COPY --from=frontend-builder /app/frontend/public /app/public
COPY --from=frontend-builder /app/frontend/.next/static /app/.next/static

# Expose ports
EXPOSE 8000 3000

# Set environment variables
ENV PYTHONPATH=/app \
    UVICORN_HOST=0.0.0.0 \
    UVICORN_PORT=8000 \
    PATH="/app/.venv/bin:$PATH" \
    VIRTUAL_ENV=/app/.venv \
    NODE_ENV=production \
    PORT=3000

# Create startup script for better process management
RUN echo '#!/bin/bash\n\
    uv run uvicorn main:app --host $UVICORN_HOST --port $UVICORN_PORT &\n\
    BACKEND_PID=$!\n\
    node /app/server.js &\n\
    FRONTEND_PID=$!\n\
    wait $BACKEND_PID $FRONTEND_PID' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]