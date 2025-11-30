#!/bin/bash
# Prepare Lambda deployment package

# Clean previous deployment
rm -rf deployment
mkdir -p deployment

# Copy compiled JavaScript files
cp *.js deployment/
cp *.d.ts deployment/ 2>/dev/null || true

# Copy package.json and install production dependencies
cp package.json deployment/
cd deployment && npm install --production --silent
