package notification

import "context"

// AuthNotifier is the interface for sending notifications when auth lifecycle events occur.
type AuthNotifier interface {
	// SendRegistrationOTP emails the 6-digit OTP to the user for email verification.
	SendRegistrationOTP(ctx context.Context, toEmail, otp, fullName string)
}
