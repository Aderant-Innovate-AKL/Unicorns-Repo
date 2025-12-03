# Deploy AI Name Reconciliation Service to AWS
# This script deploys the Lambda function and API Gateway

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'ap-southeast-2',
    
    [Parameter(Mandatory=$false)]
    [switch]$Guided
)

Write-Host "🚀 Deploying AI Name Reconciliation Service" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

# Check if SAM CLI is installed
if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS SAM CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
    exit 1
}

# Build the application
Write-Host "`n📦 Building Lambda function..." -ForegroundColor Cyan
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy
Write-Host "`n🚀 Deploying to AWS..." -ForegroundColor Cyan

if ($Guided) {
    sam deploy --guided
} else {
    sam deploy `
        --stack-name "name-reconciliation-$Environment" `
        --region $Region `
        --parameter-overrides Environment=$Environment `
        --capabilities CAPABILITY_IAM `
        --resolve-s3 `
        --no-fail-on-empty-changeset
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment successful!" -ForegroundColor Green

# Get outputs
Write-Host "`n📋 Stack Outputs:" -ForegroundColor Cyan
aws cloudformation describe-stacks `
    --stack-name "name-reconciliation-$Environment" `
    --region $Region `
    --query 'Stacks[0].Outputs' `
    --output table

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the ApiEndpoint from outputs above" -ForegroundColor Yellow
Write-Host "2. Update .env.development with: UI_API_BASE_URL=<ApiEndpoint>" -ForegroundColor Yellow
Write-Host "3. Enable Bedrock model access in AWS Console (if not already enabled)" -ForegroundColor Yellow
Write-Host "4. Seed DynamoDB with sample data (optional for testing)" -ForegroundColor Yellow
