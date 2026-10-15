# PayGuard Production Dockerfile
FROM python:3.11-slim

# Set working directory and environment flags
WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code, models, and configuration
COPY config/ ./config/
COPY src/ ./src/
COPY app/ ./app/
COPY models/ ./models/
COPY data/reference/ ./data/reference/
COPY data/raw/ ./data/raw/
COPY payguard-transaction-risk-assessment-UI/ ./payguard-transaction-risk-assessment-UI/
COPY payguard-transaction-risk-assessment-v2/ ./payguard-transaction-risk-assessment-v2/
COPY reports/ ./reports/

# Create non-root user for security best practice
RUN useradd -m -u 1000 payguard && chown -R payguard:payguard /workspace
USER payguard

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch FastAPI with production Uvicorn workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
