#!/bin/bash
# ============================================================
#  upload-videos-to-s3.sh
#  Run this ONCE to push all videos to your S3 bucket.
#  After this, videos are served directly from S3 — Lambda
#  is only used for API calls and non-video static files.
#
#  Prerequisites:
#    1. AWS CLI installed  (https://aws.amazon.com/cli/)
#    2. AWS credentials configured  (aws configure)
#    3. Set your bucket name below
# ============================================================

BUCKET="your-bucket-name"          # <-- Change this
REGION="ap-south-1"                # <-- Change to your bucket's region

if [ "$BUCKET" = "your-bucket-name" ]; then
  echo "ERROR: Please edit this script and set your S3 bucket name."
  exit 1
fi

echo "Uploading videos to s3://$BUCKET ..."

# Upload splash reel
aws s3 cp public/assets/splash-reel.mp4 \
  "s3://$BUCKET/assets/splash-reel.mp4" \
  --content-type "video/mp4" \
  --cache-control "public, max-age=604800" \
  --region "$REGION"

# Upload all videos recursively
aws s3 cp public/assets/videos/ \
  "s3://$BUCKET/assets/videos/" \
  --recursive \
  --content-type "video/mp4" \
  --cache-control "public, max-age=604800" \
  --region "$REGION"

echo ""
echo "Done! Your S3 Base URL is:"
echo "  https://$BUCKET.s3.$REGION.amazonaws.com"
echo ""
echo "Set this as S3_BASE_URL in your Lambda environment variables."
