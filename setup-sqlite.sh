#!/bin/bash

# setup-sqlite.sh
# Switches both backend and frontend Prisma configurations from PostgreSQL to SQLite for quick local testing.

set -e

echo "=== Switching to SQLite local database ==="

# 1. Update frontend prisma schema & env.local (since they are using Next.js Serverless Option 1)
if [ -d "frontend" ]; then
  echo "Setting up SQLite for Frontend (Next.js)..."
  if [ -f "frontend/prisma/schema.prisma" ]; then
    sed -i '' 's/provider = "postgresql"/provider = "sqlite"/g' frontend/prisma/schema.prisma 2>/dev/null || \
    sed -i 's/provider = "postgresql"/provider = "sqlite"/g' frontend/prisma/schema.prisma
    echo "✓ Updated provider to sqlite in frontend/prisma/schema.prisma"
  fi

  if [ -f "frontend/.env" ]; then
    # Remove any existing DATABASE_URL line to prevent conflicts
    sed -i '' '/DATABASE_URL/d' frontend/.env 2>/dev/null || sed -i '/DATABASE_URL/d' frontend/.env
    # Add absolute database URL path
    echo "DATABASE_URL=\"file:$(pwd)/frontend/prisma/dev.db\"" >> frontend/.env
    echo "✓ Updated DATABASE_URL to absolute sqlite path in frontend/.env"
  fi

  # Generate and push for frontend
  cd frontend
  echo "Regenerating Prisma client for frontend..."
  npx prisma generate
  echo "Pushing database schema for frontend..."
  npx prisma db push
  cd ..
fi

# 2. Update backend (Optional fallback)
if [ -d "backend" ]; then
  echo "Setting up SQLite for Backend (Express)..."
  if [ -f "backend/prisma/schema.prisma" ]; then
    sed -i '' 's/provider = "postgresql"/provider = "sqlite"/g' backend/prisma/schema.prisma 2>/dev/null || \
    sed -i 's/provider = "postgresql"/provider = "sqlite"/g' backend/prisma/schema.prisma
    echo "✓ Updated provider to sqlite in backend/prisma/schema.prisma"
  fi

  if [ -f "backend/.env" ]; then
    # Remove any existing DATABASE_URL line to prevent conflicts
    sed -i '' '/DATABASE_URL/d' backend/.env 2>/dev/null || sed -i '/DATABASE_URL/d' backend/.env
    # Add absolute database URL path
    echo "DATABASE_URL=\"file:$(pwd)/backend/prisma/dev.db\"" >> backend/.env
    echo "✓ Updated DATABASE_URL to absolute sqlite path in backend/.env"
  fi

  cd backend
  echo "Regenerating Prisma client for backend..."
  npx prisma generate
  echo "Pushing database schema for backend..."
  npx prisma db push
  cd ..
fi

echo "=== SQLite database setup completed successfully! ==="
echo "You can now run 'npm run dev' to start the application."
