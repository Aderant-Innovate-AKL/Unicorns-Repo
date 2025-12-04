# Architecture Documentation Index

This directory contains detailed architecture diagrams and documentation for the
AI-Powered Name Reconciliation system.

## Document Overview

### 01. System Architecture

**File**: [01-system-architecture.md](./01-system-architecture.md)

Complete end-to-end architecture showing all components, data flows, and AWS services.

**Key Topics**:

- Frontend (React + MUI)
- API Gateway (Application Load Balancer)
- Compute Layer (ECS Fargate)
- Vector Database (Amazon OpenSearch)
- AI/ML Services (Amazon Bedrock)
- Data Storage (DynamoDB)
- Monitoring & Logging (CloudWatch)
- Security (IAM, Secrets Manager)

---

### 02. Reconciliation Flow

**File**: [02-reconciliation-flow.md](./02-reconciliation-flow.md)

Step-by-step sequence diagram of a name reconciliation request.

**Key Topics**:

- User input to API request
- Vector embedding generation
- k-NN semantic search
- AI-powered match analysis
- Response formatting
- Performance metrics

---

### 03. Ingestion Pipeline

**File**: [03-ingestion-pipeline.md](./03-ingestion-pipeline.md)

Data synchronization from Expert SQL Server to vector database.

**Key Topics**:

- EventBridge scheduling
- Delta sync strategy
- Batch processing
- Vector embedding generation
- OpenSearch bulk indexing
- Error handling and retries

---

### 04. Vector Database

**File**: [04-vector-database.md](./04-vector-database.md)

Amazon OpenSearch configuration for vector similarity search.

**Key Topics**:

- Index mapping and configuration
- HNSW algorithm parameters
- Cosine similarity scoring
- Performance characteristics
- Scaling recommendations
- Maintenance tasks

---

### 05. Logging and Monitoring

**File**: [05-logging-monitoring.md](./05-logging-monitoring.md)

CloudWatch logging, metrics, and alerting architecture.

**Key Topics**:

- Log group structure
- CloudWatch Insights queries
- Metric filters
- Alarm configurations
- SNS notifications
- Cost optimization

---

### 06. Deployment Architecture

**File**: [06-deployment-architecture.md](./06-deployment-architecture.md)

AWS infrastructure deployment across regions and availability zones.

**Key Topics**:

- VPC and networking
- Security groups
- ECS Fargate configuration
- Load balancer setup
- Auto-scaling policies
- High availability strategy
- Deployment pipeline

---

## Quick Reference

### Technology Stack

| Component     | Technology                          |
| ------------- | ----------------------------------- |
| Frontend      | React 19 + Material-UI + TypeScript |
| API Framework | FastAPI + Uvicorn                   |
| Compute       | AWS ECS Fargate                     |
| Load Balancer | Application Load Balancer           |
| Vector Search | Amazon OpenSearch (k-NN)            |
| AI Model      | Amazon Bedrock (Claude 3 Sonnet)    |
| Embeddings    | Amazon Bedrock (Titan)              |
| Database      | Amazon DynamoDB                     |
| Logging       | CloudWatch Logs                     |
| Monitoring    | CloudWatch Metrics + Alarms         |
| Tracing       | AWS X-Ray                           |
| Secrets       | AWS Secrets Manager                 |
| IaC           | AWS Copilot CLI                     |

### Key Endpoints

- **Reconciliation API**: `POST /api/reconcile`
- **Conflicts Check**: `POST /api/conflicts/check`
- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs`

### Data Flow Summary

```
User Input
  ?
React Frontend
  ?
Application Load Balancer
  ?
ECS Fargate (FastAPI)
  ?
???????????????????????????????
? 1. Generate Query Embedding ? ? Bedrock Titan
? 2. k-NN Vector Search       ? ? OpenSearch
? 3. Fetch Metadata           ? ? DynamoDB
? 4. AI Match Analysis        ? ? Bedrock Claude
???????????????????????????????
  ?
JSON Response
  ?
Display Results
```

### Ingestion Flow Summary

```
EventBridge Scheduler (Hourly)
  ?
ECS Fargate (Ingestion Task)
  ?
Expert SQL Server (Delta Query)
  ?
????????????????????????????????
? Batch of 100 Entities        ?
?   ?                          ?
? Generate Embeddings (Bedrock)?
?   ?                          ?
? Store Vectors (OpenSearch)   ?
?   ?                          ?
? Store Metadata (DynamoDB)    ?
????????????????????????????????
  ?
CloudWatch Logs
```

### Cost Estimates (Monthly)

| Category                  | Cost            |
| ------------------------- | --------------- |
| ECS Fargate               | $15.50          |
| Application Load Balancer | $20.00          |
| Amazon OpenSearch         | $35.00          |
| Amazon Bedrock            | $20.00          |
| DynamoDB                  | $2.00           |
| CloudWatch                | $9.00           |
| Networking (NAT Gateway)  | $32.00          |
| **Total**                 | **~$134/month** |

### Performance Metrics

| Metric                | Value               |
| --------------------- | ------------------- |
| API Response Time     | 2-4 seconds         |
| Vector Search Latency | 50ms                |
| Embedding Generation  | 200ms               |
| AI Match Analysis     | 1.5-3 seconds       |
| Ingestion Throughput  | 110 entities/second |
| k-NN Recall           | >95%                |

## Viewing Diagrams

All diagrams in this directory are written in **Mermaid** format. You can view them in:

### GitHub

- Diagrams render automatically when viewing `.md` files on GitHub

### VS Code

1. Install "Markdown Preview Mermaid Support" extension
2. Open any diagram file
3. Press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)

### Online Viewers

- [Mermaid Live Editor](https://mermaid.live/)
- Copy/paste diagram code to preview

### Exporting

Use the Mermaid CLI to export diagrams as images:

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Export as PNG
mmdc -i docs/01-system-architecture.md -o architecture.png

# Export as SVG
mmdc -i docs/01-system-architecture.md -o architecture.svg
```

## Contributing

When adding or updating diagrams:

1. Use consistent color scheme (defined in theme variables)
2. Include clear labels and descriptions
3. Add supporting documentation below the diagram
4. Update this README with new diagram references
5. Test diagram rendering in GitHub preview

## Version History

| Version | Date     | Changes                                                         |
| ------- | -------- | --------------------------------------------------------------- |
| 2.0     | Jan 2024 | Split into separate diagram files, added detailed documentation |
| 1.0     | Dec 2023 | Initial architecture diagram                                    |

---

**Maintained By**: Aderant Hackathon Team  
**Last Updated**: January 2024
