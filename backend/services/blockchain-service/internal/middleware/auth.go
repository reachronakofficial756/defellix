package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func RequireAuth(jwtSecret, serviceAPIKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check for service API key first (for service-to-service calls)
			if serviceAPIKey != "" {
				apiKey := r.Header.Get("X-API-Key")
				if apiKey == serviceAPIKey {
					// Service-to-service call authenticated
					ctx := context.WithValue(r.Context(), "user_id", uint(0)) // System/service call
					ctx = context.WithValue(ctx, "user_email", "service@internal")
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			// Otherwise, require JWT
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
