# AWS Copilot Deployment Guide - NameReconciliation Service

## Overview

This guide provides step-by-step instructions for deploying the AI-Powered Name
Reconciliation API using AWS Copilot to the existing hackathon infrastructure.

## Prerequisites

### 1. Docker Desktop (REQUIRED)

Docker is required for building container images:

1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Start Docker Desktop
4. Verify installation:
   ```powershell
   docker --version
   docker info
   ```

### 2. AWS Copilot CLI (Already Available)

Located at: `C:\Users\michael.baker\copilot.exe`

### 3. AWS Credentials (Already Configured)

```powershell
$Env:AWS_DEFAULT_REGION="ap-southeast-2"
$Env:AWS_ACCESS_KEY_ID="ASIAQMEY5UC5QIAB4VQD"
$Env:AWS_SECRET_ACCESS_KEY="uOeibdVedA0f+q6I4zVkmGjluRM91agPTEPgUvmq"
$Env:AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEG0a..."
```

### 4. Amazon Bedrock Access

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Enable "Claude 3 Sonnet" in ap-southeast-2 region
4. Wait for status to show "Access granted"

## Deployment Steps

### Step 1: Verify Prerequisites

```powershell
# Check Docker is running
docker info

# Check Copilot is available
C:\Users\michael.baker\copilot.exe --version

# Verify AWS credentials
C:\Users\michael.baker\copilot.exe app show
```

Expected output:

```
About
  Name                  hackathon-ui-template

Environments
  Name    AccountID     Region
  ----    ---------     ------
  dev     026090512571  ap-southeast-2

Workloads
  Name                Type                       Environments
  ----                ----                       ------------
  frontend            Load Balanced Web Service  -
  reconciliation-api  Load Balanced Web Service  -
```

### Step 2: Deploy the Service

```powershell
# Navigate to project directory
cd c:\Source\Unicorns-Repo

# Deploy reconciliation-api to dev environment
C:\Users\michael.baker\copilot.exe svc deploy --name reconciliation-api --env dev
```

**What happens during deployment:**

1. ✅ Builds Docker image from `lambda/name-reconciliation/Dockerfile`
2. ✅ Pushes image to Amazon ECR
3. ✅ Creates CloudFormation stacks:
   - DynamoDB table: `hackathon-ui-template-dev-ExpertEntities`
   - IAM roles and policies (Bedrock + DynamoDB access)
   - ECS task definition and service
   - Application Load Balancer
   - Target groups with health checks
4. ✅ Deploys containers to AWS Fargate
5. ✅ Waits for health checks to pass

**Expected Duration:** 5-10 minutes

### Step 3: Verify Deployment

```powershell
# Check service status
C:\Users\michael.baker\copilot.exe svc status --name reconciliation-api --env dev

# Get service details and URL
C:\Users\michael.baker\copilot.exe svc show --name reconciliation-api
```

Look for the **Service URL** in the output (should be an ALB endpoint).

### Step 4: Test the API

```powershell
# Set the API URL (replace with your actual ALB URL)
$apiUrl = "https://recon-Publi-XXXXXXXXX.ap-southeast-2.elb.amazonaws.com"

# Test health endpoint
curl "$apiUrl/health"
# Expected: {"status":"healthy","service":"name-reconciliation-api"}

# Test API info endpoint
curl "$apiUrl/"
# Expected: API information with endpoint list

# View OpenAPI documentation
Start-Process "$apiUrl/docs"  # Opens in browser
```

### Step 5: Test Name Reconciliation

```powershell
# Create test request
$body = @{
    entities = @(
        @{
            name = "John Smith"
            entityType = "client"
        }
    )
    threshold = 70
    includeConflictsCheck = $false
} | ConvertTo-Json

# Send reconciliation request
curl -Method POST "$apiUrl/api/reconcile" `
    -ContentType "application/json" `
    -Body $body
```

### Step 6: Seed DynamoDB (Optional)

```powershell
# Add sample test entities to DynamoDB
aws dynamodb put-item `
    --table-name hackathon-ui-template-dev-ExpertEntities `
    --item '{
        "id": {"S": "client-001"},
        "entityType": {"S": "client"},
        "name": {"S": "John E. Smith"},
        "email": {"S": "john.smith@example.com"}
    }' `
    --region ap-southeast-2

# Add another test entity
aws dynamodb put-item `
    --table-name hackathon-ui-template-dev-ExpertEntities `
    --item '{
        "id": {"S": "client-002"},
        "entityType": {"S": "client"},
        "name": {"S": "Robert Williams"},
        "email": {"S": "bob.williams@example.com"}
    }' `
    --region ap-southeast-2
```

### Step 7: Connect Frontend

```powershell
# Update frontend environment file
Set-Content .env.development "UI_API_BASE_URL=$apiUrl"

# Start frontend locally
pnpm dev

# Visit http://localhost:3000/reconciliation
```

## Monitoring and Logs

### View Live Logs

```powershell
# Stream logs in real-time
C:\Users\michael.baker\copilot.exe svc logs --name reconciliation-api --env dev --follow
```

### View Recent Logs

```powershell
# Last hour
C:\Users\michael.baker\copilot.exe svc logs --name reconciliation-api --env dev --since 1h

# Last 30 minutes
C:\Users\michael.baker\copilot.exe svc logs --name reconciliation-api --env dev --since 30m
```

### Execute Commands in Container

```powershell
# Open shell in running container
C:\Users\michael.baker\copilot.exe svc exec --name reconciliation-api --env dev
```

## Troubleshooting

### Issue: Docker command not found

**Error:**
`X upload deploy resources for service reconciliation-api: check if docker engine is running: docker: command not found`

**Solution:**

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Start Docker Desktop application
3. Wait for Docker to fully start
4. Verify: `docker info` should return Docker engine information
5. Retry deployment

### Issue: Bedrock Access Denied

**Error:** `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**Solution:**

1. AWS Console → Amazon Bedrock → Model access
2. Click "Manage model access"
3. Enable "Claude 3 Sonnet" (anthropic.claude-3-sonnet-20240229-v1:0)
4. Wait for status: "Access granted"
5. Redeploy service: `copilot svc deploy --name reconciliation-api --env dev`

### Issue: Health Check Failing

**Error:** Service deployment stuck at "Waiting for health checks to pass"

**Solution:**

```powershell
# Check logs for errors
C:\Users\michael.baker\copilot.exe svc logs --name reconciliation-api --env dev --follow

# Common causes:
# 1. Missing environment variables - check manifest.yml
# 2. DynamoDB table not created - verify CloudFormation stack
# 3. Application error - check logs for Python exceptions
# 4. Port mismatch - ensure Dockerfile EXPOSE 8080 matches manifest

# Verify health endpoint locally
docker build -t test lambda/name-reconciliation/
docker run -p 8080:8080 test
# In another terminal: curl http://localhost:8080/health
```

### Issue: DynamoDB Table Not Found

**Error:** `ResourceNotFoundException: Requested resource not found`

**Solution:**

```powershell
# Verify table was created
C:\Users\michael.baker\copilot.exe svc show --name reconciliation-api

# Check CloudFormation stacks
# AWS Console → CloudFormation → Look for:
# - hackathon-ui-template-infrastructure-addons-reconciliation-api

# Verify table name matches environment variable
# Expected: hackathon-ui-template-dev-ExpertEntities
```

### Issue: High Costs

**Solution:**

```powershell
# Scale down to 0 tasks when not in use
# Edit copilot/reconciliation-api/manifest.yml:
# count: 0

# Redeploy
C:\Users\michael.baker\copilot.exe svc deploy --name reconciliation-api --env dev
```

## Production Deployment

### Create Production Environment

```powershell
# Initialize production environment
C:\Users\michael.baker\copilot.exe env init --name prod --region ap-southeast-2 --default-config

# Deploy services to production
C:\Users\michael.baker\copilot.exe svc deploy --name reconciliation-api --env prod
C:\Users\michael.baker\copilot.exe svc deploy --name frontend --env prod
```

### Production Checklist

- [ ] Enable Bedrock access in production account
- [ ] Configure production CloudWatch alarms
- [ ] Set up auto-scaling policies
- [ ] Enable AWS WAF for security
- [ ] Configure backup for DynamoDB
- [ ] Set up cost alerts
- [ ] Review and restrict CORS settings
- [ ] Enable encryption at rest
- [ ] Configure VPC endpoints (optional)
- [ ] Set up CI/CD pipeline

## Service Management Commands

```powershell
# Deploy service
C:\Users\michael.baker\copilot.exe svc deploy --name reconciliation-api --env dev

# Check status
C:\Users\michael.baker\copilot.exe svc status --name reconciliation-api --env dev

# View details
C:\Users\michael.baker\copilot.exe svc show --name reconciliation-api

# Stream logs
C:\Users\michael.baker\copilot.exe svc logs --name reconciliation-api --env dev --follow

# Shell into container
C:\Users\michael.baker\copilot.exe svc exec --name reconciliation-api --env dev

# Delete service (DANGER!)
C:\Users\michael.baker\copilot.exe svc delete --name reconciliation-api --env dev
```

## AWS Resources Created

After deployment, the following resources are created:

| Resource        | Name/Pattern                                    | Purpose                 |
| --------------- | ----------------------------------------------- | ----------------------- |
| ECS Cluster     | hackathon-ui-template-dev                       | Container orchestration |
| ECS Service     | reconciliation-api                              | Running tasks           |
| ALB             | hackathon-ui-template-dev-Publi-\*              | Load balancing          |
| Target Group    | reconciliation-api-\*                           | Health checks           |
| DynamoDB Table  | hackathon-ui-template-dev-ExpertEntities        | Entity storage          |
| ECR Repository  | hackathon-ui-template/reconciliation-api        | Docker images           |
| CloudWatch Logs | /copilot/reconciliation-api                     | Service logs            |
| IAM Roles       | hackathon-ui-template-dev-reconciliation-api-\* | Permissions             |
| Security Groups | copilot-hackathon-ui-template-dev-\*            | Network security        |

## Cost Estimates

**Development Environment (1 task running 24/7):**

| Service                          | Monthly Cost |
| -------------------------------- | ------------ |
| ECS Fargate (0.5 vCPU, 1GB RAM)  | ~$15         |
| Application Load Balancer        | ~$20         |
| Bedrock (Claude 3 Sonnet)        | ~$10-15      |
| DynamoDB (on-demand)             | ~$1-2        |
| ECR + CloudWatch + Data Transfer | ~$3-5        |
| **Total**                        | **~$50-60**  |

**Cost Optimization:**

- Scale to 0 tasks during off-hours
- Use Fargate Spot for 70% savings (non-production)
- Switch to Lambda for sporadic workloads

## Support

- **Copilot Docs:** https://aws.github.io/copilot-cli/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Bedrock Docs:** https://docs.aws.amazon.com/bedrock/
- **Implementation Details:** See `IMPLEMENTATION-SUMMARY.md`

## Next Steps

1. ✅ Install Docker Desktop
2. ✅ Deploy service: `copilot svc deploy --name reconciliation-api --env dev`
3. ✅ Test API endpoints
4. ✅ Seed DynamoDB with entities
5. ✅ Connect frontend
6. ⬜ Test name reconciliation workflow
7. ⬜ Integrate with Expert file opening
8. ⬜ Configure production environment

---

**Ready to Deploy!** 🚀

Once Docker Desktop is installed and running, execute the deployment command to provision
all infrastructure and start the AI-Powered Name Reconciliation API.
