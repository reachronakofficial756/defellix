# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy the go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
# CGO_ENABLED=0 creates a statically linked binary (better for Alpine/scratch)
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# Production stage
FROM alpine:latest

WORKDIR /app

# Add ca-certificates for standard HTTPS requests (like OAuth)
RUN apk --no-cache add ca-certificates tzdata

# Copy the binary from the builder stage
COPY --from=builder /app/main .
COPY --from=builder /app/.env .

# Expose the port the service runs on (from .env or config, default 8081)
EXPOSE 8081

# Command to run the executable
CMD ["./main"]
