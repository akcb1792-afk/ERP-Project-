# ERP System Cloud Deployment Guide

## Overview
This guide will help you deploy your Inventory Management System to the cloud for public demo access.

## Tech Stack
- **Frontend**: Angular 17
- **Backend**: ASP.NET Core Web API
- **Database**: Azure SQL Database
- **Hosting**: Render (Backend) + Netlify (Frontend)

## Prerequisites
- Azure Account (for SQL Database)
- Render Account (free tier available)
- Netlify Account (free tier available)
- Git repository with your code

---

## Step 1: Backend Deployment (Render)

### 1.1 Prepare Azure SQL Database
1. Create Azure SQL Database:
   ```bash
   # In Azure Portal
   - Go to SQL Databases > Create
   - Server: Create new server (remember server name)
   - Database name: GrowURBuisnessDB
   - Pricing tier: Basic or Standard (for demo)
   ```

2. Get connection string:
   ```sql
   Server=tcp:your-server.database.windows.net,1433;
   Initial Catalog=GrowURBuisnessDB;
   User ID=your-username;
   Password=your-password;
   Encrypt=True;
   TrustServerCertificate=False;
   Connection Timeout=30;
   ```

### 1.2 Update Backend Configuration
1. Update `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=tcp:YOUR_SERVER.database.windows.net,1433;Initial Catalog=GrowURBuisnessDB;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
     }
   }
   ```

2. Ensure `Program.cs` has CORS configured (already done)

### 1.3 Deploy to Render
1. Push your code to GitHub
2. In Render Dashboard:
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
   - Environment: C#
   - Build Command: `dotnet build`
   - Start Command: `dotnet run`
   - Add Environment Variables:
     - `ASPNETCORE_ENVIRONMENT`: `Production`

3. After deployment, note your backend URL: `https://your-app-name.onrender.com`

---

## Step 2: Frontend Deployment (Netlify)

### 2.1 Update Frontend Configuration
1. Update `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-backend-url.onrender.com/api'
   };
   ```

### 2.2 Build for Production
1. Install dependencies:
   ```bash
   cd GrowURBuisness-ui
   npm install
   ```

2. Build production version:
   ```bash
   npm run build
   ```

### 2.3 Deploy to Netlify
1. Create Netlify account
2. Drag and drop the `dist/growurbuisness-ui` folder to Netlify
3. Or connect GitHub repository for automatic deployments

---

## Step 3: Database Setup and Seeding

### 3.1 Run Database Migrations
1. Connect to your Azure SQL Database using SQL Server Management Studio
2. Run the migration scripts from `GrowURBuisness.API/Migrations/`

### 3.2 Seed Sample Data
The backend is configured with sample data for demo purposes. The following data is included:
- 10 Sample Customers
- 10 Sample Inventory Items
- 10 Sample Invoices
- 10 Sample Orders
- Purchase and Sales report data

---

## Step 4: Testing and Verification

### 4.1 Test Backend APIs
1. Open your backend URL in browser
2. Test these endpoints:
   - `GET /api/dashboard/stats`
   - `GET /api/reports/sales`
   - `GET /api/reports/purchase`
   - `GET /api/reports/purchase/detailed`

### 4.2 Test Frontend
1. Open your Netlify URL
2. Verify these features:
   - Dashboard loads with statistics
   - Sales Report displays data
   - Purchase Report with filters works
   - Navigation between pages

---

## Step 5: Final Configuration

### 5.1 Update Production URLs
Replace placeholder URLs in configuration files:

**Backend (`appsettings.json`)**:
```json
{
  "ApiBaseUrl": "https://your-actual-backend-url.onrender.com"
}
```

**Frontend (`environment.prod.ts`)**:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-actual-backend-url.onrender.com/api'
};
```

### 5.2 Security Considerations
For demo purposes, CORS is set to allow all origins. For production:
- Restrict CORS to your frontend domain only
- Implement proper authentication
- Use HTTPS everywhere

---

## Troubleshooting

### Common Issues

1. **Backend won't start on Render**
   - Check the connection string format
   - Verify Azure SQL firewall allows Azure services
   - Check Render logs for specific errors

2. **Frontend can't connect to backend**
   - Verify CORS is configured correctly
   - Check the API URL in environment.prod.ts
   - Ensure backend is running and accessible

3. **Database connection issues**
   - Verify Azure SQL server name and credentials
   - Check if firewall rules allow connections
   - Ensure the database exists

4. **Reports not loading**
   - Check if ReportsController is properly configured
   - Verify SampleData methods are working
   - Check browser console for JavaScript errors

---

## Cost Estimates (Free Tier)

- **Azure SQL Database**: Free tier available (12 months)
- **Render**: Free tier (750 hours/month)
- **Netlify**: Free tier (100GB bandwidth/month)

Total cost for demo: **$0/month** (using free tiers)

---

## Final URLs Structure

After deployment, you'll have:
- **Frontend**: `https://your-app-name.netlify.app`
- **Backend API**: `https://your-backend-name.onrender.com/api`
- **Database**: Azure SQL Database (accessible only via backend)

---

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check Netlify deploy logs for frontend issues
3. Verify all URLs are correctly updated
4. Test individual API endpoints directly

Your ERP system is now ready for client training and demo purposes!
