# Backend Development Learning Documentation
## Decentralized Freelancer Trust Platform

**Purpose:** This document tracks the implementation details, technologies, and concepts learned during the backend development process. It serves as a knowledge base for understanding how each phase was implemented.

---

## 📚 Week 1 - Phase 1: HTTP Server & Routing

**Duration:** Days 1-7  
**Goal:** Set up basic HTTP server, Chi router, request validation, and clean architecture structure

---

### 🏗️ Architecture Overview

We implemented a **clean architecture** pattern for the auth-service with the following structure:

```
auth-service/
├── cmd/server/          # Application entry point
│   └── main.go
├── internal/            # Private application code
│   ├── config/         # Configuration management
│   ├── domain/         # Domain entities (future)
│   ├── dto/            # Data Transfer Objects
│   ├── handler/        # HTTP handlers
│   ├── middleware/     # HTTP middleware
│   ├── repository/     # Data access layer (future)
│   └── service/        # Business logic (future)
└── pkg/                # Public packages
    └── jwt/            # JWT utilities (future)
```

**Why Clean Architecture?**
- **Separation of Concerns:** Each layer has a specific responsibility
- **Testability:** Easy to mock dependencies and test in isolation
- **Maintainability:** Changes in one layer don't affect others
- **Scalability:** Easy to add new features without breaking existing code

---

### 🔧 Technologies & Concepts Implemented

#### 1. **Go HTTP Server (`net/http`)**

**What we learned:**
- Go's standard library provides a robust HTTP server
- `http.Server` struct allows fine-grained control over server behavior
- Graceful shutdown is essential for production applications

**Implementation:**
```go
srv := &http.Server{
    Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
    Handler:      r,
    ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
    WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
    IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
}
```

**Key Concepts:**
- **ReadTimeout:** Maximum time to read the entire request
- **WriteTimeout:** Maximum time to write the response
- **IdleTimeout:** Maximum time to wait for the next request when keep-alives are enabled

**Graceful Shutdown:**
```go
// Wait for interrupt signal
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Shutdown with timeout
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
srv.Shutdown(ctx)
```

**Why Graceful Shutdown?**
- Prevents data loss during shutdown
- Allows in-flight requests to complete
- Properly closes database connections and resources

---

#### 2. **Chi Router (`github.com/go-chi/chi/v5`)**

**What we learned:**
- Chi is a lightweight, idiomatic HTTP router for Go
- Supports route groups, middleware, and URL parameters
- Better performance and more features than standard `http.ServeMux`

**Basic Setup:**
```go
r := chi.NewRouter()
r.Get("/health", healthHandler)
```

**Route Groups:**
```go
r.Route("/api/v1/auth", func(r chi.Router) {
    r.Post("/register", h.Register)
    r.Post("/login", h.Login)
    r.With(middleware.RequireAuth).Get("/me", h.Me)
})
```

**Key Features:**
- **Route Groups:** Organize related routes together
- **Middleware:** Apply middleware to specific routes or groups
- **URL Parameters:** Extract path parameters (e.g., `/users/{id}`)
- **Method Routing:** Separate handlers for GET, POST, PUT, DELETE

**Why Chi over other routers?**
- Lightweight and fast
- Standard library compatible
- Excellent middleware support
- Great for microservices

---

#### 3. **Middleware Pattern**

**What we learned:**
- Middleware functions wrap HTTP handlers
- They can modify requests/responses or add cross-cutting concerns
- Middleware chain executes in order

**Custom Middleware Implementation:**
```go
func Logger(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
        next.ServeHTTP(ww, r)
        duration := time.Since(start)
        log.Printf("[%s] %s %d %v", r.Method, r.RequestURI, ww.Status(), duration)
    })
}
```

**Middleware Types Implemented:**

1. **Logger Middleware**
   - Logs all HTTP requests with method, URI, status, and duration
   - Uses Chi's `WrapResponseWriter` to capture status code

2. **Recoverer Middleware**
   - Catches panics and prevents server crashes
   - Returns 500 error instead of crashing

3. **CORS Middleware**
   - Handles Cross-Origin Resource Sharing
   - Sets appropriate headers for browser requests
   - Handles preflight OPTIONS requests

4. **Request ID Middleware** (Chi built-in)
   - Adds unique ID to each request for tracing

5. **Real IP Middleware** (Chi built-in)
   - Extracts real client IP from proxy headers

**Middleware Chain:**
```go
r.Use(chimw.RequestID)    // 1. Add request ID
r.Use(chimw.RealIP)       // 2. Extract real IP
r.Use(appmw.Logger)        // 3. Log request
r.Use(appmw.Recoverer)    // 4. Catch panics
r.Use(appmw.CORS)         // 5. Handle CORS
r.Use(chimw.Timeout(60))  // 6. Set timeout
```

**Execution Order:** Middleware executes in the order it's registered (top to bottom), then handlers, then reverse order for response.

---

#### 4. **Request Validation (`go-playground/validator/v10`)**

**What we learned:**
- Input validation is critical for security and data integrity
- Struct tags provide declarative validation rules
- Validator library supports many built-in validators

**DTO (Data Transfer Object) Pattern:**
```go
type RegisterRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    FullName string `json:"full_name" validate:"required,min=2,max=100"`
}
```

**Validation Tags:**
- `required`: Field must be present
- `email`: Must be valid email format
- `min=8`: Minimum length of 8 characters
- `max=100`: Maximum length of 100 characters

**Validation Implementation:**
```go
func (v *Validator) ValidateJSON(r *http.Request, dst interface{}) error {
    // 1. Decode JSON body
    if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
        return fmt.Errorf("invalid JSON: %w", err)
    }
    
    // 2. Validate struct
    if err := v.validate.Struct(dst); err != nil {
        return v.formatValidationError(err)
    }
    
    return nil
}
```

**Error Formatting:**
- Converts validation errors to human-readable messages
- Returns all validation errors in a single response
- Provides field-specific error messages

**Why Validation?**
- **Security:** Prevents injection attacks and malformed data
- **Data Integrity:** Ensures data meets business rules
- **User Experience:** Provides clear error messages
- **API Contract:** Enforces API expectations

---

#### 5. **Configuration Management**

**What we learned:**
- Configuration should be externalized (environment variables)
- Default values provide sensible fallbacks
- Type-safe configuration structs prevent errors

**Implementation:**
```go
type Config struct {
    Server   ServerConfig
    App      AppConfig
    Database DatabaseConfig
}

func Load() *Config {
    return &Config{
        Server: ServerConfig{
            Host: getEnv("SERVER_HOST", "0.0.0.0"),
            Port: getEnv("SERVER_PORT", "8080"),
            // ...
        },
    }
}
```

**Environment Variables:**
- `SERVER_HOST`: Server host (default: "0.0.0.0")
- `SERVER_PORT`: Server port (default: "8080")
- `APP_ENV`: Environment (default: "development")
- `LOG_LEVEL`: Log level (default: "info")

**Why Environment Variables?**
- Different configs for dev/staging/production
- No hardcoded secrets in code
- Easy to change without code modifications
- Follows 12-factor app principles

---

#### 6. **Handler Pattern**

**What we learned:**
- Handlers are HTTP request processors
- Each handler should have a single responsibility
- Response helpers keep code DRY

**Handler Structure:**
```go
type AuthHandler struct {
    validator *middleware.Validator
}

func (h *AuthHandler) RegisterRoutes(r chi.Router) {
    r.Route("/api/v1/auth", func(r chi.Router) {
        r.Post("/register", h.Register)
        r.Post("/login", h.Login)
    })
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
    // 1. Validate request
    // 2. Process business logic
    // 3. Return response
}
```

**Response Helpers:**
```go
// Success response
respondSuccess(w, http.StatusOK, data, "Message")

// Error response
respondError(w, http.StatusBadRequest, "Error message", "ERROR_CODE")
```

**Benefits:**
- Consistent response format
- Easy to modify response structure
- Centralized error handling

---

#### 7. **Health Check Endpoints**

**What we learned:**
- Health checks are essential for monitoring and orchestration
- Different types: liveness, readiness, health
- Kubernetes and load balancers use these endpoints

**Endpoints Implemented:**
- `GET /health`: Basic health status
- `GET /health/live`: Liveness probe (is service running?)
- `GET /health/ready`: Readiness probe (can service accept traffic?)

**Response Format:**
```json
{
    "status": "healthy",
    "timestamp": "2026-01-24T10:30:00Z",
    "service": "auth-service",
    "version": "1.0.0"
}
```

**Why Health Checks?**
- **Monitoring:** Track service availability
- **Orchestration:** Kubernetes uses them for rolling updates
- **Load Balancing:** Remove unhealthy instances
- **Debugging:** Quick way to verify service is running

---

### 📝 Code Patterns & Best Practices

#### 1. **Error Handling**
- Always return errors, don't ignore them
- Wrap errors with context: `fmt.Errorf("failed to decode: %w", err)`
- Use custom error types for different error categories

#### 2. **JSON Responses**
- Consistent response structure across all endpoints
- Proper HTTP status codes
- Error responses include error code for client handling

#### 3. **Project Structure**
- `cmd/`: Application entry points
- `internal/`: Private application code
- `pkg/`: Public packages that can be imported
- Clear separation of concerns

#### 4. **Code Organization**
- One file per concern (handler, middleware, config)
- Group related functionality
- Use interfaces for testability (future)

---

### 🎯 Week 1 Deliverables

✅ **Day 1-2: Basic HTTP Server**
- HTTP server with configurable timeouts
- Health check endpoints
- Graceful shutdown

✅ **Day 3-4: Chi Router Setup**
- Route groups for API versioning
- Middleware chain
- URL parameter support (prepared for future use)

✅ **Day 5: Request Validation**
- DTO structs with validation tags
- JSON validation middleware
- Human-readable error messages

✅ **Day 6-7: Project Structure**
- Clean architecture layout
- Configuration management
- Response helpers

---

---

## 📚 Week 2 - Phase 1: Database & JWT Authentication

**Duration:** Days 8-14  
**Goal:** Implement PostgreSQL integration, password hashing, JWT authentication, and OAuth stubs

---

### 🗄️ Database Integration

#### PostgreSQL + GORM Setup

**What we learned:**
- GORM is a powerful ORM for Go that simplifies database operations
- Database migrations ensure schema consistency
- Connection pooling is handled automatically by GORM

**Implementation:**
```go
// Database connection
dsn := fmt.Sprintf(
    "host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
    cfg.Database.Host, cfg.Database.User, cfg.Database.Password,
    cfg.Database.DBName, cfg.Database.Port,
)

db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
    Logger: logger.Default.LogMode(logLevel),
})
```

**Auto Migration:**
```go
// Run migrations on startup
config.AutoMigrate(db, &domain.User{})
```

**Key Concepts:**
- **DSN (Data Source Name):** Connection string format for PostgreSQL
- **Auto Migration:** Automatically creates/updates database schema
- **GORM Logger:** Configurable logging for SQL queries (useful in development)

**Why GORM?**
- Type-safe database operations
- Automatic migration support
- Relationship management
- Query builder with chainable methods
- Works with multiple databases (PostgreSQL, MySQL, SQLite)

---

### 👤 User Domain Model

**What we learned:**
- Domain models represent core business entities
- GORM tags define database schema
- Soft deletes preserve data integrity

**User Model:**
```go
type User struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Email     string         `gorm:"uniqueIndex;not null" json:"email"`
    Password  string         `gorm:"not null" json:"-"` // Never return in JSON
    FullName  string         `gorm:"not null" json:"full_name"`
    Role      string         `gorm:"default:user" json:"role"`
    IsActive  bool           `gorm:"default:true" json:"is_active"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete
}
```

**Key Features:**
- **Primary Key:** Auto-incrementing ID
- **Unique Index:** Email must be unique
- **Soft Delete:** Uses `DeletedAt` for logical deletion
- **Timestamps:** Automatic `CreatedAt` and `UpdatedAt`
- **Password Exclusion:** `json:"-"` prevents password in API responses

---

### 🏗️ Repository Pattern

**What we learned:**
- Repository pattern abstracts data access
- Interface-based design enables testing with mocks
- Error handling with custom error types

**Repository Interface:**
```go
type UserRepository interface {
    Create(user *domain.User) error
    FindByID(id uint) (*domain.User, error)
    FindByEmail(email string) (*domain.User, error)
    Update(user *domain.User) error
    Delete(id uint) error
}
```

**Implementation Benefits:**
- **Testability:** Easy to mock for unit tests
- **Flexibility:** Can swap database implementations
- **Separation:** Business logic doesn't depend on database details

**Error Handling:**
```go
var (
    ErrUserNotFound = errors.New("user not found")
    ErrUserExists   = errors.New("user already exists")
)
```

---

### 🔐 Password Hashing with bcrypt

**What we learned:**
- Never store passwords in plain text
- bcrypt provides secure one-way hashing
- Cost factor controls hashing complexity

**Password Hashing:**
```go
// Hash password during registration
hashedPassword, err := bcrypt.GenerateFromPassword(
    []byte(req.Password), 
    bcrypt.DefaultCost, // Cost factor: 10
)
```

**Password Verification:**
```go
// Verify password during login
err := bcrypt.CompareHashAndPassword(
    []byte(user.Password), 
    []byte(req.Password),
)
```

**Key Concepts:**
- **One-Way Hash:** Cannot reverse to get original password
- **Salt:** Automatically generated and included in hash
- **Cost Factor:** Higher cost = more secure but slower (default: 10)
- **Timing Attack Protection:** Constant-time comparison

**Why bcrypt?**
- Industry standard for password hashing
- Adaptive cost factor
- Built-in salt generation
- Resistant to rainbow table attacks

---

### 🎫 JWT Token Management

**What we learned:**
- JWT (JSON Web Tokens) for stateless authentication
- Access tokens for API requests
- Refresh tokens for obtaining new access tokens
- Token expiration and validation

**JWT Claims Structure:**
```go
type Claims struct {
    UserID   uint   `json:"user_id"`
    Email    string `json:"email"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

**Token Generation:**
```go
// Access token (short-lived, e.g., 24 hours)
accessToken, err := jwtManager.GenerateAccessToken(userID, email, role)

// Refresh token (long-lived, e.g., 7 days)
refreshToken, err := jwtManager.GenerateRefreshToken(userID, email, role)
```

**Token Validation:**
```go
claims, err := jwtManager.ValidateToken(tokenString)
if err != nil {
    // Handle invalid/expired token
}
```

**JWT Structure:**
- **Header:** Algorithm and token type
- **Payload:** Claims (user data, expiration, etc.)
- **Signature:** HMAC signature for verification

**Token Lifecycle:**
1. User logs in → Receive access + refresh tokens
2. Use access token for API requests
3. Access token expires → Use refresh token to get new tokens
4. Refresh token expires → User must login again

**Security Considerations:**
- Store secret key securely (environment variable)
- Use HTTPS in production
- Set appropriate expiration times
- Implement token blacklisting for logout (future)

---

### 🛡️ Authentication Middleware

**What we learned:**
- Middleware validates JWT tokens on protected routes
- Context values pass user info to handlers
- Bearer token format: `Authorization: Bearer <token>`

**Implementation:**
```go
func RequireAuth(jwtManager *jwt.JWTManager) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract Bearer token
            authHeader := r.Header.Get("Authorization")
            tokenString := strings.Split(authHeader, " ")[1]
            
            // Validate token
            claims, err := jwtManager.ValidateToken(tokenString)
            
            // Add user info to context
            ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

**Usage:**
```go
r.With(middleware.RequireAuth(jwtManager)).Get("/me", h.Me)
```

**Context Values:**
- `user_id`: User ID from token
- `user_email`: User email from token
- `user_role`: User role from token

---

### 🔄 Service Layer

**What we learned:**
- Service layer contains business logic
- Coordinates between repository and external services
- Handles business rules and validations

**Auth Service Methods:**
```go
type AuthService struct {
    userRepo   repository.UserRepository
    jwtManager *jwt.JWTManager
}

// Register: Create user, hash password, generate tokens
func (s *AuthService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error)

// Login: Verify credentials, generate tokens
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error)

// RefreshToken: Validate refresh token, generate new tokens
func (s *AuthService) RefreshToken(refreshToken string) (*dto.AuthResponse, error)
```

**Business Logic Flow:**
1. **Register:**
   - Check if user exists
   - Hash password
   - Create user in database
   - Generate JWT tokens
   - Return tokens

2. **Login:**
   - Find user by email
   - Check if user is active
   - Verify password
   - Generate JWT tokens
   - Return tokens

3. **Refresh:**
   - Validate refresh token
   - Find user
   - Check if user is active
   - Generate new tokens
   - Return tokens

---

### 🔗 OAuth Integration Stubs

**What we learned:**
- OAuth allows users to login with third-party providers
- Stub endpoints prepare for future implementation
- Google and LinkedIn are common OAuth providers

**OAuth Endpoints (Stubs):**
```go
// Google OAuth
GET  /api/v1/auth/oauth/google
GET  /api/v1/auth/oauth/google/callback

// LinkedIn OAuth
GET  /api/v1/auth/oauth/linkedin
GET  /api/v1/auth/oauth/linkedin/callback
```

**OAuth Flow (Future Implementation):**
1. User clicks "Login with Google"
2. Redirect to Google OAuth consent page
3. User authorizes
4. Google redirects to callback with code
5. Exchange code for access token
6. Get user info from Google
7. Create/login user in our system
8. Generate JWT tokens

---

### 📝 Updated Handler Implementation

**What we learned:**
- Handlers now use service layer instead of placeholders
- Proper error handling with appropriate HTTP status codes
- Context extraction for authenticated requests

**Register Handler:**
```go
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
    // Validate request
    var req dto.RegisterRequest
    if err := h.validator.ValidateJSON(r, &req); err != nil {
        respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
        return
    }
    
    // Call service
    authResp, err := h.authService.Register(&req)
    if err != nil {
        // Handle errors (user exists, etc.)
    }
    
    respondSuccess(w, http.StatusCreated, authResp, "User registered successfully")
}
```

**Me Handler (Protected):**
```go
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
    // Extract user ID from context (set by auth middleware)
    userID := r.Context().Value("user_id").(uint)
    
    // Get user from service
    user, err := h.authService.GetUserByID(userID)
    
    respondSuccess(w, http.StatusOK, user, "User retrieved successfully")
}
```

---

### 🎯 Week 2 Deliverables

✅ **Day 8-9: PostgreSQL + GORM**
- Database connection setup
- User model with GORM tags
- Auto migration on startup
- Repository pattern implementation

✅ **Day 10-11: Password Hashing & JWT**
- bcrypt password hashing
- JWT token generation (access + refresh)
- JWT token validation
- Token expiration handling

✅ **Day 12: Auth Middleware**
- JWT validation middleware
- Context-based user info passing
- Protected route implementation

✅ **Day 13-14: OAuth Stubs**
- Google OAuth endpoints (stubs)
- LinkedIn OAuth endpoints (stubs)
- Route registration

---

### 🔄 What's Next (Week 3 - Phase 2)

- User Service implementation
- MongoDB integration
- Profile management
- Skills and portfolio
- gRPC integration

---

### 📖 Key Takeaways

1. **Repository Pattern** abstracts data access and enables testing
2. **bcrypt** provides secure password hashing with built-in salt
3. **JWT Tokens** enable stateless authentication
4. **Service Layer** contains business logic separate from handlers
5. **Context Values** pass user info from middleware to handlers
6. **GORM** simplifies database operations with type safety
7. **Auto Migration** ensures schema consistency across environments

---

---

## 📚 Phase 2: User Service - MongoDB & Profile Management

**Duration:** Week 3 (Days 15-21)  
**Goal:** Implement user profile management with MongoDB, skills, and portfolio

---

### 🗄️ MongoDB Integration

#### MongoDB Setup

**What we learned:**
- MongoDB is a NoSQL document database
- Perfect for flexible schema (user profiles with varying fields)
- MongoDB Go driver provides type-safe operations
- Connection pooling is handled automatically

**Implementation:**
```go
// MongoDB connection
clientOptions := options.Client().ApplyURI(cfg.Database.URI)
client, err := mongo.Connect(ctx, clientOptions)

// Get database instance
db := client.Database(cfg.Database.Database)
```

**Key Concepts:**
- **Connection URI:** `mongodb://localhost:27017` or `mongodb+srv://` for Atlas
- **Database:** Logical grouping of collections
- **Collections:** Equivalent to tables in SQL
- **Documents:** JSON-like BSON documents

**Why MongoDB for User Service?**
- Flexible schema for varying profile structures
- Easy to add new fields without migrations
- Good for nested data (portfolio items, skills arrays)
- Scales horizontally
- JSON-like structure matches API responses

---

### 📄 Document Model Design

**What we learned:**
- BSON tags map Go structs to MongoDB documents
- `primitive.ObjectID` for MongoDB document IDs
- Embedded documents for nested structures
- Arrays for skills and portfolio items

**User Profile Model:**
```go
type UserProfile struct {
    ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID      uint               `bson:"user_id" json:"user_id"`
    FullName    string             `bson:"full_name" json:"full_name"`
    Skills      []string           `bson:"skills,omitempty" json:"skills,omitempty"`
    Portfolio   []PortfolioItem    `bson:"portfolio,omitempty" json:"portfolio,omitempty"`
    // ...
}
```

**Key Features:**
- **ObjectID:** MongoDB's unique identifier
- **Embedded Documents:** Portfolio items stored as array
- **Flexible Fields:** Optional fields with `omitempty`
- **BSON Tags:** Control how data is stored in MongoDB

---

### 🔍 Repository Pattern with MongoDB

**What we learned:**
- MongoDB operations use context for cancellation
- Query filters use BSON maps
- Update operations use `$set`, `$push`, `$pull` operators
- Pagination with `Skip` and `Limit`

**Search Implementation:**
```go
// Build filter
filter := bson.M{
    "is_active": true,
    "role": "freelancer",
    "skills": bson.M{"$in": []string{"Go", "Python"}},
}

// Pagination
opts := options.Find().SetSkip(skip).SetLimit(limit)

// Execute query
cursor, err := collection.Find(ctx, filter, opts)
```

**Array Operations:**
```go
// Add skill
update := bson.M{
    "$addToSet": bson.M{"skills": skill},
    "$set":      bson.M{"updated_at": time.Now()},
}

// Remove skill
update := bson.M{
    "$pull": bson.M{"skills": skill},
}
```

**Key MongoDB Operators:**
- `$in`: Match any value in array
- `$regex`: Text search with regex
- `$gte`, `$lte`: Range queries
- `$addToSet`: Add to array if not exists
- `$pull`: Remove from array
- `$push`: Add to array

---

### 🔎 Advanced Search Functionality

**What we learned:**
- Multi-criteria search with flexible filters
- Text search across multiple fields
- Pagination for large result sets
- Filter combination with BSON maps

**Search Features:**
- **Text Search:** Name, bio, skills
- **Role Filter:** Freelancer, client, both
- **Skills Filter:** Match any skill in array
- **Rate Range:** Min/max hourly rate
- **Location:** Regex-based location search
- **Availability:** Filter by availability status

**Implementation:**
```go
// Build dynamic filter
filter := bson.M{"is_active": true}

if req.Role != "" {
    filter["role"] = req.Role
}

if len(req.Skills) > 0 {
    filter["skills"] = bson.M{"$in": req.Skills}
}

// Text search across multiple fields
if req.Query != "" {
    filter["$or"] = []bson.M{
        {"full_name": bson.M{"$regex": req.Query, "$options": "i"}},
        {"bio": bson.M{"$regex": req.Query, "$options": "i"}},
    }
}
```

---

### 🎨 Skills & Portfolio Management

**What we learned:**
- Array operations in MongoDB
- Nested document updates
- Positional operators for array updates

**Skills Management:**
- Add skill: `$addToSet` prevents duplicates
- Remove skill: `$pull` removes from array
- Skills stored as string array

**Portfolio Management:**
- Portfolio items as embedded documents
- Each item has its own ObjectID
- Update specific item using positional operator `$`

**Portfolio Update:**
```go
filter := bson.M{
    "user_id": userID,
    "portfolio._id": itemID,
}

update := bson.M{
    "$set": bson.M{
        "portfolio.$.title": item.Title,
        "portfolio.$.description": item.Description,
    },
}
```

---

### 🛡️ Authentication Middleware (Placeholder)

**What we learned:**
- Middleware extracts user info from JWT token
- Context values pass user ID to handlers
- Protected routes require authentication

**Current Implementation:**
- Placeholder authentication (extracts user_id from context)
- In production, will validate JWT with auth-service via gRPC
- Context-based user identification

**Future Enhancement:**
- gRPC call to auth-service for token validation
- Cache validated tokens
- Role-based access control

---

### 📊 Service Layer Patterns

**What we learned:**
- Service layer coordinates repository operations
- Business logic separate from data access
- DTO conversion for API responses
- Error handling and validation

**Service Methods:**
- `GetProfile`: Retrieve by ID or user ID
- `UpdateProfile`: Create or update profile
- `SearchProfiles`: Multi-criteria search
- `AddSkill`/`RemoveSkill`: Array operations
- `AddPortfolioItem`/`UpdatePortfolioItem`/`DeletePortfolioItem`: Portfolio management

**DTO Conversion:**
- Domain models → DTOs for API responses
- Handle ObjectID to string conversion
- Format timestamps as ISO 8601
- Filter sensitive data

---

### 🎯 Phase 2 Deliverables

✅ **Day 15-16: MongoDB Setup**
- MongoDB connection and configuration
- Database initialization
- Collection setup

✅ **Day 17-18: Profile CRUD**
- Create user profile
- Get profile by ID/user ID
- Update profile
- Search profiles

✅ **Day 19-20: Skills & Portfolio**
- Add/remove skills
- Add portfolio items
- Update portfolio items
- Delete portfolio items

✅ **Day 21: gRPC Integration (Pending)**
- gRPC client setup
- Auth service integration
- Token validation

---

### Phase 2 (Execution plan): user_name, public profile, visibility

**Scope:** Unique `user_name` for `ourdomain.com/user_name`, public profile by user_name, and visibility flags (profile / projects / contracts).

**Implementations and locations:**

- **user_name**
  - Stored on `user_profiles`; normalised to `[a-z0-9_]`, length 3–30. Empty allowed (no public URL).
  - Uniqueness: app check via `FindByUserName` on create/update; DB partial unique index `WHERE user_name != '' AND user_name IS NOT NULL`.
  - Set on create (`CreateProfileRequest.UserName`) and update (`UpdateProfileRequest.UserName`). Create/Update return `409 USER_NAME_TAKEN` or `400 INVALID_USER_NAME` when invalid or taken.

- **Public profile by user_name**
  - Route: `GET /api/v1/public/profile/{user_name}` (no auth).
  - Handler calls `GetPublicProfileByUserName`; returns `PublicProfileResponse` (no email/phone). Returns 404 when profile not found or inactive.

- **Visibility**
  - Flags on `user_profiles`: `show_profile`, `show_projects`, `show_contracts` (defaults: true, true, false).
  - Public response includes profile block only if `show_profile`, projects only if `show_projects`; `show_contracts` stored for future contract section.

**Where it lives (user-service):**
- `internal/domain/user.go`: `UserName`, `ShowProfile`, `ShowProjects`, `ShowContracts`
- `internal/dto/profile.go`: `UserName` in create/update requests; `internal/dto/user.go`: `UserProfileResponse`, `PublicProfileResponse`
- `internal/repository/user_repository.go`: `FindByUserName`, `ErrUserNameTaken`
- `internal/service/user_service.go`: `normaliseUserName`, `ErrInvalidUserName`, `GetPublicProfileByUserName`, `UpdateProfile` (user_name + visibility)
- `internal/service/profile_service.go`: `CreateProfile` (user_name + defaults)
- `internal/handler/user.go`: `GetPublicProfile`, `CreateProfile` / `UpdateMyProfile` error mapping
- `internal/config/database.go`: partial unique index on `user_name`

---

### 🔄 What's Next (Phase 3)

- Contract Service implementation
- Contract lifecycle management
- Digital signatures
- Milestone tracking
- IPFS integration

---

## 📚 Phase 3 Week 4: Contract Service (Digital Contract Lifecycle)

**Duration:** Week 4  
**Goal:** Freelancer can create contracts (draft), save draft, and send to client.

---

### 🏗️ Contract service layout

```
contract-service/
├── cmd/server/main.go
├── internal/
│   ├── config/       # Server, DB, JWT config
│   ├── domain/       # Contract, ContractMilestone (GORM)
│   ├── dto/          # CreateContractRequest, UpdateContractRequest, ContractResponse
│   ├── handler/      # ContractHandler, HealthHandler
│   ├── middleware/   # RequireAuth(JWT), CORS, Logger, Recoverer, Validator
│   ├── repository/   # ContractRepository (Create, GetByID, List, Update, UpdateStatusAndSentAt, Delete)
│   └── service/      # ContractService (Create, GetByID, List, Update, Send, Delete)
└── SETUP.md, .env.example
```

- **Same PostgreSQL** as auth/user: `freelancer_platform`. New tables: `contracts`, `contract_milestones`.
- **JWT:** Same `JWT_SECRET` as auth-service; middleware validates access token and sets `user_id` / `user_email` in context.

---

### 🔧 Domain and lifecycle

- **Contract:** `freelancer_user_id`, project (category, name, description, due_date, total_amount, currency, prd_file_url, submission_criteria), client (name, company, email, phone), terms_and_conditions, **status**, sent_at, timestamps.
- **ContractMilestone:** contract_id, order_index, title, description, amount, due_date, is_initial_payment, status (e.g. pending).
- **Status flow (Week 4):** `draft` → (send) → `sent`. Later: signed, active, completed, cancelled.

---

### 📡 APIs implemented

| Method | Path | Purpose |
|--------|------|--------|
| POST | /api/v1/contracts | Create contract as draft |
| GET | /api/v1/contracts?status=&page=&limit= | List my contracts |
| GET | /api/v1/contracts/:id | Get one contract |
| PUT | /api/v1/contracts/:id | Update draft only |
| POST | /api/v1/contracts/:id/send | Draft → sent |
| DELETE | /api/v1/contracts/:id | Delete draft only |

All except health require `Authorization: Bearer <access_token>` (same token as auth-service).

---

### 📖 Concepts used

1. **Clean architecture** – handler → service → repository, DTOs at boundary.
2. **GORM** – same DB as other services; transactions for contract + milestones.
3. **JWT validation** – shared secret, claims `user_id`, `email` for ownership checks.
4. **Lifecycle rules** – update/delete only when status is `draft`; send only from `draft` to `sent`.

---

### Phase 3.2: Draft auto-delete & send experience

**Scope:** Auto-delete drafts older than 14 days, shareable contract link for freelancer, and “email to client” trigger when contract is sent.

**Implementations and locations (contract-service):**

- **Draft auto-delete**  
  - Repository: `DeleteDraftsOlderThan(ctx, cutoff time.Time) (int64, error)` – hard-deletes drafts (and their milestones) with `status = draft` and `created_at < cutoff`.  
  - Service: `DeleteExpiredDrafts(ctx) (int64, error)` – uses `DraftExpiryDays` to compute cutoff and calls repo.  
  - Job: `internal/job/draft_cleanup.go` – `DraftCleanupRunner` runs `DeleteExpiredDrafts` every `DraftCleanupIntervalMins`. Started in main in a goroutine; stops on shutdown via context cancel.  
  - Config: `DRAFT_EXPIRY_DAYS` (default 14), `DRAFT_CLEANUP_INTERVAL_MINS` (default 360).

- **Shareable contract link**  
  - `SHAREABLE_LINK_BASE_URL` (e.g. `https://app.ourdomain.com/contract`) is set in config.  
  - When status is `sent`, `ContractResponse.ShareableLink` = base + `"/" + id`.  
  - Set in service `toResponse` / `toResponseWithShareable` and in `Send` response.

- **Email-to-client trigger**  
  - `internal/notification/notifier.go`: `ContractNotifier` interface with `NotifyContractSent(ctx, contractID, clientEmail, shareableLink)`.  
  - `NoopNotifier` is the default; implementors can send email or call a notification service.  
  - `Send` calls `notifier.NotifyContractSent` in a goroutine after updating DB so the hot path is not blocked.

**Decisions:**  
- Draft cleanup is an in-process ticker job, not an external cron, to keep the service self-contained and documented in one place.  
- Shareable link uses contract ID; signed/tokenised links can be added in 3.3 when client view by token exists.  
- Email is offloaded via interface + goroutine to satisfy “heavy work off hot path” and make it easy to plug in a real notification service later.

---

### Phase 3.3: Client view, sign, send for review

**Scope:** Client view by token (no auth), send-for-review (comment → pending), sign (company_address required; optional fields stored). GST validator deferred; wallets/blockchain in 3.4.

**Where:** contract-service. **Token:** UUID set on first send; shareable_link = base + token. **Public routes:** `GET /api/v1/public/contracts/:token`, `POST .../send-for-review`, `POST .../sign`. **Domain:** status `pending`; columns client_view_token, client_review_comment, client_signed_at, client_company_address, client_sign_metadata. **Repo:** FindByClientViewToken, UpdateToPendingByToken, UpdateToSignedByToken. **Service:** GetByClientToken, SendForReview, Sign; validateCompanyAddress (Remote | address | URL). **Re-send:** Update allowed when draft or pending; Send when pending uses UpdateStatusAndSentAt (same token).

---

### Phase 3.4: Wallets & blockchain on sign

**Scope:** Separate blockchain-service microservice for wallet management and Base L2 contract writing. Wallets created on-demand; blockchain write triggered async on contract sign.

**Where:** blockchain-service (new microservice). **Domain:** `wallets` (user_id, user_type, address, encrypted_private_key), `contract_records` (contract_id, transaction_hash, block_number, gas_used, status). **Wallet service:** `CreateOrGetWallet`, `GetWallet`; key generation via `pkg/wallet` (ECDSA, encrypted with AES-256-GCM). **Blockchain service:** `WriteContractToChain` (mock/testnet mode; generates deterministic tx hashes; ready for real Base L2 RPC). **Integration:** contract-service `internal/blockchain/client.go` calls blockchain-service on sign (async, off hot path); updates contract with blockchain metadata via `UpdateBlockchainMetadata`.

**Decisions:**  
- Separate microservice for clear ownership and scale.  
- Wallets encrypted at rest; master key (`WALLET_ENCRYPTION_KEY`) must be kept secret.  
- Blockchain write is async to keep sign API fast; errors logged but don't fail sign.  
- Mock/testnet mode allows development without Base L2 access; replace `generateMockTransactionHash` and implement `submitToBaseL2` when RPC is available.  
- Contract domain stores blockchain metadata for querying and display.

---

### Contract form: total amount, milestone sum, AI suggestions (March 2026)

**Frontend (`CreateContractForm.tsx`):**  
- **Project details:** User sets **contract currency** and **total contract amount**; milestone amounts must sum to that total (enforced in `buildContractPayload` and UI hints on step 3 and 4).  
- **Payment terms:** Advance payment UI removed; payload sends `advance_payment_required: false`, `advance_payment_amount: 0`.  
- **Scope & deliverables (step 3):** Revision policy, out of scope, core deliverable, IP only — no milestones here. **Generate with AI** on Out of scope / Core deliverable calls **`POST /api/v1/contracts/suggest/scope`** (project details, client name/company, timeline, **total amount**, **PRD session cache**); both textareas are filled together for a consistent split.  
- **Payment terms (step 4):** Milestones, payment split check, **AI suggest milestones** button, payment method, **Terms & Conditions** with **Generate with AI** (`POST /api/v1/contracts/suggest/terms`, fallback `suggest-terms`) using project, client, milestones, timeline, payment method, scope, PRD cache, optional existing terms. **Continue to review** skips the AI modal if milestones already sum to the contract total; otherwise opens the same modal (missing fields vs Groq suggestions). Add/edit milestone dialog is mounted at the **root** (high z-index) so it is not lost on step changes.  
- **AI modal:** **`POST /api/v1/contracts/suggest-milestones`** includes optional **`payment_method`**. If the user uploaded a PRD, **`prd_extracted_text`** is sent from **`sessionStorage`** (`frontend/src/utils/prdSessionCache.ts`) so Groq can ground milestones in the document. **`prd_uploaded`** is true if a file is selected or cached text exists. Cache is cleared when the contract is **sent**, when the user **closes** the form to the dashboard (`HomePage` + `leaveContractToDashboard`), or when **navigating away** from `/contract` / `/contract/:id` (same-origin `sessionStorage` also clears when the **browser tab** closes).  
- **PRD upload response** includes **`prd_extracted_text`** (plain text, capped server-side); the form stores it in session cache on success.  

**Backend (contract-service):**  
- **`SuggestMilestonesRequest` / response** in `internal/dto/contract.go`; **`ContractService.SuggestMilestones`** uses Groq with a system prompt focused on **Indian freelancer–client** milestone splits; **`normalizeSuggestedMilestoneAmounts`** forces amounts to sum to `total_amount`. Optional **`prd_extracted_text`** is appended to the user message (**truncated** with `truncateRunes` for the LLM).  
- **`ExtractFromPRDBytes` / `ExtractFromPRD`** return **`(*ExtractedContract, plainText, error)`**; **`POST /prd-upload`** and **`POST /extract-from-prd`** include **`prd_extracted_text`** in `data` (extract-from-prd wraps structured fields under **`extracted_contract`**).  
- **`SuggestScope`** / **`POST /suggest/scope`** (and legacy **`POST /suggest-scope`**): `SuggestScopeRequest` → Groq JSON **`core_deliverable`**, **`out_of_scope_work`**; optional **`prd_extracted_text`** appended (truncated like milestones).  
- **`SuggestTerms`** / **`POST /suggest/terms`** (and legacy **`POST /suggest-terms`**): `SuggestTermsRequest` (includes **milestones** array + client + scope + PRD) → Groq JSON **`terms_and_conditions`**; output truncated to storage max (~10k runes). Prompt covers **ghosting/responsiveness**, **integrity / anti-fraud**, IP, payment, liability, disputes (India-oriented framing; not legal advice).  
- **Routes (authenticated):** `POST /api/v1/contracts/suggest-milestones` (`SuggestMilestones`); `POST /api/v1/contracts/suggest/scope` (`SuggestScope`); `POST /api/v1/contracts/suggest/terms` (`SuggestTerms`).  
- **OpenAPI:** `openapi.yaml` documents paths and schemas (`SuggestMilestonesRequest` / response, `SuggestScope*`, `SuggestTerms*`, etc.).

**Env:** `GROQ_API_KEY` (required for suggestions), optional `GROQ_MODEL`.

---

**Document Version:** 4.1  
**Last Updated:** March 12, 2026  
**Next Update:** After Phase 4 (submission, review, reputation)

