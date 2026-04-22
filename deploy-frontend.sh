#!/bin/bash

# Frontend Deployment Script for Netlify
echo "=== ERP Frontend Deployment Script ==="

# Check if we're in the correct directory
if [ ! -f "angular.json" ]; then
    echo "Error: Please run this script from the GrowURBuisness-ui directory"
    exit 1
fi

# Install dependencies
echo "Installing Angular dependencies..."
npm install

# Build for production
echo "Building Angular application for production..."
npm run build

# Check if build was successful
if [ ! -d "dist/growurbuisness-ui" ]; then
    echo "Error: Build failed - dist directory not found"
    exit 1
fi

echo "=== Frontend Build Complete ==="
echo "Build output: dist/growurbuisness-ui/"
echo ""
echo "Next steps:"
echo "1. Deploy to Netlify:"
echo "   - Option 1: Drag and drop 'dist/growurbuisness-ui' folder to Netlify"
echo "   - Option 2: Connect GitHub repository for automatic deployment"
echo "   - Option 3: Use Netlify CLI (see below)"
echo ""
echo "2. Update environment.prod.ts with your backend URL before building"
echo ""

# Optional: Netlify CLI deployment
echo "=== Netlify CLI Deployment (Optional) ==="
echo "To deploy using Netlify CLI:"
echo "1. Install Netlify CLI: npm install -g netlify-cli"
echo "2. Login: netlify login"
echo "3. Deploy: netlify deploy --prod --dir=dist/growurbuisness-ui"
echo ""

# Create netlify.toml for Netlify configuration
cat > netlify.toml << EOF
[build]
  publish = "dist/growurbuisness-ui"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
EOF

echo "Created netlify.toml configuration file"
