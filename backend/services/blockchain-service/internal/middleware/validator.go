package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Validator struct {
	validate *validator.Validate
}

func NewValidator() *Validator {
	return &Validator{validate: validator.New()}
}

func (v *Validator) ValidateJSON(r *http.Request, dst interface{}) error {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	if err := v.validate.Struct(dst); err != nil {
		if ves, ok := err.(validator.ValidationErrors); ok {
			var msg []string
			for _, e := range ves {
				msg = append(msg, fmt.Sprintf("%s: %s", e.Field(), e.Tag()))
			}
			return fmt.Errorf("%s", strings.Join(msg, "; "))
		}
		return err
	}
	return nil
}
