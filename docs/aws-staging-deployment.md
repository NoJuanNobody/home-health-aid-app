# AWS Staging Deployment Strategy

## Overview
This document outlines the deployment strategy for the Home Health Aid application in a staging environment on AWS.

## Architecture

### Infrastructure Components
- **Backend API**: ECS Fargate (Flask) behind Application Load Balancer
- **Frontend Web**: React SPA served via CloudFront from S3
- **Database**: RDS PostgreSQL in private subnets
- **Network**: VPC with public/private subnets, NAT Gateway for egress
- **Secrets**: AWS Secrets Manager for sensitive configuration
- **Monitoring**: CloudWatch Logs and Alarms
- **Scheduled Jobs**: EventBridge → ECS RunTask for background tasks

### Network Architecture
```
Internet
    ↓
CloudFront (Frontend) + ALB (Backend)
    ↓
S3 (Static Files) + ECS Fargate (API)
    ↓
RDS PostgreSQL (Private Subnet)
```

## Prerequisites

### AWS Account Setup
- AWS CLI configured with appropriate permissions
- IAM user/role with admin access for initial setup
- Domain names registered in Route 53 (or external provider)

### Required Tools
- AWS CLI v2
- Docker
- Terraform (optional, for infrastructure as code)
- kubectl (if using EKS instead of ECS)

## Infrastructure Setup

### 1. VPC and Networking

```bash
# Create VPC with CIDR 10.0.0.0/16
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=staging-vpc}]'

# Create subnets
# Public subnets (for ALB, NAT Gateway)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Private subnets (for ECS, RDS)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.10.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone us-east-1b
```

### 2. Security Groups

```bash
# ALB Security Group
aws ec2 create-security-group --group-name staging-alb-sg --description "ALB Security Group" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 443 --cidr 0.0.0.0/0

# ECS Security Group
aws ec2 create-security-group --group-name staging-ecs-sg --description "ECS Security Group" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 80 --source-group sg-alb

# RDS Security Group
aws ec2 create-security-group --group-name staging-rds-sg --description "RDS Security Group" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 5432 --source-group sg-ecs
```

### 3. RDS Database

```bash
# Create RDS Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name staging-db-subnet-group \
  --db-subnet-group-description "Staging DB subnet group" \
  --subnet-ids subnet-private1 subnet-private2

# Create RDS Instance
aws rds create-db-instance \
  --db-instance-identifier staging-postgres \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "secure-password" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-rds \
  --db-subnet-group-name staging-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted
```

### 4. ECR Repository

```bash
# Create ECR repository for backend
aws ecr create-repository --repository-name home-health-aid-backend --image-scanning-configuration scanOnPush=true
```

### 5. S3 Bucket for Frontend

```bash
# Create S3 bucket
aws s3 mb s3://staging-home-health-aid-web

# Configure bucket for static website hosting
aws s3 website s3://staging-home-health-aid-web --index-document index.html --error-document index.html

# Block public access (CloudFront will access via OAC)
aws s3api put-public-access-block \
  --bucket staging-home-health-aid-web \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 6. ACM Certificates

```bash
# Request certificate for API domain
aws acm request-certificate \
  --domain-name staging.api.example.com \
  --validation-method DNS \
  --region us-east-1

# Request certificate for CloudFront (must be in us-east-1)
aws acm request-certificate \
  --domain-name staging.app.example.com \
  --validation-method DNS \
  --region us-east-1
```

### 7. Secrets Manager

```bash
# Store database URL
aws secretsmanager create-secret \
  --name staging/database-url \
  --description "Database connection string for staging" \
  --secret-string "postgresql://postgres:password@staging-postgres.xxx.us-east-1.rds.amazonaws.com:5432/homehealthaid"

# Store JWT secret
aws secretsmanager create-secret \
  --name staging/jwt-secret \
  --description "JWT secret for staging" \
  --secret-string "your-super-secret-jwt-key-here"

# Store geocoding API keys
aws secretsmanager create-secret \
  --name staging/geocoding-keys \
  --description "Geocoding service API keys" \
  --secret-string '{"google_maps": "your-google-api-key", "openstreetmap": "your-osm-key"}'
```

## Application Configuration

### Backend Configuration

Create `backend/config/staging.py`:

```python
import os
import boto3
import json

# AWS Secrets Manager client
secrets_client = boto3.client('secrets-manager')

def get_secret(secret_name):
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        return response['SecretString']
    except Exception as e:
        print(f"Error retrieving secret {secret_name}: {e}")
        return None

class StagingConfig:
    DEBUG = False
    TESTING = False
    
    # Database
    DATABASE_URL = get_secret('staging/database-url')
    
    # JWT
    JWT_SECRET_KEY = get_secret('staging/jwt-secret')
    
    # CORS
    CORS_ALLOWED_ORIGINS = ['https://staging.app.example.com']
    
    # Geocoding
    geocoding_keys = json.loads(get_secret('staging/geocoding-keys') or '{}')
    GOOGLE_MAPS_API_KEY = geocoding_keys.get('google_maps')
    
    # Logging
    LOG_LEVEL = 'INFO'
    
    # Disable development features
    ENABLE_DEV_LOGIN = False
```

### Frontend Configuration

Create `frontend/web/.env.staging`:

```bash
REACT_APP_API_BASE_URL=https://staging.api.example.com/api
REACT_APP_ENVIRONMENT=staging
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

## Docker Configuration

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "run:app"]
```

### ECS Task Definition

```json
{
  "family": "home-health-aid-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/home-health-aid-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "staging"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:staging/database-url"
        },
        {
          "name": "JWT_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:staging/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/home-health-aid-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### Frontend Deployment

`.github/workflows/frontend-staging.yml`:

```yaml
name: Deploy Frontend to Staging

on:
  push:
    branches: [main]
    paths: ['frontend/web/**']
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  S3_BUCKET: staging-home-health-aid-web
  CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/web/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend/web
          npm ci
      
      - name: Build application
        run: |
          cd frontend/web
          REACT_APP_API_BASE_URL=https://staging.api.example.com/api \
          REACT_APP_ENVIRONMENT=staging \
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/web/build/ s3://${{ env.S3_BUCKET }}/ --delete
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
      
      - name: Notify deployment
        if: success()
        run: |
          echo "Frontend deployed successfully to staging"
```

#### Backend Deployment

`.github/workflows/backend-staging.yml`:

```yaml
name: Deploy Backend to Staging

on:
  push:
    branches: [main]
    paths: ['backend/**']
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: home-health-aid-backend
  ECS_CLUSTER: staging-cluster
  ECS_SERVICE: backend-service

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Download task definition
        run: |
          aws ecs describe-task-definition --task-definition home-health-aid-backend \
            --query taskDefinition > task-definition.json
      
      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v2
        with:
          task-definition: task-definition.json
          container-name: backend
          image: ${{ steps.build-image.outputs.image }}
      
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
      
      - name: Run database migrations
        run: |
          aws ecs run-task \
            --cluster ${{ env.ECS_CLUSTER }} \
            --task-definition home-health-aid-backend \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.PRIVATE_SUBNET_1 }},${{ secrets.PRIVATE_SUBNET_2 }}],securityGroups=[${{ secrets.ECS_SECURITY_GROUP }}],assignPublicIp=DISABLED}" \
            --overrides '{"containerOverrides":[{"name":"backend","command":["flask","db","upgrade"]}]}'
      
      - name: Notify deployment
        if: success()
        run: |
          echo "Backend deployed successfully to staging"
```

## Monitoring and Observability

### CloudWatch Alarms

```bash
# Create CloudWatch Log Group
aws logs create-log-group --log-group-name /ecs/home-health-aid-backend

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name staging-api-5xx-errors \
  --alarm-description "API 5xx errors" \
  --metric-name HTTPCode_ELB_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

aws cloudwatch put-metric-alarm \
  --alarm-name staging-ecs-cpu-high \
  --alarm-description "ECS CPU utilization high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Health Check Endpoint

Add to `backend/app/routes/health.py`:

```python
from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@health_bp.route('/health/detailed')
def detailed_health_check():
    # Add database connectivity check
    try:
        from app import db
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'database': db_status
    })
```

## Scheduled Tasks

### Geofence Checker

Create `backend/scheduled_tasks/geofence_checker.py`:

```python
#!/usr/bin/env python3
"""
Scheduled task to check geofence violations
Run via ECS Scheduled Task
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.timesheet.timesheet import Timesheet
from app.models.geolocation.geofence import Geofence
from datetime import datetime, timedelta

def check_geofences():
    app = create_app()
    with app.app_context():
        # Get active timesheets
        active_timesheets = Timesheet.query.filter_by(status='active').all()
        
        for timesheet in active_timesheets:
            # Check if user is still in geofence
            # Implementation depends on your geofence checking logic
            pass

if __name__ == '__main__':
    check_geofences()
```

### EventBridge Rule

```bash
# Create EventBridge rule for geofence checking
aws events put-rule \
  --name staging-geofence-checker \
  --schedule-expression "rate(5 minutes)" \
  --state ENABLED

# Create ECS task definition for scheduled task
aws ecs register-task-definition \
  --cli-input-json file://scheduled-task-definition.json

# Add target to EventBridge rule
aws events put-targets \
  --rule staging-geofence-checker \
  --targets "Id"="1","Arn"="arn:aws:ecs:us-east-1:ACCOUNT:cluster/staging-cluster","RoleArn"="arn:aws:iam::ACCOUNT:role/ecsEventsRole","EcsParameters"="{\"TaskDefinitionArn\":\"arn:aws:ecs:us-east-1:ACCOUNT:task-definition/geofence-checker:1\",\"LaunchType\":\"FARGATE\",\"NetworkConfiguration\":{\"awsvpcConfiguration\":{\"Subnets\":[\"subnet-private1\",\"subnet-private2\"],\"SecurityGroups\":[\"sg-ecs\"],\"AssignPublicIp\":\"DISABLED\"}}}"
```

## Security Considerations

### IAM Roles and Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:staging/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:ACCOUNT:log-group:/ecs/home-health-aid-backend:*"
      ]
    }
  ]
}
```

### Network Security

- All ECS tasks run in private subnets
- RDS is in private subnets with no public access
- ALB only allows HTTPS traffic
- Security groups follow principle of least privilege

## Cost Optimization

### Staging Environment Costs (Monthly Estimate)

- **ECS Fargate**: 2 tasks × 0.5 vCPU × 1GB × $0.04048/hour = ~$30
- **RDS**: db.t4g.micro × $0.017/hour = ~$12
- **ALB**: ~$20
- **CloudFront**: ~$5
- **S3**: ~$1
- **Data Transfer**: ~$5
- **Total**: ~$73/month

### Cost Optimization Strategies

1. **Auto-scaling**: Scale down to 1 task during off-hours
2. **RDS**: Use Aurora Serverless v2 for better cost control
3. **Scheduled shutdown**: Stop non-critical resources during weekends
4. **Reserved instances**: For production, consider reserved capacity

## Rollback Strategy

### Backend Rollback

```bash
# List previous task definitions
aws ecs describe-task-definition --task-definition home-health-aid-backend

# Rollback to previous version
aws ecs update-service \
  --cluster staging-cluster \
  --service backend-service \
  --task-definition home-health-aid-backend:REVISION_NUMBER
```

### Frontend Rollback

```bash
# Revert to previous S3 version
aws s3api list-object-versions --bucket staging-home-health-aid-web --prefix index.html

# Restore previous version
aws s3api get-object \
  --bucket staging-home-health-aid-web \
  --key index.html \
  --version-id PREVIOUS_VERSION_ID \
  index.html

aws s3 cp index.html s3://staging-home-health-aid-web/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

## Testing Strategy

### Pre-deployment Tests

1. **Unit Tests**: Run `pytest` in backend
2. **Integration Tests**: Test API endpoints with staging database
3. **Frontend Tests**: Run `npm test` in frontend
4. **Security Scan**: Run container security scan

### Post-deployment Tests

1. **Health Check**: Verify `/health` endpoint
2. **API Tests**: Test critical endpoints
3. **Frontend Tests**: Verify React app loads correctly
4. **Database Migration**: Verify migrations applied successfully

## Maintenance

### Regular Maintenance Tasks

1. **Security Updates**: Monthly security patches
2. **Dependency Updates**: Quarterly dependency updates
3. **Backup Verification**: Weekly backup restoration tests
4. **Performance Monitoring**: Monthly performance reviews

### Monitoring Dashboard

Create CloudWatch dashboard with:
- API response times
- Error rates
- Database connections
- ECS resource utilization
- RDS performance metrics

## Troubleshooting

### Common Issues

1. **ECS Task Failures**: Check CloudWatch logs
2. **Database Connection Issues**: Verify security groups and credentials
3. **Frontend Not Loading**: Check CloudFront distribution and S3 bucket
4. **API Timeouts**: Check ALB health checks and ECS task health

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster staging-cluster --services backend-service

# Check task logs
aws logs tail /ecs/home-health-aid-backend --follow

# Check RDS status
aws rds describe-db-instances --db-instance-identifier staging-postgres

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
```

This deployment strategy provides a robust, scalable, and cost-effective staging environment for the Home Health Aid application.
