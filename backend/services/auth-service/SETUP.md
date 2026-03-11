# Setup Guide - Auth Service

## 📋 Database Setup Options

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

**Create Database:**
```bash
# Start PostgreSQL
sudo service postgresql start  # Linux
# or
brew services start postgresql  # macOS

# Create database and user
sudo -u postgres psql
CREATE USER freelancer WITH PASSWORD 'secret';
CREATE DATABASE defellix OWNER freelancer;  # Shared database!
GRANT ALL PRIVILEGES ON DATABASE defellix TO freelancer;
\q
```

**Environment Variables:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=freelancer
export DB_PASSWORD=secret
export DB_NAME=defellix  # Shared with User Service!
export DB_SSLMODE=disable
```

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
2. **Create a new project**
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
export DB_NAME=defellix  # Shared with User Service!
export DB_SSLMODE=require  # IMPORTANT: Required for Neon
```

**Connection String Format:**
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/defellix?sslmode=require
```

---

### ✅ Option 3: AWS RDS PostgreSQL (Production)

**Setup Steps:**

1. **Create RDS Instance:**
   - Go to AWS Console → RDS
   - Create PostgreSQL instance
   - Choose instance type (db.t3.micro for testing)
   - Set master username and password
   - Configure security groups (allow port 5432)

2. **Get Connection Details:**
   - Endpoint: `your-db.region.rds.amazonaws.com`
   - Port: `5432`
   - Database name: `defellix` (shared with User Service)
   - Username and password from setup

**Environment Variables:**
```bash
export DB_HOST=your-db.region.rds.amazonaws.com
export DB_PORT=5432
export DB_USER=your-rds-username
export DB_PASSWORD=your-rds-password
export DB_NAME=defellix  # Shared with User Service!
export DB_SSLMODE=require  # Recommended for RDS
```

---

### ✅ Option 4: Docker (Optional)

**Quick Start:**
```bash
cd backend/services/auth-service
docker-compose up -d
```

**Environment Variables:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=freelancer
export DB_PASSWORD=secret
export DB_NAME=defellix  # Shared with User Service!
export DB_SSLMODE=disable
```

---

## 🔐 Environment Variables Setup

### Method 1: Create `.env` File (Recommended)

1. **Copy example file:**
   ```bash
   cd backend/services/auth-service
   x
   ```

2. **Edit `.env` file:**
   ```bash
   nano .env
   # or
   vim .env
   ```

3. **Add your values:**
   ```env
   DB_HOST=your-host
   DB_PORT=5432
   DB_USER=your-user
   DB_PASSWORD=your-password
   DB_NAME=defellix  # Shared with User Service!
   DB_SSLMODE=require
   JWT_SECRET=your-secret-key-min-32-characters
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
export DB_NAME=defellix  # Shared with User Service!
export DB_SSLMODE=disable
export JWT_SECRET=your-secret-key-min-32-characters
```

**Windows (PowerShell):**
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USER="freelancer"
$env:DB_PASSWORD="secret"
$env:DB_NAME="defellix"  # Shared with User Service!
$env:DB_SSLMODE="disable"
$env:JWT_SECRET="your-secret-key-min-32-characters"
```

**Windows (CMD):**
```cmd
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=freelancer
set DB_PASSWORD=secret
set DB_NAME=defellix  # Shared with User Service!
set DB_SSLMODE=disable
set JWT_SECRET=your-secret-key-min-32-characters
```

### Method 3: Use direnv (Auto-load .env)

1. **Install direnv:**
   ```bash
   # macOS
   brew install direnv
   
   # Linux
   sudo apt-get install direnv
   ```

2. **Add to shell config:**
   ```bash
   echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
   # or for zsh
   echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
   ```

3. **Create `.envrc` file:**
   ```bash
   cd backend/services/auth-service
   echo "dotenv" > .envrc
   direnv allow
   ```

---

## 🚀 Running the Service

### Without Docker

```bash
cd backend/services/auth-service

# Set environment variables (if not using .env)
export DB_HOST=localhost
export DB_PORT=5432
# ... other variables

# Run
go run cmd/server/main.go
```

### With Docker (Database Only)

```bash
# Start PostgreSQL
docker-compose up -d

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=freelancer
export DB_PASSWORD=secret
export DB_NAME=auth_db
export DB_SSLMODE=disable

# Run service
go run cmd/server/main.go
```

---

## ✅ Verification

**Test Database Connection:**
```bash
# Using psql
psql -h localhost -U freelancer -d defellix

# Or test from Go service
# The service will log connection errors on startup
```

**Note:** This database is shared with User Service. Both services will create their tables in the same database.

**Test Service:**
```bash
curl http://localhost:8080/health
```

**Expected Response:**
```json
{
    "status": "healthy",
    "timestamp": "2026-01-24T10:30:00Z",
    "service": "auth-service",
    "version": "1.0.0"
}
```

---

## 🔄 Future: AWS RDS or DynamoDB

### AWS RDS PostgreSQL
- **Current setup works!** Just change environment variables
- Use connection details from RDS console
- Set `DB_SSLMODE=require` for security

### DynamoDB (Future Migration)
- **Note:** Current code uses GORM/PostgreSQL
- For DynamoDB, you'll need:
  - AWS SDK for Go
  - Different repository implementation
  - No SQL queries (DynamoDB is NoSQL)
- This will be a significant refactor

**Recommendation:** Stick with PostgreSQL (RDS) for now, as it's SQL-based and easier to work with for relational data.

---

## 📝 Quick Reference

**Environment Variables File Location:**
- `.env` file should be in: `backend/services/auth-service/.env`
- Example file: `backend/services/auth-service/.env.example`

**Required Variables:**
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name: `defellix` (shared with User Service!)
- `DB_SSLMODE` - SSL mode (disable for local, require for cloud)
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

**Optional Variables:**
- `SERVER_HOST` - Server host (default: 0.0.0.0)
- `SERVER_PORT` - Server port (default: 8080)
- `APP_ENV` - Environment (default: development)
- `LOG_LEVEL` - Log level (default: info)

