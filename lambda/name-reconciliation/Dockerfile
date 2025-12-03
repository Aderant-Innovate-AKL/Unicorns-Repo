# Multi-stage build for Lambda function wrapped with FastAPI for AWS Copilot
FROM python:3.11-slim as base

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir fastapi uvicorn mangum

# Copy Lambda function code
COPY handler.py .
COPY api_wrapper.py .

# Expose port for web service
EXPOSE 8080

# Run FastAPI server that wraps the Lambda handler
CMD ["uvicorn", "api_wrapper:app", "--host", "0.0.0.0", "--port", "8080"]

