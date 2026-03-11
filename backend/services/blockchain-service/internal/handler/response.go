package handler

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

type SuccessResponse struct {
	Data    interface{} `json:"data"`
	Message string      `json:"message,omitempty"`
}

func respondJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

func respondError(w http.ResponseWriter, statusCode int, message string, code string) {
	respondJSON(w, statusCode, ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
		Code:    code,
	})
}

func respondSuccess(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	respondJSON(w, statusCode, SuccessResponse{Data: data, Message: message})
}
