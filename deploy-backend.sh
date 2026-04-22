#!/bin/bash

# Backend Deployment Script for Render
echo "=== ERP Backend Deployment Script ==="

# Check if we're in the correct directory
if [ ! -f "GrowURBuisness.API.csproj" ]; then
    echo "Error: Please run this script from the GrowURBuisness.API directory"
    exit 1
fi

# Restore dependencies
echo "Restoring NuGet packages..."
dotnet restore

# Build the project
echo "Building project..."
dotnet build --configuration Release

# Run tests (if any)
if [ -d "Tests" ]; then
    echo "Running tests..."
    dotnet test
fi

# Publish the application
echo "Publishing application..."
dotnet publish --configuration Release --output ./publish

echo "=== Backend Ready for Deployment ==="
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Set environment variables in Render"
echo "4. Deploy!"

# Create render.yaml for Render configuration
cat > render.yaml << EOF
services:
  - type: web
    name: erp-backend
    runtime: dotnet
    buildCommand: dotnet build -c Release
    startCommand: dotnet run -c Release
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
EOF

echo "Created render.yaml configuration file"
