package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// claims match auth-service JWT
type claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// RequireAuth returns middleware that validates JWT and sets user_id, user_email in context.
// If jwtSecret is empty, any Bearer token is accepted and user_id=1, user_email=placeholder (dev-only).
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
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

			// 2. Fallback to manual JWT verification (e.g., local development without NGINX)
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondAuthError(w, "Authorization header required")
				return
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				respondAuthError(w, "Invalid authorization format")
				return
			}
			tokenString := parts[1]

			if jwtSecret == "" {
				// Dev placeholder: accept any token and use default user (match user-service behaviour)
				ctx := context.WithValue(r.Context(), "user_id", uint(1))
				ctx = context.WithValue(ctx, "user_email", "dev@local")
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			token, err := jwt.ParseWithClaims(tokenString, &claims{}, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				respondAuthError(w, "Invalid or expired token")
				return
			}
			c, ok := token.Claims.(*claims)
			if !ok {
				respondAuthError(w, "Invalid token claims")
				return
			}
			ctx := context.WithValue(r.Context(), "user_id", c.UserID)
			ctx = context.WithValue(ctx, "user_email", c.Email)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func respondAuthError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error":   "Unauthorized",
		"message": message,
		"code":    "UNAUTHORIZED",
	})
}
