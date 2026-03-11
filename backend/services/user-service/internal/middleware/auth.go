package middleware

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// RequireAuth is a middleware that requires authentication
// This is a placeholder - in production, validate JWT token from auth-service
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Check if NGINX API Gateway already verified auth and injected user details
		if xUid := r.Header.Get("X-User-Id"); xUid != "" {
			if uid, err := strconv.ParseUint(xUid, 10, 32); err == nil {
				ctx := context.WithValue(r.Context(), "user_id", uint(uid))
				ctx = context.WithValue(ctx, "user_email", r.Header.Get("X-User-Email"))
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		// 2. Fallback: Extract token from Authorization header (used in local dev)
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, http.StatusUnauthorized, "Authorization header required", "UNAUTHORIZED")
			return
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondError(w, http.StatusUnauthorized, "Invalid authorization header format", "UNAUTHORIZED")
			return
		}

		// Extract user_id from JWT payload
		tokenString := parts[1]
		tokenParts := strings.Split(tokenString, ".")
		if len(tokenParts) != 3 {
			respondError(w, http.StatusUnauthorized, "Invalid token structure", "UNAUTHORIZED")
			return
		}

		payload, err := base64.RawURLEncoding.DecodeString(tokenParts[1])
		if err != nil {
			respondError(w, http.StatusUnauthorized, "Invalid token payload", "UNAUTHORIZED")
			return
		}

		var claims struct {
			UserID float64 `json:"user_id"`
			Email  string  `json:"email"`
		}
		if err := json.Unmarshal(payload, &claims); err != nil {
			respondError(w, http.StatusUnauthorized, "Invalid token claims", "UNAUTHORIZED")
			return
		}

		if claims.UserID == 0 {
			respondError(w, http.StatusUnauthorized, "Invalid user ID in token", "UNAUTHORIZED")
			return
		}

		userID := uint(claims.UserID)
		userEmail := claims.Email

		// Add user info to context
		ctx := context.WithValue(r.Context(), "user_id", userID)
		ctx = context.WithValue(ctx, "user_email", userEmail)

		// Continue with authenticated request
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// respondError is a helper to send error responses
func respondError(w http.ResponseWriter, statusCode int, message string, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	type ErrorResponse struct {
		Error   string `json:"error"`
		Message string `json:"message"`
		Code    string `json:"code"`
	}

	response := ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
		Code:    code,
	}

	json.NewEncoder(w).Encode(response)
}

