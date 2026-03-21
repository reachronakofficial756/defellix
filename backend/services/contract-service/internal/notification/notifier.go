package notification

import "context"

// ContractNotifier is the interface for sending notifications when contract lifecycle events occur.
// Implementations can be no-op (dev), log-only, or call a notification service (e.g. email via Resend).
type ContractNotifier interface {
	// NotifyContractSent is called when a contract is sent to the client.
	NotifyContractSent(ctx context.Context, contractID uint, clientEmail, shareableLink string)

	// NotifyWorkSubmitted is called when a freelancer submits work for a signed contract.
	NotifyWorkSubmitted(ctx context.Context, contractID uint, clientEmail, projectName, reviewLink string)

	// NotifyRevisionRequested is called when a client requests a revision on a submission.
	NotifyRevisionRequested(ctx context.Context, contractID uint, freelancerEmail, projectName, comment string)

	// NotifyWorkAccepted is called when a client accepts the submitted work.
	NotifyWorkAccepted(ctx context.Context, contractID uint, freelancerEmail, projectName string, rating int)

	// NotifyContractCompleted is called when all milestones are approved and contract is marked completed.
	NotifyContractCompleted(ctx context.Context, contractID uint, clientEmail, projectName, reviewLink string)

	// NotifyReviewReceived is called when a client submits a review/testimonial for a completed contract.
	NotifyReviewReceived(ctx context.Context, contractID uint, freelancerEmail, projectName string, rating int)

	// SendSigningOTP emails the 6-digit OTP to the client for identity verification before contract sign.
	SendSigningOTP(ctx context.Context, clientEmail, otp, projectName string)
}

// NoopNotifier does nothing. Use in development or when notification service is not yet integrated.
type NoopNotifier struct{}

func (NoopNotifier) NotifyContractSent(context.Context, uint, string, string)              {}
func (NoopNotifier) NotifyWorkSubmitted(context.Context, uint, string, string, string)     {}
func (NoopNotifier) NotifyRevisionRequested(context.Context, uint, string, string, string) {}
func (NoopNotifier) NotifyWorkAccepted(context.Context, uint, string, string, int)         {}
func (NoopNotifier) NotifyContractCompleted(context.Context, uint, string, string, string) {}
func (NoopNotifier) NotifyReviewReceived(context.Context, uint, string, string, int)       {}
func (NoopNotifier) SendSigningOTP(context.Context, string, string, string)                {}
