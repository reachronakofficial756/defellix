package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const resendAPIEndpoint = "https://api.resend.com/emails"

// ResendNotifier sends real emails using the Resend API (https://resend.com).
// Free tier: 3,000 emails/month, no credit card required.
type ResendNotifier struct {
	apiKey    string
	fromEmail string // e.g. "Defellix <noreply@defellix.devitup.in>"
	client    *http.Client
}

// NewResendNotifier creates a new Resend email notifier.
func NewResendNotifier(apiKey, fromEmail string) *ResendNotifier {
	return &ResendNotifier{
		apiKey:    apiKey,
		fromEmail: fromEmail,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func (n *ResendNotifier) send(ctx context.Context, to, subject, html string) {
	payload := resendPayload{
		From:    n.fromEmail,
		To:      []string{to},
		Subject: subject,
		HTML:    html,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[resend] marshal error: %v", err)
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resendAPIEndpoint, bytes.NewReader(body))
	if err != nil {
		log.Printf("[resend] request error: %v", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+n.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := n.client.Do(req)
	if err != nil {
		log.Printf("[resend] send error to %s: %v", to, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("[resend] API returned %d for email to %s (subject: %s)", resp.StatusCode, to, subject)
	} else {
		log.Printf("[resend] email sent to %s (subject: %s)", to, subject)
	}
}

// NotifyContractSent sends an email to the client when a contract is shared.
func (n *ResendNotifier) NotifyContractSent(ctx context.Context, contractID uint, clientEmail, shareableLink string) {
	subject := "You have a new contract to review on Defellix"
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">📄 New Contract for You</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				A freelancer has sent you a contract to review on <strong>Defellix</strong>.
			</p>
			<p style="color: #555; font-size: 14px;">Contract ID: <strong>#%d</strong></p>
			<div style="margin: 24px 0;">
				<a href="%s" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
					Review Contract →
				</a>
			</div>
			<p style="color: #999; font-size: 12px;">
				If you didn't expect this email, you can safely ignore it.
			</p>
		</div>
	`, contractID, shareableLink)

	go n.send(ctx, clientEmail, subject, html)
}

// NotifyWorkSubmitted sends an email to the client when a freelancer submits work.
func (n *ResendNotifier) NotifyWorkSubmitted(ctx context.Context, contractID uint, clientEmail, projectName, reviewLink string) {
	subject := fmt.Sprintf("Work submitted for \"%s\" on Defellix", projectName)
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">🎉 Work Has Been Submitted</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				The freelancer has submitted their deliverables for <strong>%s</strong>.
			</p>
			<p style="color: #555; font-size: 14px;">Please review the submission and either accept it or request a revision.</p>
			<div style="margin: 24px 0;">
				<a href="%s" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #00b09b, #96c93d); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
					Review Submission →
				</a>
			</div>
			<p style="color: #999; font-size: 12px;">Contract #%d</p>
		</div>
	`, projectName, reviewLink, contractID)

	go n.send(ctx, clientEmail, subject, html)
}

// NotifyRevisionRequested sends an email to the freelancer when a client asks for changes.
func (n *ResendNotifier) NotifyRevisionRequested(ctx context.Context, contractID uint, freelancerEmail, projectName, comment string) {
	subject := fmt.Sprintf("Revision requested for \"%s\"", projectName)
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">🔄 Revision Requested</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				Your client has reviewed your submission for <strong>%s</strong> and has requested a revision.
			</p>
			<div style="background: white; border-left: 4px solid #667eea; padding: 16px; margin: 16px 0; border-radius: 4px;">
				<p style="color: #333; font-size: 14px; margin: 0;"><strong>Client's Comment:</strong></p>
				<p style="color: #555; font-size: 14px; margin: 8px 0 0 0;">%s</p>
			</div>
			<p style="color: #555; font-size: 14px;">Please make the requested changes and resubmit your work.</p>
			<p style="color: #999; font-size: 12px;">Contract #%d</p>
		</div>
	`, projectName, comment, contractID)

	go n.send(ctx, freelancerEmail, subject, html)
}

// NotifyWorkAccepted sends an email to the freelancer when their work is accepted.
func (n *ResendNotifier) NotifyWorkAccepted(ctx context.Context, contractID uint, freelancerEmail, projectName string, rating int) {
	stars := ""
	for i := 0; i < rating; i++ {
		stars += "⭐"
	}
	subject := fmt.Sprintf("Your work on \"%s\" has been accepted!", projectName)
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">✅ Work Accepted!</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				Congratulations! Your client has accepted your work for <strong>%s</strong>.
			</p>
			<div style="background: white; padding: 16px; margin: 16px 0; border-radius: 8px; text-align: center;">
				<p style="font-size: 32px; margin: 0;">%s</p>
				<p style="color: #555; font-size: 14px; margin: 8px 0 0 0;">Client Rating: %d/5</p>
			</div>
			<p style="color: #555; font-size: 14px;">
				Your Reputation Points have been updated. This contract is now visible on your public profile!
			</p>
			<p style="color: #999; font-size: 12px;">Contract #%d</p>
		</div>
	`, projectName, stars, rating, contractID)

	go n.send(ctx, freelancerEmail, subject, html)
}

// SendSigningOTP emails the 6-digit OTP to the client.
func (n *ResendNotifier) SendSigningOTP(ctx context.Context, clientEmail, otp, projectName string) {
	// Not implemented for Resend yet; use SMTPNotifier for OTPs.
}
