#!/usr/bin/env bash
# lambda-worker/deploy.sh
#
# Deploys Lambda workers to all 6 regions in one shot.
#
# Usage:
#   chmod +x deploy.sh
#   BACKEND_URL=https://your-api.com LAMBDA_SECRET=your-secret ./deploy.sh
#
# Or pass inline:
#   BACKEND_URL=https://your-api.com LAMBDA_SECRET=your-secret bash deploy.sh

set -e  # exit on any error

BACKEND_URL="${BACKEND_URL:?BACKEND_URL env var required}"
LAMBDA_SECRET="${LAMBDA_SECRET:?LAMBDA_SECRET env var required}"

echo "🚀 Deploying Lambda workers to all 6 regions..."
echo "   Backend: $BACKEND_URL"
echo ""

deploy_region() {
  local AWS_REGION="$1"
  local REGION_NAME="$2"
  echo "────────────────────────────────────────────────"
  echo "📦 Deploying: $REGION_NAME ($AWS_REGION)"
  echo "────────────────────────────────────────────────"
  serverless deploy \
    --param="awsRegion=$AWS_REGION" \
    --param="regionName=$REGION_NAME" \
    --param="backendUrl=$BACKEND_URL" \
    --param="lambdaSecret=$LAMBDA_SECRET"
  echo "✅ $REGION_NAME deployed"
  echo ""
}

deploy_region "ap-south-1"     "Asia"
deploy_region "us-east-1"      "North America"
deploy_region "eu-west-1"      "Europe"
deploy_region "sa-east-1"      "South America"
deploy_region "ap-southeast-2" "Australia"
deploy_region "af-south-1"     "Africa"

echo "════════════════════════════════════════════════"
echo "✅ All 6 Lambda workers deployed successfully!"
echo ""
echo "Next step: add to your backend .env file:"
echo "  LAMBDA_WORKERS_ACTIVE=true"
echo ""
echo "This switches the backend cron to aggregation-only mode"
echo "so India checks no longer overwrite real regional data."
echo "════════════════════════════════════════════════"