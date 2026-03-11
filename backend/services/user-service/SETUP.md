# Setup Guide - User Service

## 📋 Database Setup

**Important:** User Service uses the **same PostgreSQL database** as Auth Service for simplicity.

### ✅ Option 1: Local PostgreSQL (No Docker Required)

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

**Create Database (if not already created by Auth Service):**
```bash
# Start PostgreSQL
sudo service postgresql start  # Linux
# or
brew services start postgresql  # macOS

# Create database and user (if not exists)
sudo -u postgres psql
CREATE USER freelancer WITH PASSWORD 'secret';
CREATE DATABASE defellix OWNER freelancer;
GRANT ALL PRIVILEGES ON DATABASE defellix TO freelancer;
\q
```

**Note:** If Auth Service already created the database, you can skip this step.

---

### ✅ Option 2: Neon DB (Serverless PostgreSQL) - Recommended

**Why Neon DB?**
- Free tier available
- Serverless (no server management)
- Auto-scaling
- Perfect for development and small projects
- Easy migration to AWS RDS later

**Setup Steps:**

1. **Sign up:** https://neon.tech
2. **Create a new project** (or use existing from Auth Service)
3. **Get connection details from dashboard:**
   - Click on your project
   - Go to "Connection Details"
   - Copy the connection string or individual values

**Environment Variables:**
```bash
export DB_HOST=ep-xxx-xxx.us-east-2.aws.neon.tech
export DB_PORT=5432
export DB_USER=your-neon-user
export DB_PASSWORD=your-neon-password
export DB_NAME=defellix  # Same as Auth Service!
export DB_SSLMODE=require  # IMPORTANT: Required for Neon
```

**Connection String Format:**
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/defellix?sslmode=require
```

---

### ✅ Option 3: AWS RDS PostgreSQL (Production)

**Setup Steps:**

1. **Use Same RDS Instance as Auth Service:**
   - Use the same endpoint, username, and password
   - Use the same database name: `defellix`

**Environment Variables:**
```bash
export DB_HOST=your-db.region.rds.amazonaws.com
export DB_PORT=5432
export DB_USER=your-rds-username
export DB_PASSWORD=your-rds-password
export DB_NAME=defellix  # Same as Auth Service!
export DB_SSLMODE=require  # Recommended for RDS
```

---

## 🔐 Environment Variables Setup

### Method 1: Create `.env` File (Recommended)

1. **Copy example file:**
   ```bash
   cd backend/services/user-service
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```bash
   nano .env
   # or
   vim .env
   ```

3. **Add your values (use same DB as Auth Service):**
   ```env
   # Server Configuration
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8081
   
   # PostgreSQL Configuration (SAME as Auth Service)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=freelancer
   DB_PASSWORD=secret
   DB_NAME=defellix  # Same database!
   DB_SSLMODE=disable
   
   # Auth Service (for gRPC - future)
   AUTH_SERVICE_HOST=localhost
   AUTH_SERVICE_PORT=50051
   
   # Application Configuration
   APP_ENV=development
   LOG_LEVEL=info
   ```

4. **Load .env file (optional):**
   
   Install godotenv:
   ```bash
   go get github.com/joho/godotenv
   ```
   
   Add to `cmd/server/main.go`:
   ```go
   import "github.com/joho/godotenv"
   
   func main() {
       // Load .env file
       godotenv.Load()
       
       cfg := config.Load()
       // ... rest of code
   }
   ```

### Method 2: Export Environment Variables

**Linux/macOS:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=freelancer
export DB_PASSWORD=secret
export DB_NAME=defellix  # Same as Auth Service!
export DB_SSLMODE=disable
```

**Windows (PowerShell):**
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USER="freelancer"
$env:DB_PASSWORD="secret"
$env:DB_NAME="defellix"
$env:DB_SSLMODE="disable"
```

---

## 🚀 Running the Service

### Step 1: Ensure Database is Ready

**Check if Auth Service created the database:**
```bash
psql -h localhost -U freelancer -d defellix -c "\dt"
```

**You should see:**
- `users` (from auth-service)
- `oauth_providers` (from auth-service)
- `user_profiles` (will be created by user-service)

### Step 2: Run User Service

```bash
cd backend/services/user-service

# Set environment variables (if not using .env)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=freelancer
export DB_PASSWORD=secret
export DB_NAME=defellix
export DB_SSLMODE=disable

# Run
go run cmd/server/main.go
```

**Expected Output:**
```
Database migrations and indexes completed
User Service starting on 0.0.0.0:8081
Environment: development
```

---

## ✅ Verification

### Test Database Connection

```bash
# Using psql
psql -h localhost -U freelancer -d defellix

# Check tables
\dt

# Should see:
# - users
# - oauth_providers
# - user_profiles

# Check user_profiles structure
\d user_profiles
```

### Test Service

```bash
# Health check
curl http://localhost:8081/health
```

**Expected Response:**
```json
{
    "status": "healthy",
    "timestamp": "2026-01-24T10:30:00Z",
    "service": "user-service",
    "version": "1.0.0"
}
```

### Test Profile Creation (Requires Auth Token)

```bash
# First, get auth token from auth-service
# Then create profile
curl -X POST http://localhost:8081/api/v1/users/me/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "short_headline": "Senior Go Developer",
    "role": "freelancer",
    "skills": ["Go", "Python", "JavaScript"],
    "location": "Mumbai, India",
    "github_link": "https://github.com/johndoe"
  }'
```

---

## 📊 Database Tables

### Shared Database: `defellix`

**Tables Created by Auth Service:**
- `users` - User accounts
- `oauth_providers` - OAuth connections

**Tables Created by User Service:**
- `user_profiles` - User profiles with JSONB fields

**Indexes (Auto-created):**
- `idx_user_profiles_user_id` - Unique index on user_id
- `idx_user_profiles_email` - Index on email
- `idx_user_profiles_skills_gin` - GIN index for skills (JSONB)
- `idx_user_profiles_projects_gin` - GIN index for projects (JSONB)
- `idx_user_profiles_fulltext` - Full-text search index

---

## 🔄 Future: AWS RDS or DynamoDB

### AWS RDS PostgreSQL
- **Current setup works!** Just change environment variables
- Use connection details from RDS console
- Set `DB_SSLMODE=require` for security
- **Use same database** as Auth Service

### DynamoDB (Not Recommended)
- **Note:** Current code uses GORM/PostgreSQL
- For DynamoDB, you'll need significant refactoring
- **Recommendation:** Stick with PostgreSQL (RDS) for now

---

## 📝 Quick Reference

**Environment Variables File Location:**
- `.env` file should be in: `backend/services/user-service/.env`
- Example file: `backend/services/user-service/.env.example`

**Required Variables:**
- `DB_HOST` - Database host (same as Auth Service)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username (same as Auth Service)
- `DB_PASSWORD` - Database password (same as Auth Service)
- `DB_NAME` - Database name: `defellix` (same as Auth Service!)
- `DB_SSLMODE` - SSL mode (disable for local, require for cloud)

**Optional Variables:**
- `SERVER_HOST` - Server host (default: 0.0.0.0)
- `SERVER_PORT` - Server port (default: 8081)
- `APP_ENV` - Environment (default: development)
- `LOG_LEVEL` - Log level (default: info)
- `AUTH_SERVICE_HOST` - Auth service host (default: localhost)
- `AUTH_SERVICE_PORT` - Auth service port (default: 50051)

---

## 🚨 Important Notes

1. **Same Database:** User Service uses the **same PostgreSQL database** as Auth Service (`defellix`)

2. **Run Auth Service First:** Make sure Auth Service is running and has created the database before starting User Service

3. **Migrations:** User Service will automatically create the `user_profiles` table and indexes on startup

4. **No Conflicts:** Both services can run simultaneously and use the same database without issues

---

## 🐛 Troubleshooting

### Error: "database does not exist"
- Make sure Auth Service has created the database
- Or create it manually: `createdb defellix`

### Error: "relation 'user_profiles' already exists"
- This is normal if you've run the service before
- The service will skip creating existing tables

### Error: "connection refused"
- Check if PostgreSQL is running: `sudo service postgresql status`
- Verify connection details in `.env` file

### Error: "permission denied"
- Check database user permissions
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE defellix TO freelancer;`
