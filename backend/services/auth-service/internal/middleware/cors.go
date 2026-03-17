package middleware

import (
	"net/http"
)

// CORS is a middleware that handles Cross-Origin Resource Sharing
// Relegated to a passthrough because NGINX handles CORS entirely at the API Gateway level.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Handle preflight requests natively offloaded to Nginx
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

