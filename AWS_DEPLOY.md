# ain/verify - AWS Deployment Guide

This guide provides detailed instructions for deploying ain/verify to AWS.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Initial AWS Setup](#initial-aws-setup)
4. [Terraform State Backend](#terraform-state-backend)
5. [Configuration](#configuration)
6. [Infrastructure Deployment](#infrastructure-deployment)
7. [Database Setup](#database-setup)
8. [Application Deployment](#application-deployment)
9. [DNS and SSL Configuration](#dns-and-ssl-configuration)
10. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
11. [Post-Deployment Verification](#post-deployment-verification)
12. [Monitoring and Logging](#monitoring-and-logging)
13. [Scaling](#scaling)
14. [Troubleshooting](#troubleshooting)
15. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

```
                                    ┌─────────────────┐
                                    │   CloudFront    │
                                    │   Distribution  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
           │  S3 (Static)  │        │      ALB      │        │ S3 (Evidence) │
           │   Frontend    │        │               │        │    Files      │
           └───────────────┘        └───────┬───────┘        └───────────────┘
                                            │
                                    ┌───────┴───────┐
                                    │  ECS Fargate  │
                                    │   (Backend)   │
                                    └───────┬───────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
           ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
           │  RDS Postgres │       │  ElastiCache  │       │      SQS      │
           │               │       │    Redis      │       │   Job Queue   │
           └───────────────┘       └───────────────┘       └───────────────┘
```

### AWS Services Used

| Service | Purpose | Environment Config |
|---------|---------|-------------------|
| **ECS Fargate** | Backend API containers | 2 tasks (prod), 1 task (dev) |
| **RDS PostgreSQL 16** | Primary database | Multi-AZ (prod), Single-AZ (dev) |
| **ElastiCache Redis** | Caching, rate limiting | Single node |
| **S3** | Static frontend, evidence files | Standard storage |
| **CloudFront** | CDN, SSL termination | Global edge locations |
| **ALB** | Load balancing for backend | HTTPS with ACM cert |
| **SQS** | Background job queue | Standard queue with DLQ |
| **Secrets Manager** | DB password, JWT secret | Automatic rotation capable |
| **ECR** | Docker image registry | Keep last 10 images |
| **CloudWatch** | Logs, metrics | 30-day retention |

---

## Prerequisites

### Required Tools

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io/downloads

# Install AWS CLI
brew install awscli  # macOS
# or: pip install awscli

# Verify installations
terraform --version  # >= 1.0
aws --version        # >= 2.0
```

### AWS Account Requirements

- AWS account with admin access (or IAM user with required permissions)
- Ability to create: VPC, RDS, ElastiCache, ECS, S3, CloudFront, IAM roles
- Service quota for desired resources

### Required Information

Before starting, gather:

| Item | Description | Example |
|------|-------------|---------|
| Domain name | Your application domain | `verify.example.com` |
| Google OAuth credentials | From Google Cloud Console | Client ID + Secret |
| GitHub OAuth credentials | From GitHub Developer Settings | Client ID + Secret |
| AWS region | Deployment region | `us-east-1` |

---

## Initial AWS Setup

### 1. Create IAM User for Terraform

```bash
# Create IAM user
aws iam create-user --user-name ain-verify-terraform

# Create access keys
aws iam create-access-key --user-name ain-verify-terraform
# Save AccessKeyId and SecretAccessKey securely!

# Attach administrator policy (or create custom policy for least privilege)
aws iam attach-user-policy \
  --user-name ain-verify-terraform \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### 2. Configure AWS CLI

```bash
# Configure default profile or named profile
aws configure --profile ain-verify
# Enter:
#   AWS Access Key ID: <from step 1>
#   AWS Secret Access Key: <from step 1>
#   Default region: us-east-1
#   Default output format: json

# Set profile for subsequent commands
export AWS_PROFILE=ain-verify
```

### 3. Create IAM User for CI/CD (GitHub Actions)

```bash
# Create user for CI/CD
aws iam create-user --user-name ain-verify-cicd

# Create custom policy for CI/CD
cat > /tmp/cicd-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ain-verify-*-static",
        "arn:aws:s3:::ain-verify-*-static/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/ain-verify-*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name ain-verify-cicd-policy \
  --policy-document file:///tmp/cicd-policy.json

# Attach policy
aws iam attach-user-policy \
  --user-name ain-verify-cicd \
  --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/ain-verify-cicd-policy

# Create access keys
aws iam create-access-key --user-name ain-verify-cicd
# Save these for GitHub Actions secrets
```

---

## Terraform State Backend

Terraform state must be stored remotely for team collaboration.

### 1. Create S3 Bucket for State

```bash
# Create bucket (bucket names must be globally unique)
aws s3api create-bucket \
  --bucket ain-verify-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ain-verify-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ain-verify-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket ain-verify-terraform-state \
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }'
```

### 2. Create DynamoDB Table for State Locking

```bash
aws dynamodb create-table \
  --table-name ain-verify-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Configuration

### 1. Create Terraform Variables File

Navigate to the infrastructure directory:

```bash
cd infrastructure/terraform
```

Create a `terraform.tfvars` file for your environment:

```hcl
# terraform.tfvars

# Basic configuration
aws_region  = "us-east-1"
environment = "prod"  # or "staging", "dev"

# Domain (optional, but recommended for production)
domain_name     = "verify.example.com"
certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abc-123"

# Database sizing
db_instance_class    = "db.t3.medium"  # prod: db.t3.medium, dev: db.t3.micro
db_allocated_storage = 20              # GB

# Redis sizing
redis_node_type = "cache.t3.micro"  # prod: cache.t3.small

# ECS sizing
backend_cpu           = 512   # prod: 1024
backend_memory        = 1024  # prod: 2048
backend_desired_count = 2     # prod: 2, dev: 1

# OAuth credentials (sensitive - consider using environment variables)
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
github_client_id     = "your-github-client-id"
github_client_secret = "your-github-client-secret"
```

### 2. Environment-Specific Files (Optional)

For multiple environments, create separate files:

```bash
# dev.tfvars
environment           = "dev"
db_instance_class     = "db.t3.micro"
db_allocated_storage  = 20
redis_node_type       = "cache.t3.micro"
backend_cpu           = 256
backend_memory        = 512
backend_desired_count = 1

# prod.tfvars
environment           = "prod"
db_instance_class     = "db.t3.medium"
db_allocated_storage  = 50
redis_node_type       = "cache.t3.small"
backend_cpu           = 1024
backend_memory        = 2048
backend_desired_count = 2
domain_name           = "verify.example.com"
certificate_arn       = "arn:aws:acm:..."
```

### 3. Sensitive Variables via Environment

For security, set sensitive variables via environment:

```bash
export TF_VAR_google_client_id="your-google-client-id"
export TF_VAR_google_client_secret="your-google-client-secret"
export TF_VAR_github_client_id="your-github-client-id"
export TF_VAR_github_client_secret="your-github-client-secret"
```

---

## Infrastructure Deployment

### 1. Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize with backend configuration
terraform init
```

Expected output:
```
Initializing the backend...
Successfully configured the backend "s3"!

Terraform has been successfully initialized!
```

### 2. Review the Plan

```bash
# For default (using terraform.tfvars)
terraform plan

# For specific environment
terraform plan -var-file="prod.tfvars"
```

Review the output carefully. You should see resources for:
- VPC, subnets, NAT gateway
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- ECS cluster, task definition, service
- ALB, target group, listeners
- S3 buckets (static, evidence)
- CloudFront distribution
- SQS queues
- Security groups
- IAM roles
- Secrets Manager secrets

### 3. Apply Infrastructure

```bash
# Apply with approval prompt
terraform apply -var-file="prod.tfvars"

# Type 'yes' when prompted
```

**This takes approximately 15-20 minutes** due to RDS and ElastiCache provisioning.

### 4. Save Outputs

```bash
# View all outputs
terraform output

# Save outputs to file
terraform output -json > terraform-outputs.json

# Key outputs you'll need:
terraform output ecr_repository_url
terraform output alb_dns_name
terraform output cloudfront_domain_name
terraform output rds_endpoint
terraform output s3_static_bucket
```

---

## Database Setup

### 1. Connect to RDS (Optional - for manual setup)

The RDS instance is in a private subnet, so you need a bastion host or VPN:

```bash
# Option 1: Use ECS Exec to connect from a running task
aws ecs execute-command \
  --cluster ain-verify-prod-cluster \
  --task <task-id> \
  --container backend \
  --interactive \
  --command "/bin/sh"

# Then inside the container:
psql $DATABASE_URL
```

### 2. Run Migrations

Migrations run automatically when the backend starts, but you can run manually:

```bash
# Build and push initial image first (see Application Deployment)
# Then run a one-off task for migrations

aws ecs run-task \
  --cluster ain-verify-prod-cluster \
  --task-definition ain-verify-prod-backend \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxx", "subnet-yyy"],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "DISABLED"
    }
  }' \
  --overrides '{
    "containerOverrides": [{
      "name": "backend",
      "command": ["alembic", "upgrade", "head"]
    }]
  }'
```

---

## Application Deployment

### 1. Build and Push Backend Image

```bash
# Get ECR repository URL
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URL

# Build image
cd packages/backend
docker build -t ain-verify-backend .

# Tag image
docker tag ain-verify-backend:latest $ECR_URL:latest
docker tag ain-verify-backend:latest $ECR_URL:$(git rev-parse --short HEAD)

# Push image
docker push $ECR_URL:latest
docker push $ECR_URL:$(git rev-parse --short HEAD)
```

### 2. Update ECS Service

```bash
# Force new deployment with latest image
aws ecs update-service \
  --cluster ain-verify-prod-cluster \
  --service ain-verify-prod-backend \
  --force-new-deployment

# Watch deployment progress
aws ecs wait services-stable \
  --cluster ain-verify-prod-cluster \
  --services ain-verify-prod-backend
```

### 3. Build and Deploy Frontend

```bash
cd packages/frontend

# Install dependencies
npm ci

# Build for production
NEXT_PUBLIC_API_URL=https://api.verify.example.com npm run build

# Export static files (if using static export)
npm run export

# Get S3 bucket name
S3_BUCKET=$(cd ../infrastructure/terraform && terraform output -raw s3_static_bucket)

# Upload to S3
aws s3 sync out/ s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(cd ../infrastructure/terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

---

## DNS and SSL Configuration

### 1. Request ACM Certificate

```bash
# Request certificate (must be in us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name verify.example.com \
  --subject-alternative-names "*.verify.example.com" \
  --validation-method DNS \
  --region us-east-1

# Note the CertificateArn in the output
```

### 2. Validate Certificate

Get the DNS validation records:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --query 'Certificate.DomainValidationOptions' \
  --region us-east-1
```

Add the CNAME records to your DNS provider. Wait for validation (can take 5-30 minutes).

### 3. Configure DNS Records

Add these DNS records at your registrar/DNS provider:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| CNAME | verify.example.com | d123xxx.cloudfront.net | Frontend |
| CNAME | api.verify.example.com | ain-verify-xxx.us-east-1.elb.amazonaws.com | Backend API |

Or if using Route 53:

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name example.com \
  --caller-reference $(date +%s)

# Add CloudFront alias record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "verify.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123xxx.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

### 4. Update Terraform with Certificate ARN

Add the certificate ARN to your `terraform.tfvars`:

```hcl
certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abc-123"
domain_name     = "verify.example.com"
```

Re-apply Terraform:

```bash
terraform apply -var-file="prod.tfvars"
```

---

## CI/CD Pipeline Setup

### 1. Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions.

Add these **Repository Secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | From CI/CD IAM user | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | From CI/CD IAM user | AWS credentials |

### 2. Configure GitHub Environments

Create environments for staging and production:

1. Go to Settings → Environments
2. Create `staging` environment
3. Create `prod` environment with required reviewers

For each environment, add **Environment Variables**:

| Variable | Staging Value | Production Value |
|----------|---------------|------------------|
| `API_URL` | https://api-staging.example.com | https://api.example.com |
| `S3_BUCKET` | ain-verify-staging-static | ain-verify-prod-static |
| `CLOUDFRONT_DISTRIBUTION_ID` | E1234567890 | E0987654321 |

### 3. Deployment Workflow

The CI/CD pipeline (`.github/workflows/deploy.yml`) will:

1. **On push to main**: Deploy to staging automatically
2. **Manual trigger**: Deploy to specified environment

To trigger a production deployment:

1. Go to Actions → Deploy
2. Click "Run workflow"
3. Select `prod` environment
4. Click "Run workflow"

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://api.verify.example.com/health
# Expected: {"status":"healthy"}

# API documentation
open https://api.verify.example.com/docs

# Frontend
open https://verify.example.com
```

### 2. Test OAuth Flow

1. Go to https://verify.example.com
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect back to application

### 3. Test Core Functionality

```bash
# Create a test claim (requires authentication)
curl -X POST https://api.verify.example.com/api/v1/claims \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"statement": "Test claim", "complexity_tier": "simple", "tags": ["test"]}'

# List claims (public)
curl https://api.verify.example.com/api/v1/claims

# Get leaderboard (public)
curl https://api.verify.example.com/api/v1/leaderboard
```

### 4. Check Logs

```bash
# View ECS task logs
aws logs tail /ecs/ain-verify-prod-backend --follow

# View recent errors
aws logs filter-log-events \
  --log-group-name /ecs/ain-verify-prod-backend \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## Monitoring and Logging

### 1. CloudWatch Dashboards

Create a dashboard in CloudWatch console or via CLI:

```bash
# Key metrics to monitor:
# - ECS: CPUUtilization, MemoryUtilization
# - RDS: CPUUtilization, FreeableMemory, DatabaseConnections
# - ElastiCache: CPUUtilization, NetworkBytesIn/Out
# - ALB: HealthyHostCount, RequestCount, HTTPCode_Target_5XX_Count
```

### 2. CloudWatch Alarms

```bash
# Example: High CPU alarm for ECS
aws cloudwatch put-metric-alarm \
  --alarm-name "ain-verify-prod-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --dimensions Name=ClusterName,Value=ain-verify-prod-cluster Name=ServiceName,Value=ain-verify-prod-backend \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts
```

### 3. Log Insights Queries

```sql
-- Error rate in last hour
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)

-- Slow requests (> 1s)
fields @timestamp, @message
| parse @message '"duration":*,' as duration
| filter duration > 1000
| sort @timestamp desc
```

---

## Scaling

### 1. ECS Auto Scaling

Add auto-scaling to the ECS service:

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ain-verify-prod-cluster/ain-verify-prod-backend \
  --min-capacity 2 \
  --max-capacity 10

# Add CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ain-verify-prod-cluster/ain-verify-prod-backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'
```

### 2. RDS Scaling

For vertical scaling, modify the instance class:

```bash
aws rds modify-db-instance \
  --db-instance-identifier ain-verify-prod-postgres \
  --db-instance-class db.t3.large \
  --apply-immediately
```

For read scaling, add read replicas:

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier ain-verify-prod-postgres-replica \
  --source-db-instance-identifier ain-verify-prod-postgres
```

---

## Troubleshooting

### Common Issues

#### ECS Tasks Failing to Start

```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster ain-verify-prod-cluster \
  --tasks <task-arn> \
  --query 'tasks[0].stoppedReason'

# Check logs
aws logs tail /ecs/ain-verify-prod-backend --since 10m
```

**Common causes:**
- Container can't pull image → Check ECR permissions
- Health check failing → Check `/health` endpoint
- Database connection failed → Check security groups, RDS status

#### Database Connection Issues

```bash
# Verify RDS is running
aws rds describe-db-instances \
  --db-instance-identifier ain-verify-prod-postgres \
  --query 'DBInstances[0].DBInstanceStatus'

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxx \
  --query 'SecurityGroups[0].IpPermissions'
```

#### Redis Connection Issues

```bash
# Check ElastiCache status
aws elasticache describe-replication-groups \
  --replication-group-id ain-verify-prod-redis \
  --query 'ReplicationGroups[0].Status'
```

#### 502/504 Errors from ALB

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...:targetgroup/...

# Check ECS service events
aws ecs describe-services \
  --cluster ain-verify-prod-cluster \
  --services ain-verify-prod-backend \
  --query 'services[0].events[:5]'
```

### Rollback Procedures

#### Rollback ECS Deployment

```bash
# List recent task definitions
aws ecs list-task-definitions \
  --family-prefix ain-verify-prod-backend \
  --sort DESC \
  --max-items 5

# Update service to previous version
aws ecs update-service \
  --cluster ain-verify-prod-cluster \
  --service ain-verify-prod-backend \
  --task-definition ain-verify-prod-backend:123  # previous revision
```

#### Rollback Frontend

```bash
# List S3 object versions
aws s3api list-object-versions \
  --bucket ain-verify-prod-static \
  --prefix index.html

# Restore previous version
aws s3api copy-object \
  --bucket ain-verify-prod-static \
  --copy-source ain-verify-prod-static/index.html?versionId=xxx \
  --key index.html
```

---

## Cost Optimization

### Estimated Monthly Costs (Production)

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| ECS Fargate | 2 tasks × 1 vCPU × 2GB | ~$70 |
| RDS PostgreSQL | db.t3.medium, 50GB | ~$50 |
| ElastiCache Redis | cache.t3.small | ~$25 |
| ALB | Basic usage | ~$20 |
| CloudFront | 100GB transfer | ~$10 |
| S3 | 10GB storage | ~$1 |
| NAT Gateway | Basic usage | ~$35 |
| **Total** | | **~$210/month** |

### Cost Reduction Tips

1. **Development environments**: Use smaller instances, single tasks
2. **Spot instances**: Use FARGATE_SPOT for non-critical workloads
3. **Reserved capacity**: Purchase RDS reserved instances for 30-50% savings
4. **NAT Gateway alternatives**: Consider NAT instances for dev environments
5. **Right-sizing**: Monitor utilization and adjust instance sizes

---

## Appendix: Quick Reference Commands

```bash
# View all resources
terraform state list

# Destroy infrastructure (CAUTION!)
terraform destroy -var-file="prod.tfvars"

# Force ECS deployment
aws ecs update-service --cluster ain-verify-prod-cluster --service ain-verify-prod-backend --force-new-deployment

# Scale ECS manually
aws ecs update-service --cluster ain-verify-prod-cluster --service ain-verify-prod-backend --desired-count 4

# View RDS logs
aws rds describe-db-log-files --db-instance-identifier ain-verify-prod-postgres

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123 --paths "/*"

# Get secrets
aws secretsmanager get-secret-value --secret-id ain-verify-prod-db-password --query SecretString --output text
```
