#!/bin/bash

# Mapify OS SDK Deployment Script

echo "🚀 Starting Mapify OS SDK deployment..."

# Build the SDK
echo "📦 Building SDK..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ SDK built successfully!"

# Deploy to Firebase Hosting
echo "🌐 Deploying to Firebase Hosting..."
cd ..
firebase deploy --only hosting:sdk

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ SDK deployed successfully!"
echo "🎉 SDK is now available at: https://api.mapifyos.com/v1/mapify.js"
echo "📚 Documentation: https://github.com/mapifyos/sdk"
