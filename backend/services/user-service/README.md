# User Service

User profile management microservice for the Defellix.

## 🚀 Quick Start

### Prerequisites
- Go 1.24.0 or higher
- PostgreSQL (same database as auth-service)

### Database Setup

**Note:** User Service now uses **PostgreSQL** (same database as auth-service for simplicity).

#### Option 1: Local PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Create database (if not already created by auth-service)
createdb defellix
```

#### Option 2: Neon DB (Cloud) - Recommended
- Sign up at https://neon.tech
- Create a project
- Get connection details from dashboard
- Use same database as auth-service

### Environment Variables

Create a `.env` file:
```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8081

# PostgreSQL Configuration (Same database as auth-service)
DB_HOST=localhost
DB_PORT=5432
DB_USER=freelancer
DB_PASSWORD=secret
DB_NAME=defellix
DB_SSLMODE=disable

# For Neon DB / AWS RDS:
# DB_HOST=ep-xxx-xxx.us-east-2.aws.neon.tech
# DB_PORT=5432
# DB_USER=your-user
# DB_PASSWORD=your-password
# DB_NAME=defellix
# DB_SSLMODE=require

# Auth Service (for gRPC - future)
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=50051

# Application Configuration
APP_ENV=development
LOG_LEVEL=info
```

### Run Locally

```bash
cd backend/services/user-service
go mod download
go run cmd/server/main.go
```

The server will start on `http://localhost:8081` by default.

## 🔌 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### User Profiles
- `GET /api/v1/users/{id}` - Get user profile by ID
- `GET /api/v1/users/me` - Get current user profile (protected)
- `PUT /api/v1/users/me` - Update current user profile (protected)

### Search
- `POST /api/v1/users/search` - Search freelancers

### Skills Management (Protected)
- `POST /api/v1/users/me/skills` - Add skill
- `DELETE /api/v1/users/me/skills` - Remove skill

### Portfolio Management (Protected)
- `POST /api/v1/users/me/portfolio` - Add portfolio item
- `PUT /api/v1/users/me/portfolio/{itemId}` - Update portfolio item
- `DELETE /api/v1/users/me/portfolio/{itemId}` - Delete portfolio item

## 📁 Project Structure

```
user-service/
├── cmd/server/main.go          # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── domain/                 # Domain entities
│   ├── dto/                    # Data Transfer Objects
│   ├── handler/                # HTTP handlers
│   ├── middleware/             # HTTP middleware
│   ├── repository/             # Data access layer
│   └── service/                # Business logic
```

## 🏗️ Architecture

This service follows **Clean Architecture** principles:
- **Handlers**: HTTP request/response handling
- **DTOs**: Data Transfer Objects for API contracts
- **Service**: Business logic layer
- **Repository**: PostgreSQL data access (GORM)
- **Domain**: Core business entities
- **JSONB**: Flexible fields (projects, testimonials, skills) stored as JSONB

## 📚 Learning Resources

- Implementation details: `Learning/executionAccordingLearning.md`
- Testing guide: `Learning/TestBackend.md`
- Execution plan: `backend/execution.md`

## 🔄 Development Status

### ✅ Phase 2 (Completed)
- [x] MongoDB integration
- [x] User profile CRUD operations
- [x] Profile search functionality
- [x] Skills management
- [x] Portfolio management
- [ ] gRPC integration with auth-service (pending)

## 🛠️ Build

```bash
# Build binary
go build -o bin/user-service ./cmd/server

# Run binary
./bin/user-service
```

## 📝 License

Part of the Defellix.

