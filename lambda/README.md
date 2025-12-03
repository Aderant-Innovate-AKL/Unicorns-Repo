# AI-Powered Name Reconciliation for Expert File Opening

This directory contains the AWS Lambda function that powers AI-based name reconciliation
and conflicts checking.

## Architecture

- **AWS Lambda**: Serverless function handling reconciliation requests
- **Amazon Bedrock**: Claude 3 Sonnet for intelligent name matching
- **DynamoDB**: Storage for existing entities (clients, parties, contacts)
- **API Gateway**: RESTful API endpoint

## How It Works

### Traditional Approach (Old)

```sql
-- SQL Soundex query
SELECT * FROM clients
WHERE SOUNDEX(name) = SOUNDEX('John Smith')
```

### AI-Powered Approach (New)

The Lambda function uses Amazon Bedrock with Claude to:

1. **Understand context**: Recognizes nicknames, abbreviations, corporate suffixes
2. **Fuzzy matching**: Handles typos, different orderings, phonetic similarities
3. **Confidence scoring**: Provides 0-100 match scores with explanations
4. **Smart recommendations**: Suggests merge, create new, or manual review

## Features

- ✅ Replaces SQL soundex with ML-powered matching
- ✅ Handles spelling variations and typos
- ✅ Recognizes nicknames (Bob = Robert)
- ✅ Corporate entity matching (ABC Corp = ABC Corporation)
- ✅ Name order flexibility (Smith, John = John Smith)
- ✅ Phonetic similarity detection
- ✅ Automated conflicts checking
- ✅ Confidence scores with explanations

## Deployment

### Prerequisites

1. **AWS SAM CLI** installed
2. **AWS credentials** configured
3. **Bedrock access** enabled in your AWS account

### Deploy

```bash
# Build the Lambda function
sam build

# Deploy to AWS
sam deploy --guided

# Or deploy to specific environment
sam deploy \
  --parameter-overrides Environment=dev \
  --stack-name name-reconciliation-dev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Configure Frontend

After deployment, update your `.env.development`:

```bash
UI_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## API Endpoints

### POST /api/reconcile

Reconcile entity names with AI-powered matching.

**Request:**

```json
{
  "entities": [
    {
      "name": "John Smith",
      "entityType": "client"
    }
  ],
  "threshold": 70,
  "includeConflictsCheck": true
}
```

**Response:**

```json
{
  "results": [
    {
      "inputEntity": {
        "name": "John Smith",
        "entityType": "client"
      },
      "matches": [
        {
          "existingId": "CLI-001",
          "existingName": "John E. Smith",
          "matchScore": 92,
          "matchReason": "High confidence - similar name structure",
          "suggestedAction": "merge"
        }
      ],
      "recommendation": "use_existing"
    }
  ],
  "conflictsReport": {
    "hasConflicts": false,
    "conflicts": [],
    "riskLevel": "none"
  },
  "processingTime": 1247
}
```

## Environment Variables

| Variable              | Description             | Default                                   |
| --------------------- | ----------------------- | ----------------------------------------- |
| `BEDROCK_MODEL_ID`    | Amazon Bedrock model ID | `anthropic.claude-3-sonnet-20240229-v1:0` |
| `ENTITIES_TABLE_NAME` | DynamoDB table name     | `ExpertEntities-{env}`                    |
| `AWS_REGION`          | AWS region              | `us-east-1`                               |

## Cost Optimization

- **Lambda**: Pay per request (~$0.20 per 1M requests)
- **Bedrock**: Pay per token (~$3 per 1M input tokens for Claude Sonnet)
- **DynamoDB**: On-demand pricing (pay per read/write)

**Estimated cost**: ~$10-20/month for typical usage (hundreds of reconciliations/day)

## Development

### Local Testing

```bash
# Install dependencies
pip install -r lambda/name-reconciliation/requirements.txt

# Test locally
sam local invoke NameReconciliationFunction -e test-event.json

# Start local API
sam local start-api
```

### Test Event

Create `test-event.json`:

```json
{
  "body": "{\"entities\":[{\"name\":\"John Smith\",\"entityType\":\"client\"}],\"threshold\":70}"
}
```

## Monitoring

View logs in CloudWatch:

```bash
aws logs tail /aws/lambda/name-reconciliation-dev --follow
```

## Seeding Data

To seed the DynamoDB table with sample entities:

```bash
aws dynamodb put-item \
  --table-name ExpertEntities-dev \
  --item file://sample-entities.json
```

## Security

- Enable API Gateway API keys in production
- Use AWS WAF for rate limiting
- Enable CloudWatch alarms for errors
- Use VPC endpoints for DynamoDB access
- Implement IAM roles with least privilege

## Next Steps

1. Deploy the Lambda function
2. Seed DynamoDB with existing entities
3. Test the API endpoint
4. Connect frontend to the API
5. Monitor usage and costs
