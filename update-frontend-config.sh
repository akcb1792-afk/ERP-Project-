#!/bin/bash

echo "=== Update Frontend Configuration ==="
echo "Please update these files with your actual backend URL after deployment:"

echo "File: GrowURBuisness-ui/src/environments/environment.prod.ts"
echo "Replace: https://your-backend-url.onrender.com/api"
echo "With: https://your-actual-backend-url.onrender.com/api"
echo ""

echo "Then run:"
echo "cd GrowURBuisness-ui"
echo "npm run build"
echo ""

echo "Deploy dist/growurbuisness-ui folder to Netlify"
