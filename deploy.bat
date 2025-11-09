@echo off
REM Mapify OS SDK Deployment Script for Windows

echo 🚀 Starting Mapify OS SDK deployment...

REM Build the SDK
echo 📦 Building SDK...
pnpm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ SDK built successfully!

REM Deploy to Firebase Hosting
echo 🌐 Deploying to Firebase Hosting...
cd ..
firebase deploy --only hosting:sdk

if %errorlevel% neq 0 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo ✅ SDK deployed successfully!
echo 🎉 SDK is now available at: https://api.mapifyos.com/v1/mapify.js
echo 📚 Documentation: https://github.com/mapifyos/sdk
