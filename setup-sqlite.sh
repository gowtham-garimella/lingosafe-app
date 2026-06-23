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
    # Comment out Postgres URL, uncomment SQLite URL
    sed -i '' 's|DATABASE_URL="postgresql://|# DATABASE_URL="postgresql://|g' frontend/.env 2>/dev/null || \
    sed -i 's|DATABASE_URL="postgresql://|# DATABASE_URL="postgresql://|g' frontend/.env
    
    # Ensure DATABASE_URL="file:./dev.db" is set
    if grep -q 'file:./dev.db' frontend/.env; then
       # already commented/exists, uncomment it
       sed -i '' 's|# DATABASE_URL="file:|DATABASE_URL="file:|g' frontend/.env 2>/dev/null || \
       sed -i 's|# DATABASE_URL="file:|DATABASE_URL="file:|g' frontend/.env
    else
       echo 'DATABASE_URL="file:./dev.db"' >> frontend/.env
    fi
    echo "✓ Updated DATABASE_URL to sqlite local file in frontend/.env"
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
    sed -i '' 's|DATABASE_URL="postgresql://|# DATABASE_URL="postgresql://|g' backend/.env 2>/dev/null || \
    sed -i 's|DATABASE_URL="postgresql://|# DATABASE_URL="postgresql://|g' backend/.env
    
    sed -i '' 's|# DATABASE_URL="file:|DATABASE_URL="file:|g' backend/.env 2>/dev/null || \
    sed -i 's|# DATABASE_URL="file:|DATABASE_URL="file:|g' backend/.env
    echo "✓ Updated DATABASE_URL to sqlite local file in backend/.env"
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
