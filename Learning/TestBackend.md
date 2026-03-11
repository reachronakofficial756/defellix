# Backend Testing Guide
## Decentralized Freelancer Trust Platform

**Purpose:** This document provides testing instructions and test cases for verifying that each phase/week of development is working correctly. Update this document as new features are implemented.

---

## 🧪 Week 1 - Phase 1: HTTP Server & Routing Tests

**Goal:** Verify that the basic HTTP server, routing, validation, and middleware are working correctly.

---

### 📋 Prerequisites

1. **Start the Auth Service:**
   ```bash
   cd backend/services/auth-service
   go run cmd/server/main.go
   ```

2. **Verify Server is Running:**
   - You should see: `🚀 Auth Service starting on 0.0.0.0:8080`
   - Server should be accessible at `http://localhost:8080`

3. **Tools Needed:**
   - `curl` (command-line HTTP client)
   - Or any REST client (Postman, Insomnia, etc.)
   - Browser (for simple GET requests)

---

### ✅ Test Cases

#### 1. Health Check Endpoints

**Test 1.1: Basic Health Check**
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

**Status Code:** `200 OK`

---

**Test 1.2: Liveness Probe**
```bash
curl http://localhost:8080/health/live
```

**Expected Response:**
```json
{
    "status": "alive",
    "timestamp": "2026-01-24T10:30:00Z",
    "service": "auth-service",
    "version": "1.0.0"
}
```

**Status Code:** `200 OK`

---

**Test 1.3: Readiness Probe**
```bash
curl http://localhost:8080/health/ready
```

**Expected Response:**
```json
{
    "status": "ready",
    "timestamp": "2026-01-24T10:30:00Z",
    "service": "auth-service",
    "version": "1.0.0"
}
```

**Status Code:** `200 OK`

---

#### 2. Request Validation Tests

**Test 2.1: Valid Registration Request**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "message": "Registration endpoint - implementation pending",
        "email": "test@example.com"
    },
    "message": "User registration endpoint ready"
}
```

**Status Code:** `201 Created`

---

**Test 2.2: Invalid Email Format**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'Email' failed validation: must be a valid email address",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

**Test 2.3: Missing Required Field**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'FullName' failed validation: is required",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

**Test 2.4: Password Too Short**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "short",
    "full_name": "John Doe"
  }'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'Password' failed validation: must be at least 8 characters",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

**Test 2.5: Invalid JSON**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "John Doe"
  invalid json'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "invalid JSON: ...",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

#### 3. Login Endpoint Tests

**Test 3.1: Valid Login Request**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "message": "Login endpoint - implementation pending",
        "email": "test@example.com"
    },
    "message": "User login endpoint ready"
}
```

**Status Code:** `200 OK`

---

**Test 3.2: Invalid Login Request (Missing Email)**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'Email' failed validation: is required",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

#### 4. Token Refresh Endpoint Tests

**Test 4.1: Valid Refresh Request**
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "some-refresh-token"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "message": "Token refresh endpoint - implementation pending"
    },
    "message": "Token refresh endpoint ready"
}
```

**Status Code:** `200 OK`

---

**Test 4.2: Missing Refresh Token**
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'RefreshToken' failed validation: is required",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

#### 5. Protected Endpoint Tests

**Test 5.1: Get Current User (Protected Route)**
```bash
curl http://localhost:8080/api/v1/auth/me
```

**Expected Response:**
```json
{
    "data": {
        "message": "Get current user endpoint - implementation pending"
    },
    "message": "Current user endpoint ready"
}
```

**Status Code:** `200 OK`

**Note:** Authentication middleware is a placeholder in Week 1, so this will work without a token. In Week 2, this will require a valid JWT token.

---

#### 6. Middleware Tests

**Test 6.1: CORS Preflight Request**
```bash
curl -X OPTIONS http://localhost:8080/api/v1/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-CSRF-Token
```

**Status Code:** `204 No Content`

---

**Test 6.2: Request Logging**
Check server logs when making any request. You should see:
```
[POST] /api/v1/auth/register 127.0.0.1:xxxxx 201 2.5ms
```

**Format:** `[METHOD] URI IP STATUS DURATION`

---

**Test 6.3: Request ID**
Make a request and check if `X-Request-Id` header is present in response:
```bash
curl -v http://localhost:8080/health
```

**Expected Header:**
```
X-Request-Id: <unique-id>
```

---

#### 7. Error Handling Tests

**Test 7.1: Non-existent Route**
```bash
curl http://localhost:8080/api/v1/nonexistent
```

**Expected Response:**
```
404 page not found
```

**Status Code:** `404 Not Found`

---

**Test 7.2: Wrong HTTP Method**
```bash
curl -X GET http://localhost:8080/api/v1/auth/register
```

**Expected Response:**
```
404 page not found
```

**Status Code:** `404 Not Found`

---

### 🎯 Week 1 Completion Checklist

- [ ] All health check endpoints return correct responses
- [ ] Request validation works for all endpoints
- [ ] Invalid requests return proper error messages
- [ ] CORS middleware handles preflight requests
- [ ] Request logging is working
- [ ] Request ID is generated for each request
- [ ] Graceful shutdown works (Ctrl+C stops server cleanly)
- [ ] All endpoints return consistent JSON format
- [ ] Error responses include error code
- [ ] Server handles concurrent requests

---

### 🚀 Quick Test Script

Save this as `test_week1.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"

echo "Testing Health Endpoints..."
curl -s $BASE_URL/health | jq .
echo ""

echo "Testing Registration (Valid)..."
curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"John Doe"}' | jq .
echo ""

echo "Testing Registration (Invalid Email)..."
curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"password123","full_name":"John Doe"}' | jq .
echo ""

echo "Testing Login..."
curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .
echo ""

echo "All tests completed!"
```

**Run with:**
```bash
chmod +x test_week1.sh
./test_week1.sh
```

---

### 📊 Expected Test Results Summary

| Test Category | Tests | Passed | Failed |
|--------------|-------|--------|--------|
| Health Checks | 3 | ✅ | ❌ |
| Validation | 5 | ✅ | ❌ |
| Login | 2 | ✅ | ❌ |
| Refresh | 2 | ✅ | ❌ |
| Protected Routes | 1 | ✅ | ❌ |
| Middleware | 3 | ✅ | ❌ |
| Error Handling | 2 | ✅ | ❌ |
| **Total** | **18** | **✅** | **❌** |

---

### 🔍 Debugging Tips

1. **Server not starting?**
   - Check if port 8080 is already in use: `lsof -i :8080`
   - Change port via environment variable: `SERVER_PORT=8081 go run cmd/server/main.go`

2. **Validation not working?**
   - Check Content-Type header is `application/json`
   - Verify JSON syntax is correct
   - Check struct tags match validation rules

3. **CORS issues?**
   - Verify CORS middleware is registered
   - Check browser console for CORS errors
   - Ensure preflight OPTIONS request is handled

4. **No logs appearing?**
   - Check Logger middleware is registered
   - Verify log output is going to stdout

---

---

## 🧪 Week 2 - Phase 1: Database & JWT Authentication Tests

**Goal:** Verify that database integration, password hashing, JWT authentication, and protected routes are working correctly.

---

### 📋 Prerequisites

1. **Start PostgreSQL Database:**
   ```bash
   docker run -d --name freelancer-postgres \
     -e POSTGRES_USER=freelancer \
     -e POSTGRES_PASSWORD=secret \
     -e POSTGRES_DB=auth_db \
     -p 5432:5432 postgres:15
   ```

2. **Set Environment Variables:**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_USER=freelancer
   export DB_PASSWORD=secret
   export DB_NAME=auth_db
   export JWT_SECRET=your-secret-key-change-in-production
   export JWT_ACCESS_TTL_HOURS=24
   export JWT_REFRESH_TTL_DAYS=7
   ```

3. **Start the Auth Service:**
   ```bash
   cd backend/services/auth-service
   go run cmd/server/main.go
   ```

---

### ✅ Test Cases

#### 1. User Registration Tests

**Test 2.1: Successful Registration**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 86400
    },
    "message": "User registered successfully"
}
```

**Status Code:** `201 Created`

**Verify:**
- Access token is a valid JWT
- Refresh token is a valid JWT
- User is created in database
- Password is hashed (not plain text)

---

**Test 2.2: Duplicate Email Registration**
```bash
# Register same email twice
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "Jane Doe"
  }'
```

**Expected Response:**
```json
{
    "error": "Conflict",
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
}
```

**Status Code:** `409 Conflict`

---

**Test 2.3: Registration with Invalid Data**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "short",
    "full_name": ""
  }'
```

**Expected Response:**
```json
{
    "error": "Bad Request",
    "message": "Field 'Email' failed validation: must be a valid email address; Field 'Password' failed validation: must be at least 8 characters; Field 'FullName' failed validation: is required",
    "code": "VALIDATION_ERROR"
}
```

**Status Code:** `400 Bad Request`

---

#### 2. User Login Tests

**Test 2.4: Successful Login**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 86400
    },
    "message": "Login successful"
}
```

**Status Code:** `200 OK`

---

**Test 2.5: Login with Wrong Password**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
}
```

**Status Code:** `401 Unauthorized`

---

**Test 2.6: Login with Non-existent Email**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
}
```

**Status Code:** `401 Unauthorized`

---

#### 3. Token Refresh Tests

**Test 2.7: Successful Token Refresh**
```bash
# First, login to get refresh token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }')

REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refresh_token')

# Now refresh the token
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

**Expected Response:**
```json
{
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 86400
    },
    "message": "Token refreshed successfully"
}
```

**Status Code:** `200 OK`

**Verify:**
- New access token is different from old one
- New refresh token is different from old one
- Both tokens are valid JWTs

---

**Test 2.8: Refresh with Invalid Token**
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "invalid-token"
  }'
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Invalid or expired refresh token",
    "code": "INVALID_TOKEN"
}
```

**Status Code:** `401 Unauthorized`

---

#### 4. Protected Route Tests

**Test 2.9: Get Current User (Authenticated)**
```bash
# First, login to get access token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

# Get current user
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
{
    "data": {
        "id": 1,
        "email": "newuser@example.com",
        "full_name": "John Doe",
        "role": "user",
        "is_active": true,
        "created_at": "2026-01-24T10:30:00Z",
        "updated_at": "2026-01-24T10:30:00Z"
    },
    "message": "User retrieved successfully"
}
```

**Status Code:** `200 OK`

**Verify:**
- Password is NOT in response
- User ID matches logged-in user
- All user fields are present

---

**Test 2.10: Get Current User (No Token)**
```bash
curl http://localhost:8080/api/v1/auth/me
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Authorization header required",
    "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

**Test 2.11: Get Current User (Invalid Token)**
```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Invalid token",
    "code": "INVALID_TOKEN"
}
```

**Status Code:** `401 Unauthorized`

---

**Test 2.12: Get Current User (Expired Token)**
```bash
# Use an expired token (you'll need to wait or manually create one)
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <expired-token>"
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Token has expired",
    "code": "TOKEN_EXPIRED"
}
```

**Status Code:** `401 Unauthorized`

---

**Test 2.13: Get Current User (Malformed Authorization Header)**
```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: InvalidFormat token"
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Invalid authorization header format",
    "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

#### 5. OAuth Endpoint Tests (Stubs)

**Test 2.14: Google OAuth Initiation**
```bash
curl http://localhost:8080/api/v1/auth/oauth/google
```

**Expected Response:**
```json
{
    "data": {
        "message": "Google OAuth - implementation pending",
        "url": "/oauth/google/callback"
    },
    "message": "Google OAuth endpoint ready"
}
```

**Status Code:** `200 OK`

---

**Test 2.15: LinkedIn OAuth Initiation**
```bash
curl http://localhost:8080/api/v1/auth/oauth/linkedin
```

**Expected Response:**
```json
{
    "data": {
        "message": "LinkedIn OAuth - implementation pending",
        "url": "/oauth/linkedin/callback"
    },
    "message": "LinkedIn OAuth endpoint ready"
}
```

**Status Code:** `200 OK`

---

#### 6. Database Integration Tests

**Test 2.16: Verify User in Database**
```bash
# After registration, verify user exists in PostgreSQL
docker exec -it freelancer-postgres psql -U freelancer -d auth_db -c "SELECT id, email, full_name, role, is_active FROM users;"
```

**Expected Output:**
```
 id |         email          | full_name | role | is_active
----+------------------------+-----------+------+-----------
  1 | newuser@example.com   | John Doe  | user | t
```

**Verify:**
- User exists in database
- Password is hashed (not visible in SELECT)
- Timestamps are set

---

**Test 2.17: Verify Password Hashing**
```bash
# Check that password is hashed (bcrypt format starts with $2a$ or $2b$)
docker exec -it freelancer-postgres psql -U freelancer -d auth_db -c "SELECT email, LEFT(password, 7) as password_prefix FROM users;"
```

**Expected Output:**
```
         email          | password_prefix
------------------------+-----------------
 newuser@example.com   | $2a$10$
```

**Verify:**
- Password starts with `$2a$` or `$2b$` (bcrypt format)
- Password is NOT plain text

---

### 🎯 Week 2 Completion Checklist

- [ ] PostgreSQL database is running and accessible
- [ ] User registration creates user in database
- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens are generated on registration/login
- [ ] Access tokens work for protected routes
- [ ] Refresh tokens can generate new access tokens
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Protected routes require valid token
- [ ] User data is retrieved correctly from database
- [ ] OAuth endpoints are accessible (stubs)
- [ ] Database migrations run on startup
- [ ] Duplicate email registration is prevented
- [ ] Invalid credentials are rejected

---

### 🚀 Quick Test Script for Week 2

Save this as `test_week2.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"
EMAIL="test$(date +%s)@example.com"
PASSWORD="password123"

echo "=== Week 2 Tests ==="
echo ""

echo "1. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Test User\"}")

echo "$REGISTER_RESPONSE" | jq .
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.access_token')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.refresh_token')

echo ""
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN_RESPONSE" | jq .

echo ""
echo "3. Testing Protected Route (/me)..."
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo ""
echo "4. Testing Token Refresh..."
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
echo "$REFRESH_RESPONSE" | jq .

echo ""
echo "All Week 2 tests completed!"
```

**Run with:**
```bash
chmod +x test_week2.sh
./test_week2.sh
```

---

### 📊 Expected Test Results Summary

| Test Category | Tests | Passed | Failed |
|--------------|-------|--------|--------|
| Registration | 3 | ✅ | ❌ |
| Login | 3 | ✅ | ❌ |
| Token Refresh | 2 | ✅ | ❌ |
| Protected Routes | 5 | ✅ | ❌ |
| OAuth Stubs | 2 | ✅ | ❌ |
| Database | 2 | ✅ | ❌ |
| **Total** | **17** | **✅** | **❌** |

---

### 🔍 Debugging Tips

1. **Database Connection Issues?**
   - Verify PostgreSQL is running: `docker ps | grep postgres`
   - Check connection string in environment variables
   - Verify database credentials

2. **JWT Token Issues?**
   - Check JWT_SECRET is set
   - Verify token format: `Bearer <token>`
   - Decode token at https://jwt.io to inspect claims

3. **Password Hashing Issues?**
   - Verify bcrypt is working: password should start with `$2a$` or `$2b$`
   - Check password comparison in login

4. **Migration Issues?**
   - Check database logs for migration errors
   - Verify user table exists: `\dt` in psql
   - Manually run migrations if needed

---

---

## 🧪 Phase 2: User Service - MongoDB & Profile Management Tests

**Goal:** Verify that MongoDB integration, profile CRUD, search, skills, and portfolio management are working correctly.

---

### 📋 Prerequisites

1. **Start MongoDB:**
   ```bash
   # Option 1: Docker
   cd backend/services/user-service
   docker-compose up -d

   # Option 2: Local MongoDB
   # Ensure MongoDB is running on localhost:27017
   ```

2. **Set Environment Variables:**
   ```bash
   export MONGO_URI=mongodb://localhost:27017
   export MONGO_DB=user_db
   export SERVER_PORT=8081
   ```

3. **Start the User Service:**
   ```bash
   cd backend/services/user-service
   go run cmd/server/main.go
   ```

---

### ✅ Test Cases

#### 1. Health Check Tests

**Test P2.1: Basic Health Check**
```bash
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

**Status Code:** `200 OK`

---

#### 2. Profile Management Tests

**Test P2.2: Update My Profile (Create Profile)**
```bash
curl -X PUT http://localhost:8081/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "bio": "Experienced Go developer",
    "location": "Mumbai, India",
    "hourly_rate": 25.50,
    "availability": "available"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "id": "...",
        "user_id": 1,
        "full_name": "John Doe",
        "bio": "Experienced Go developer",
        "location": "Mumbai, India",
        "hourly_rate": 25.50,
        "availability": "available",
        "is_active": true
    },
    "message": "Profile updated successfully"
}
```

**Status Code:** `200 OK`

---

**Test P2.3: Get My Profile**
```bash
curl http://localhost:8081/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

**Expected Response:**
```json
{
    "data": {
        "id": "...",
        "user_id": 1,
        "full_name": "John Doe",
        "bio": "Experienced Go developer",
        ...
    },
    "message": "Profile retrieved successfully"
}
```

**Status Code:** `200 OK`

---

**Test P2.4: Get Profile by ID**
```bash
# Use the ID from previous response
curl http://localhost:8081/api/v1/users/{profile_id}
```

**Expected Response:**
```json
{
    "data": {
        "id": "...",
        "user_id": 1,
        "full_name": "John Doe",
        ...
    },
    "message": "Profile retrieved successfully"
}
```

**Status Code:** `200 OK`

---

**Test P2.5: Update Profile (Partial Update)**
```bash
curl -X PUT http://localhost:8081/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated bio text",
    "hourly_rate": 30.00
  }'
```

**Expected Response:**
```json
{
    "data": {
        "bio": "Updated bio text",
        "hourly_rate": 30.00,
        ...
    },
    "message": "Profile updated successfully"
}
```

**Status Code:** `200 OK`

---

#### 3. Skills Management Tests

**Test P2.6: Add Skill**
```bash
curl -X POST http://localhost:8081/api/v1/users/me/skills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "Go"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "message": "Skill added successfully"
    },
    "message": "Skill added"
}
```

**Status Code:** `200 OK`

---

**Test P2.7: Add Multiple Skills**
```bash
curl -X POST http://localhost:8081/api/v1/users/me/skills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"skill": "Python"}'

curl -X POST http://localhost:8081/api/v1/users/me/skills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"skill": "JavaScript"}'
```

**Verify:** Get profile and check skills array contains all added skills.

---

**Test P2.8: Remove Skill**
```bash
curl -X DELETE http://localhost:8081/api/v1/users/me/skills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "Python"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "message": "Skill removed successfully"
    },
    "message": "Skill removed"
}
```

**Status Code:** `200 OK`

---

#### 4. Portfolio Management Tests

**Test P2.9: Add Portfolio Item**
```bash
curl -X POST http://localhost:8081/api/v1/users/me/portfolio \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform",
    "description": "Built a full-stack e-commerce platform using Go and React",
    "url": "https://example.com/project",
    "image_url": "https://example.com/image.png",
    "technologies": ["Go", "React", "PostgreSQL"]
  }'
```

**Expected Response:**
```json
{
    "data": {
        "id": "...",
        "title": "E-commerce Platform",
        "description": "Built a full-stack e-commerce platform...",
        "url": "https://example.com/project",
        "image_url": "https://example.com/image.png",
        "technologies": ["Go", "React", "PostgreSQL"],
        "created_at": "2026-01-24T10:30:00Z"
    },
    "message": "Portfolio item added successfully"
}
```

**Status Code:** `201 Created`

---

**Test P2.10: Update Portfolio Item**
```bash
# Use item ID from previous response
curl -X PUT http://localhost:8081/api/v1/users/me/portfolio/{item_id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated E-commerce Platform",
    "description": "Updated description"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "id": "...",
        "title": "Updated E-commerce Platform",
        ...
    },
    "message": "Portfolio item updated successfully"
}
```

**Status Code:** `200 OK`

---

**Test P2.11: Delete Portfolio Item**
```bash
curl -X DELETE http://localhost:8081/api/v1/users/me/portfolio/{item_id} \
  -H "Authorization: Bearer <token>"
```

**Expected Response:**
```json
{
    "data": {
        "message": "Portfolio item deleted successfully"
    },
    "message": "Portfolio item deleted"
}
```

**Status Code:** `200 OK`

---

#### 5. Search Tests

**Test P2.12: Search by Query**
```bash
curl -X POST http://localhost:8081/api/v1/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Go developer",
    "role": "freelancer"
  }'
```

**Expected Response:**
```json
{
    "data": {
        "users": [
            {
                "id": "...",
                "full_name": "John Doe",
                "bio": "Experienced Go developer",
                "skills": ["Go", "JavaScript"],
                ...
            }
        ],
        "total": 1,
        "page": 1,
        "limit": 20,
        "total_pages": 1
    },
    "message": "Search completed successfully"
}
```

**Status Code:** `200 OK`

---

**Test P2.13: Search by Skills**
```bash
curl -X POST http://localhost:8081/api/v1/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Go", "Python"],
    "role": "freelancer"
  }'
```

**Expected Response:** Users with Go OR Python skills

---

**Test P2.14: Search with Rate Range**
```bash
curl -X POST http://localhost:8081/api/v1/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "min_rate": 20.00,
    "max_rate": 50.00,
    "role": "freelancer"
  }'
```

**Expected Response:** Freelancers with hourly rate between $20-$50

---

**Test P2.15: Search with Pagination**
```bash
curl -X POST http://localhost:8081/api/v1/users/search \
  -H "Content-Type: application/json" \
  -d '{
    "role": "freelancer",
    "page": 2,
    "limit": 10
  }'
```

**Expected Response:**
```json
{
    "data": {
        "users": [...],
        "total": 25,
        "page": 2,
        "limit": 10,
        "total_pages": 3
    }
}
```

---

**Test P2.16: Search with Query Parameters**
```bash
curl "http://localhost:8081/api/v1/users/search?query=developer&role=freelancer&page=1&limit=20"
```

**Expected Response:** Same as JSON body search

---

#### 6. Error Handling Tests

**Test P2.17: Get Non-existent Profile**
```bash
curl http://localhost:8081/api/v1/users/nonexistent_id
```

**Expected Response:**
```json
{
    "error": "Not Found",
    "message": "User profile not found",
    "code": "PROFILE_NOT_FOUND"
}
```

**Status Code:** `404 Not Found`

---

**Test P2.18: Update Profile Without Auth**
```bash
curl -X PUT http://localhost:8081/api/v1/users/me \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test"}'
```

**Expected Response:**
```json
{
    "error": "Unauthorized",
    "message": "Authorization header required",
    "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

**Test P2.19: Invalid Portfolio Item ID**
```bash
curl -X PUT http://localhost:8081/api/v1/users/me/portfolio/invalid_id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

**Expected Response:**
```json
{
    "error": "Not Found",
    "message": "Portfolio item not found",
    "code": "ITEM_NOT_FOUND"
}
```

**Status Code:** `404 Not Found`

---

### Phase 2 (Execution): user_name, public profile, visibility

**Goal:** Verify `user_name` (unique slug), visibility flags, and public profile by user_name.  
**Service:** user-service. **Base URL:** e.g. `http://localhost:8081`. Use a valid `Authorization: Bearer <access_token>` for protected routes.

#### 1. Set user_name on create profile

```bash
# Create profile with user_name (replace TOKEN, ensure user has no profile yet)
curl -s -X POST http://localhost:8081/api/v1/users/me/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "short_headline": "Full-stack developer",
    "role": "freelancer",
    "user_name": "jane_doe"
  }'
```

**Expected:** `201 Created`; response includes `user_name: "jane_doe"` (or normalised form).  

**Invalid user_name (too short or bad chars):** use `"user_name": "ab"` or `"user_name": "Jane Doe"` → `400 Bad Request`, `code`: `INVALID_USER_NAME`.

#### 2. Update user_name and visibility (PUT /api/v1/users/me)

```bash
curl -s -X PUT http://localhost:8081/api/v1/users/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "jane_dev",
    "show_profile": true,
    "show_projects": true,
    "show_contracts": false
  }'
```

**Expected:** `200 OK`; profile shows updated `user_name` and visibility flags.  
**Conflict:** set `user_name` to a value another profile already has → `409 Conflict`, `code`: `USER_NAME_TAKEN`.

#### 3. Public profile by user_name (no auth)

```bash
# Existing, active profile with user_name
curl -s http://localhost:8081/api/v1/public/profile/jane_dev
```

**Expected:** `200 OK`; JSON must **not** include email or phone. Profile block and projects appear according to `show_profile` and `show_projects`.

```bash
# Non-existent or inactive
curl -s http://localhost:8081/api/v1/public/profile/nonexistent_slug_999
```

**Expected:** `404 Not Found`.

#### Phase 2 (user_name & public profile) checklist

- [ ] `user_name` can be set on create profile and normalised (e.g. lowercase, `[a-z0-9_]` only)
- [ ] Duplicate `user_name` returns `409 USER_NAME_TAKEN` on create and update
- [ ] Invalid `user_name` (length/characters) returns `400 INVALID_USER_NAME`
- [ ] `GET /api/v1/public/profile/{user_name}` returns 200 and respects visibility (no email/phone)
- [ ] `GET /api/v1/public/profile/{user_name}` returns 404 when user_name missing or profile inactive

---

### 🎯 Phase 2 Completion Checklist

- [ ] MongoDB is running and accessible
- [ ] User profile can be created
- [ ] Profile can be retrieved by ID and user ID
- [ ] Profile can be updated
- [ ] Skills can be added and removed
- [ ] Portfolio items can be added, updated, and deleted
- [ ] Search functionality works with various filters
- [ ] Pagination works correctly
- [ ] Protected routes require authentication
- [ ] Error handling returns appropriate status codes
- [ ] Validation works for all endpoints
- [ ] Phase 2 (user_name & public profile) checklist above is verified

---

### 🚀 Quick Test Script for Phase 2

Save this as `test_phase2.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8081"
TOKEN="your-jwt-token-here"

echo "=== Phase 2 Tests ==="
echo ""

echo "1. Testing Health Check..."
curl -s $BASE_URL/health | jq .
echo ""

echo "2. Testing Profile Update..."
curl -s -X PUT $BASE_URL/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","bio":"Test bio"}' | jq .
echo ""

echo "3. Testing Add Skill..."
curl -s -X POST $BASE_URL/api/v1/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill":"Go"}' | jq .
echo ""

echo "4. Testing Search..."
curl -s -X POST $BASE_URL/api/v1/users/search \
  -H "Content-Type: application/json" \
  -d '{"role":"freelancer","limit":5}' | jq .
echo ""

echo "All Phase 2 tests completed!"
```

**Run with:**
```bash
chmod +x test_phase2.sh
./test_phase2.sh
```

---

## 🧪 Phase 3 Week 4: Contract Service – Draft & Send

**Goal:** Verify contract create (draft), update, list, get, send, and delete.

### Prerequisites

1. Auth-service and contract-service running.
2. **DB:** Same PostgreSQL as auth/user (`freelancer_platform`). Contract-service creates `contracts` and `contract_milestones`.
3. **JWT:** Set `JWT_SECRET` in contract-service to the same value as auth-service.
4. Get an access token: login via auth-service, copy `access_token`.

```bash
# Start contract-service
cd backend/services/contract-service
go run cmd/server/main.go
# Default: http://localhost:8082
```

### Test cases

**1. Health**
```bash
curl -s http://localhost:8082/health
# Expect: "service":"contract-service", "status":"healthy"
```

**2. Create contract (draft)**  
Replace `YOUR_ACCESS_TOKEN` with a valid token from auth-service login.
```bash
curl -s -X POST http://localhost:8082/api/v1/contracts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_category": "web_dev",
    "project_name": "Company Website",
    "description": "Landing page + blog",
    "due_date": "2026-03-01T00:00:00Z",
    "total_amount": 50000,
    "currency": "INR",
    "client_name": "Acme Ltd",
    "client_company_name": "Acme",
    "client_email": "client@acme.com",
    "client_phone": "+919876543210",
    "terms_and_conditions": "Standard terms.",
    "milestones": [
      {"title": "Initial payment", "description": "Advance", "amount": 15000, "is_initial_payment": true},
      {"title": "Design approval", "description": "Mockups", "amount": 17500, "is_initial_payment": false},
      {"title": "Final delivery", "description": "Live site", "amount": 17500, "is_initial_payment": false}
    ]
  }'
# Expect: 201, data.status == "draft", data.milestones length 3
```

**3. List contracts**
```bash
curl -s "http://localhost:8082/api/v1/contracts?status=draft&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expect: 200, data.contracts array, data.total >= 0
```

**4. Get one contract**  
Use the contract `id` from the create response.
```bash
curl -s http://localhost:8082/api/v1/contracts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expect: 200, data.id, data.status "draft", data.milestones
```

**5. Update draft**
```bash
curl -s -X PUT http://localhost:8082/api/v1/contracts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_name": "Company Website v2", "client_company_name": "Acme Corp"}'
# Expect: 200, data.project_name "Company Website v2"
```

**6. Send to client**
```bash
curl -s -X POST http://localhost:8082/api/v1/contracts/1/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expect: 200, data.status "sent", data.sent_at set
# If SHAREABLE_LINK_BASE_URL is set: data.shareable_link == base + "/" + id
```

**7. List sent**
```bash
curl -s "http://localhost:8082/api/v1/contracts?status=sent" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expect: 200, data.contracts with status "sent"
```

**8. Delete draft only**  
Create another draft (e.g. id 2), then:
```bash
curl -s -X DELETE http://localhost:8082/api/v1/contracts/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expect: 200, message "Contract deleted"
# Sending DELETE for a non-draft contract must return 400 (only draft can be deleted)
```

### Week 4 completion checklist

- [ ] Health returns 200 and `service: contract-service`
- [ ] Create contract returns 201 and `status: draft`
- [ ] List contracts returns 200 with `contracts` and `total`
- [ ] Get by id returns 200 with full contract and milestones
- [ ] Update draft returns 200 and updated fields
- [ ] Send returns 200 and `status: sent`, `sent_at` set
- [ ] List by `status=sent` shows sent contracts
- [ ] Delete draft returns 200; delete non-draft returns 4xx

### Phase 3.2: Draft auto-delete, shareable link, email trigger

**Shareable link:** Set `SHAREABLE_LINK_BASE_URL=https://app.example.com/contract` (or leave unset). Send a contract; response includes `shareable_link` = base + token (UUID), e.g. `https://app.example.com/contract/a1b2c3d4-...`. Client uses that URL to view/sign/send-for-review (Phase 3.3).

**Draft auto-delete:** Configurable via `DRAFT_EXPIRY_DAYS` (default 14) and `DRAFT_CLEANUP_INTERVAL_MINS` (default 360). The service logs `[draft-cleanup] deleted N expired draft(s)` when it runs and removes drafts. To verify: create a draft, backdate it in DB (or set `DRAFT_EXPIRY_DAYS=0` and run once for testing), wait for the next job tick or restart with a short interval, and confirm the draft is gone.

**Email trigger:** `NotifyContractSent` is invoked asynchronously after send. Default is no-op; no test required until a real notifier is wired.

**Phase 3.2 checklist**

- [ ] With `SHAREABLE_LINK_BASE_URL` set, send returns `shareable_link` and GET contract returns it when status is sent
- [ ] Draft-cleanup job runs periodically (observe logs or use short interval for tests)
- [ ] Drafts older than `DRAFT_EXPIRY_DAYS` are permanently removed (manual DB check or backdate + wait)

### Phase 3.3: Client view, send-for-review, sign (no auth)

**Prereq:** Contract sent (so it has a `client_view_token`). Copy `shareable_link` from send response or from `GET /api/v1/contracts/:id`; the last path segment is the token.

**1. Client view**
```bash
# Replace TOKEN with the UUID from shareable_link (last path segment)
curl -s http://localhost:8082/api/v1/public/contracts/TOKEN
```
**Expected:** 200; JSON has project, client, milestones, terms, status; no `freelancer_user_id`. 404 if token invalid.

**2. Send for review**
```bash
curl -s -X POST http://localhost:8082/api/v1/public/contracts/TOKEN/send-for-review \
  -H "Content-Type: application/json" \
  -d '{"comment":"Please add milestone X."}'
```
**Expected:** 200, `"message":"Sent for review"`. Contract status becomes `pending`. Same call again → 409 ALREADY_PENDING.

**3. Freelancer re-send (auth)**
```bash
# As freelancer: update if needed, then send again (pending → sent)
curl -s -X POST http://localhost:8082/api/v1/contracts/CONTRACT_ID/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
**Expected:** 200, status `sent`; same token so client link still works.

**4. Client sign**
```bash
curl -s -X POST http://localhost:8082/api/v1/public/contracts/TOKEN/sign \
  -H "Content-Type: application/json" \
  -d '{"company_address":"Remote"}'
# Or: "company_address":"123 Main St" or a Google Maps URL
```
**Expected:** 200, contract in body, status `signed`. Same call again → 409 ALREADY_SIGNED. Invalid address (e.g. empty) → 400 INVALID_COMPANY_ADDRESS.

**Phase 3.3 checklist**

- [ ] GET /api/v1/public/contracts/:token returns 200 and contract fields (no auth)
- [ ] POST send-for-review returns 200 and status becomes pending; idempotent 409 when already pending
- [ ] Freelancer can update when pending and re-send; status goes pending → sent
- [ ] POST sign with company_address required (Remote | address | URL) returns 200 and status signed; 409 when already signed

### Phase 3.4: Wallets & blockchain on sign

**Prereq:** blockchain-service running on port 8083 (default). Set `BLOCKCHAIN_SERVICE_URL=http://localhost:8083` in contract-service `.env`. Generate `WALLET_ENCRYPTION_KEY` with `openssl rand -hex 32` and set in blockchain-service `.env`.

**1. Health check**
```bash
curl -s http://localhost:8083/health
# Expect: "service":"blockchain-service", "status":"healthy"
```

**2. Create/get wallet (auth required)**
```bash
# Replace TOKEN with access token from auth-service
curl -s -X POST http://localhost:8083/api/v1/wallets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"user_type":"freelancer"}'
```
**Expected:** 200; JSON has `address` (0x...), `user_id`, `user_type`, `network`. No `encrypted_private_key` (never exposed). Call again → same wallet (idempotent).

**3. Get wallet**
```bash
curl -s -X POST http://localhost:8083/api/v1/wallets/get \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"user_type":"freelancer"}'
```
**Expected:** 200; same wallet as above.

**4. Write contract to chain (via contract sign)**
```bash
# Sign a contract (as in Phase 3.3 test 4)
# This triggers contract-service → blockchain-service call (async)
# Check contract-service logs for blockchain write result
# Then verify contract has blockchain metadata:
curl -s http://localhost:8082/api/v1/contracts/CONTRACT_ID \
  -H "Authorization: Bearer TOKEN"
```
**Expected:** Contract response includes `blockchain_tx_hash`, `blockchain_tx_id`, `blockchain_network`, `blockchain_status` (pending or confirmed in mock mode).

**5. Get contract record from blockchain-service**
```bash
curl -s -X POST http://localhost:8083/api/v1/blockchain/contracts/get \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contract_id":CONTRACT_ID}'
```
**Expected:** 200; JSON has `transaction_hash`, `transaction_id`, `status`, `network`.

**Phase 3.4 checklist**

- [ ] blockchain-service health returns 200
- [ ] Create/get wallet returns 200 with address (no private key); idempotent
- [ ] Contract sign triggers blockchain write (check logs); contract has blockchain metadata
- [ ] Get contract record returns tx hash and status

**Note:** Current implementation uses mock/testnet mode (deterministic tx hashes). For real Base L2, set `BASE_L2_RPC_URL` and implement RPC calls in `blockchain_service.go`.

---

### 📊 Expected Test Results Summary

| Test Category | Tests | Passed | Failed |
|--------------|-------|--------|--------|
| Health Checks | 1 | ✅ | ❌ |
| Profile CRUD | 4 | ✅ | ❌ |
| Skills Management | 3 | ✅ | ❌ |
| Portfolio Management | 3 | ✅ | ❌ |
| Search | 5 | ✅ | ❌ |
| Error Handling | 3 | ✅ | ❌ |
| **Total** | **19** | **✅** | **❌** |

---

### 🔍 Debugging Tips

1. **MongoDB Connection Issues?**
   - Verify MongoDB is running: `docker ps | grep mongo`
   - Check connection string format
   - Verify authentication credentials

2. **Profile Not Found?**
   - Ensure profile exists for the user
   - Check user_id matches auth-service user ID
   - Verify MongoDB collection has data

3. **Search Not Working?**
   - Check filter syntax
   - Verify data exists matching search criteria
   - Test individual filters separately

4. **Array Operations Failing?**
   - Verify user profile exists before adding skills/portfolio
   - Check skill/item doesn't already exist
   - Verify ObjectID format for updates

---

**Document Version:** 4.0  
**Last Updated:** January 24, 2026  
**Next Update:** After Week 5 (signatures, milestones, IPFS)

