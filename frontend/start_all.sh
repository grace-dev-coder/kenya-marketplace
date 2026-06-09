#!/bin/bash
echo "=========================================="
echo "  KENYA MARKETPLACE - STARTING SERVERS"
echo "=========================================="

# Start MySQL
echo "[1/3] Starting MySQL..."
sudo systemctl start mysql 2>/dev/null || sudo service mysql start 2>/dev/null
sleep 2
echo "✓ MySQL started"

# Setup database
echo "[2/3] Setting up database..."
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS kenya_marketplace;" 2>/dev/null
sudo mysql -u root kenya_marketplace < database/schema.sql 2>/dev/null
sudo mysql -u root kenya_marketplace < database/seed_data.sql 2>/dev/null
echo "✓ Database ready"

# Start Backend
echo "[3/3] Starting Backend API..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
