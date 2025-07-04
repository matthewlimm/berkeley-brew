# Backend API Deployment Guide

This guide explains how to deploy the Berkeley Brew backend API to Render.com.

## Prerequisites

- A GitHub account with your Berkeley Brew repository
- A Render.com account (free tier is sufficient)
- Your Supabase credentials

## Deployment Steps

### 1. Prepare Your Repository

Make sure your backend code is committed to your GitHub repository. The repository should include:
- `packages/api` directory with all backend code
- `render.yaml` file at the root of your repository

### 2. Deploy to Render.com

1. Log in to [Render.com](https://render.com)
2. Click "New" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and configure your service
5. Set up the following environment variables in the Render dashboard:
   - `SUPABASE_URL`: Your Supabase URL (e.g., https://vbtvfxvthhsjanfeojjt.supabase.co)
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `FRONTEND_URL`: Your frontend URL (e.g., https://berkeley-brew.netlify.app)

### 3. Verify the Deployment

1. Once deployed, Render will provide a URL for your API (e.g., https://berkeley-brew-api.onrender.com)
2. Test the API by visiting `https://berkeley-brew-api.onrender.com/api/cafes`
3. You should see a JSON response with cafe data

### 4. Update Frontend Configuration

Make sure your frontend is configured to use the new backend API URL:

1. In your Netlify dashboard, set the `NEXT_PUBLIC_API_URL` environment variable to your Render API URL
2. Alternatively, update the `netlify.toml` file with:
   ```toml
   [build.environment]
   NEXT_PUBLIC_API_URL = "https://berkeley-brew-api.onrender.com"
   ```

### 5. Redeploy the Frontend

After updating the API URL, redeploy your frontend on Netlify:

1. Push your changes to GitHub, or
2. Trigger a manual deploy from the Netlify dashboard

## Troubleshooting

### API Connection Issues

If the frontend cannot connect to the backend:

1. Check that the backend is running by visiting the API URL directly
2. Verify that CORS is properly configured in the backend to allow requests from your frontend domain
3. Check the browser console for specific error messages

### Environment Variables

If the backend fails to start:

1. Check that all required environment variables are set in the Render dashboard
2. Verify that the Supabase credentials are correct

### Render Free Tier Limitations

Note that on Render's free tier:
- The service will spin down after 15 minutes of inactivity
- The first request after inactivity may take up to 30 seconds to respond
- Consider upgrading to a paid tier for production use
