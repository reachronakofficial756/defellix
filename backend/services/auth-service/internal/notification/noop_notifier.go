package notification

import "context"

// NoopNotifier does nothing. Use in development or when notification service is not yet integrated.
type NoopNotifier struct{}

// NewNoopNotifier creates a new NoopNotifier.
func NewNoopNotifier() *NoopNotifier {
	return &NoopNotifier{}
}

func (NoopNotifier) SendRegistrationOTP(ctx context.Context, toEmail, otp, fullName string) {}
