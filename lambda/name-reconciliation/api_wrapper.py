"""
FastAPI wrapper for the Lambda handler to enable deployment with AWS Copilot
This allows the Lambda function to run as a containerized web service on ECS
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from handler import lambda_handler

app = FastAPI(
    title="AI-Powered Name Reconciliation API",
    description="Amazon Bedrock-powered name matching service for Expert File Opening",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint for AWS Copilot"""
    return {"status": "healthy", "service": "name-reconciliation-api"}

@app.post("/api/reconcile")
async def reconcile(request: Request):
    """
    Name reconciliation endpoint
    Wraps the Lambda handler for HTTP requests
    """
    try:
        # Get request body
        body = await request.json()
        
        # Create Lambda event structure
        event = {
            "body": json.dumps(body),
            "httpMethod": "POST",
            "path": "/api/reconcile",
            "headers": dict(request.headers),
        }
        
        # Call Lambda handler
        context = {}  # Mock context for local execution
        response = lambda_handler(event, context)
        
        # Parse Lambda response
        status_code = response.get("statusCode", 200)
        response_body = json.loads(response.get("body", "{}"))
        
        return JSONResponse(
            content=response_body,
            status_code=status_code
        )
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/conflicts/check")
async def check_conflicts(request: Request):
    """
    Conflicts check endpoint
    Wraps the Lambda handler for HTTP requests
    """
    try:
        # Get request body
        body = await request.json()
        
        # Create Lambda event structure
        event = {
            "body": json.dumps(body),
            "httpMethod": "POST",
            "path": "/api/conflicts/check",
            "headers": dict(request.headers),
        }
        
        # Call Lambda handler
        context = {}  # Mock context for local execution
        response = lambda_handler(event, context)
        
        # Parse Lambda response
        status_code = response.get("statusCode", 200)
        response_body = json.loads(response.get("body", "{}"))
        
        return JSONResponse(
            content=response_body,
            status_code=status_code
        )
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "AI-Powered Name Reconciliation API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "reconcile": "/api/reconcile",
            "conflicts_check": "/api/conflicts/check"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
