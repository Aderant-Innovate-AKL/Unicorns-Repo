#!/bin/bash
# Deploy AI Name Reconciliation Service to AWS
# This script deploys the Lambda function and API Gateway

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-southeast-2}

echo "🚀 Deploying AI Name Reconciliation Service"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Build the application
echo ""
echo "📦 Building Lambda function..."
sam build

echo "✅ Build successful"

# Deploy
echo ""
echo "🚀 Deploying to AWS..."
sam deploy \
    --stack-name "name-reconciliation-$ENVIRONMENT" \
    --region "$REGION" \
    --parameter-overrides Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-fail-on-empty-changeset

echo ""
echo "✅ Deployment successful!"

# Get outputs
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "name-reconciliation-$ENVIRONMENT" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "💡 Next Steps:"
echo "1. Copy the ApiEndpoint from outputs above"
echo "2. Update .env.development with: UI_API_BASE_URL=<ApiEndpoint>"
echo "3. Enable Bedrock model access in AWS Console (if not already enabled)"
echo "4. Seed DynamoDB with sample data (optional for testing)"
