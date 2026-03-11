package middleware

import (
	"encoding/json"
	"log"
	"net/http"
)

func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error":   "Internal Server Error",
					"message": "An unexpected error occurred",
					"code":    "INTERNAL_ERROR",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
