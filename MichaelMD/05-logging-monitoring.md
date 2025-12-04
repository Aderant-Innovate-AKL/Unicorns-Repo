# Logging and Monitoring Architecture

This diagram shows how logs flow from application code to CloudWatch and alerting systems.

```mermaid
graph TB
    subgraph "Log Sources"
        APP[Application Logs<br/>Python print statements]
        ECS[ECS Task Logs<br/>Container stdout/stderr]
        ALB_LOG[ALB Access Logs<br/>S3 Bucket]
    end

    subgraph "CloudWatch Logs"
        LG1[/copilot/reconciliation-api<br/>Retention: 30 days]
        LG2[/copilot/ingestion-service<br/>Retention: 30 days]
        LG3[/aws/ecs/cluster<br/>Retention: 7 days]
    end

    subgraph "Log Processing"
        INSIGHTS[CloudWatch Insights<br/>SQL-like Queries<br/>Pattern Analysis]
        METRIC[Metric Filters<br/>Error Count<br/>Latency p95]
    end

    subgraph "Alerting"
        ALARM[CloudWatch Alarms<br/>Error Rate > 5%<br/>Latency > 2s]
        SNS[SNS Topic<br/>Email/Slack Notifications]
    end

    APP --> LG1
    ECS --> LG1
    ECS --> LG2
    ECS --> LG3
    ALB_LOG --> LG1

    LG1 --> INSIGHTS
    LG2 --> INSIGHTS
    LG1 --> METRIC
    LG2 --> METRIC

    METRIC --> ALARM
    ALARM --> SNS

    style APP fill:#ff5722,stroke:#bf360c,color:#fff
    style ECS fill:#ff5722,stroke:#bf360c,color:#fff
    style ALB_LOG fill:#ff5722,stroke:#bf360c,color:#fff
    style LG1 fill:#ff9800,stroke:#e65100,color:#fff
    style LG2 fill:#ff9800,stroke:#e65100,color:#fff
    style LG3 fill:#ff9800,stroke:#e65100,color:#fff
    style INSIGHTS fill:#ffc107,stroke:#f57f17,color:#000
    style METRIC fill:#ffc107,stroke:#f57f17,color:#000
    style ALARM fill:#f44336,stroke:#b71c1c,color:#fff
    style SNS fill:#f44336,stroke:#b71c1c,color:#fff
```

## CloudWatch Log Groups

### Reconciliation API Logs

**Log Group**: `/copilot/reconciliation-api`

```
2024/01/15/task-abc123
??? 14:23:01 INFO: Request received: POST /api/reconcile
??? 14:23:01 DEBUG: Generating embedding for 'John Smith'
??? 14:23:02 DEBUG: OpenSearch query returned 18 candidates
??? 14:23:02 DEBUG: DynamoDB BatchGetItem: 18 items
??? 14:23:03 INFO: Bedrock InvokeModel: claude-3-sonnet
??? 14:23:05 INFO: Match scores: [95, 87, 72, ...]
??? 14:23:05 INFO: Response sent: 200 OK (4.2s)
```

### Ingestion Service Logs

**Log Group**: `/copilot/ingestion-service`

```
2024/01/15/task-def456
??? 15:00:00 INFO: Ingestion started (scheduled)
??? 15:00:01 INFO: Retrieved 5,234 entities from Expert
??? 15:00:05 INFO: Batch 1/53 completed (100 entities)
??? 15:00:10 INFO: Batch 2/53 completed (100 entities)
??? ...
??? 15:02:45 INFO: Ingestion completed: 5,234 entities (2m 45s)
```

### ECS Cluster Logs

**Log Group**: `/aws/ecs/hackathon-ui-template-dev`

```
??? Container health checks
??? Task state changes (RUNNING, STOPPED)
??? Service events (deployments, scaling)
```

## CloudWatch Insights Queries

### Top Errors

```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by @message
| sort count desc
| limit 10
```

### API Latency Analysis

```sql
fields @timestamp, processingTime
| filter @message like /Response sent/
| parse @message "Response sent: * (*s)" as status, duration
| stats avg(duration), max(duration), p95(duration) by bin(5m)
```

### Bedrock Usage Tracking

```sql
fields @timestamp, @message
| filter @message like /Bedrock InvokeModel/
| stats count() as calls by bin(1h)
```

### Failed Ingestion Batches

```sql
fields @timestamp, @message
| filter @message like /Batch.*failed/
| parse @message "Batch */53 failed" as batchNum
| display @timestamp, batchNum, @message
```

## Metric Filters

### Error Rate Metric

**Pattern**: `[..., level=ERROR, ...]`

```json
{
  "filterName": "ErrorRate",
  "filterPattern": "[..., level=ERROR, ...]",
  "metricTransformations": [
    {
      "metricName": "ErrorCount",
      "metricNamespace": "NameReconciliation",
      "metricValue": "1",
      "defaultValue": 0
    }
  ]
}
```

### API Latency Metric

**Pattern**: `Response sent: * (*s)`

```json
{
  "filterName": "APILatency",
  "filterPattern": "[..., msg=\"Response sent:\", status, duration=*s]",
  "metricTransformations": [
    {
      "metricName": "ResponseTime",
      "metricNamespace": "NameReconciliation",
      "metricValue": "$duration",
      "unit": "Seconds"
    }
  ]
}
```

## CloudWatch Alarms

### High Error Rate

```yaml
AlarmName: NameReconciliation-HighErrorRate
MetricName: ErrorCount
Namespace: NameReconciliation
Statistic: Sum
Period: 300 # 5 minutes
EvaluationPeriods: 2
Threshold: 10
ComparisonOperator: GreaterThanThreshold
AlarmActions:
  - !Ref AlertingSNSTopic
```

### High API Latency

```yaml
AlarmName: NameReconciliation-HighLatency
MetricName: ResponseTime
Namespace: NameReconciliation
Statistic: Average
Period: 300
EvaluationPeriods: 2
Threshold: 5.0 # 5 seconds
ComparisonOperator: GreaterThanThreshold
AlarmActions:
  - !Ref AlertingSNSTopic
```

### ECS Task Health

```yaml
AlarmName: NameReconciliation-TaskUnhealthy
MetricName: HealthyHostCount
Namespace: AWS/ApplicationELB
Statistic: Minimum
Period: 60
EvaluationPeriods: 2
Threshold: 1
ComparisonOperator: LessThanThreshold
AlarmActions:
  - !Ref AlertingSNSTopic
```

### Bedrock Throttling

```yaml
AlarmName: NameReconciliation-BedrockThrottled
MetricName: ModelInvocationThrottles
Namespace: AWS/Bedrock
Statistic: Sum
Period: 300
EvaluationPeriods: 1
Threshold: 5
ComparisonOperator: GreaterThanThreshold
AlarmActions:
  - !Ref AlertingSNSTopic
```

## SNS Notification Configuration

### Email Alerts

```json
{
  "Protocol": "email",
  "Endpoint": "devops-team@company.com",
  "FilterPolicy": {
    "severity": ["CRITICAL", "HIGH"]
  }
}
```

### Slack Integration

```json
{
  "Protocol": "https",
  "Endpoint": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "FilterPolicy": {
    "severity": ["CRITICAL", "HIGH", "MEDIUM"]
  }
}
```

## Accessing Logs

### AWS Console

```
1. Navigate to CloudWatch ? Logs ? Log groups
2. Select: /copilot/reconciliation-api
3. Click "Search log group"
4. Enter filter pattern or use Insights
```

### AWS CLI

```bash
# Tail logs in real-time
aws logs tail /copilot/reconciliation-api --follow

# Get last 1 hour of logs
aws logs tail /copilot/reconciliation-api --since 1h

# Filter by pattern
aws logs filter-log-events \
  --log-group-name /copilot/reconciliation-api \
  --filter-pattern "ERROR"
```

### Copilot CLI

```bash
# Stream live logs
copilot svc logs --name reconciliation-api --follow

# Last hour
copilot svc logs --name reconciliation-api --since 1h

# Specific time range
copilot svc logs --name reconciliation-api \
  --start-time 2024-01-15T14:00:00Z \
  --end-time 2024-01-15T15:00:00Z
```

## Log Retention Strategy

| Log Group                     | Retention | Reason                    |
| ----------------------------- | --------- | ------------------------- |
| `/copilot/reconciliation-api` | 30 days   | Application debugging     |
| `/copilot/ingestion-service`  | 30 days   | Data sync troubleshooting |
| `/aws/ecs/cluster`            | 7 days    | Infrastructure events     |
| ALB Access Logs (S3)          | 90 days   | Compliance requirements   |

## Cost Optimization

### Current Monthly Costs

- **10 GB ingested**: $5.00
- **10 GB stored**: $0.30
- **10 custom metrics**: $3.00
- **10 alarms**: $1.00
- **Total**: ~$9.30/month

### Optimization Tips

1. **Reduce Log Verbosity**: Remove DEBUG logs in production
2. **Shorter Retention**: 7 days for non-critical logs
3. **Sample Logs**: Only log 10% of successful requests
4. **Compress Old Logs**: Export to S3 Glacier for long-term storage

---

**Version:** 2.0  
**Last Updated:** January 2024
