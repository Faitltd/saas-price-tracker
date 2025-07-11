#!/bin/bash

# 🚀 SaaS Price Tracker - One-Click Deployment Script
# This script will deploy your app to Vercel with Supabase database

echo "🚀 Starting SaaS Price Tracker deployment..."

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git is required but not installed. Aborting." >&2; exit 1; }

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Environment checks passed!"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your Supabase database:"
    echo "   - Go to https://supabase.com"
    echo "   - Create a new project"
    echo "   - Copy the connection string"
    echo ""
    echo "2. Configure environment variables in Vercel:"
    echo "   - Go to your Vercel dashboard"
    echo "   - Navigate to your project settings"
    echo "   - Add these environment variables:"
    echo "     DATABASE_URL=your-supabase-connection-string"
    echo "     OPENAI_API_KEY=your-openai-api-key"
    echo "     JWT_SECRET=your-jwt-secret"
    echo "     NEXTAUTH_SECRET=your-nextauth-secret"
    echo "     NEXTAUTH_URL=https://your-app.vercel.app"
    echo ""
    echo "3. Run database migrations:"
    echo "   - In your Vercel project, go to Functions tab"
    echo "   - Or run: npx prisma migrate deploy"
    echo ""
    echo "4. Seed the database:"
    echo "   - Run: npm run db:seed"
    echo ""
    echo "🌟 Your SaaS Price Tracker is now live!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
