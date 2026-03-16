package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/saiyam0211/defellix/services/auth-service/pkg/jwt"
)

// RequireAuth is a middleware that requires authentication via JWT token
func RequireAuth(jwtManager *jwt.JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header or Cookie
			var tokenString string
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				}
			}

			// Fallback to HttpOnly cookie
			if tokenString == "" {
				cookie, err := r.Cookie("access_token")
				if err == nil && cookie.Value != "" {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				respondError(w, http.StatusUnauthorized, "Authorization token required", "UNAUTHORIZED")
				return
			}

			// Validate token
			claims, err := jwtManager.ValidateToken(tokenString)
			if err != nil {
				if err == jwt.ErrExpiredToken {
					respondError(w, http.StatusUnauthorized, "Token has expired", "TOKEN_EXPIRED")
					return
				}
				respondError(w, http.StatusUnauthorized, "Invalid token", "INVALID_TOKEN")
				return
			}

			// Add user info to context
			ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
			ctx = context.WithValue(ctx, "user_email", claims.Email)
			ctx = context.WithValue(ctx, "user_role", claims.Role)

			// Continue with authenticated request
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// respondError is a helper to send error responses (duplicated here to avoid circular import)
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

