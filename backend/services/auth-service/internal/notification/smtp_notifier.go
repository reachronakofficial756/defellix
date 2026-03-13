package notification

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
)

// SMTPNotifier sends real emails using Google SMTP.
type SMTPNotifier struct {
	host     string
	port     string
	user     string
	pass     string
	fromName string
}

// NewSMTPNotifier creates a new Google SMTP email notifier.
func NewSMTPNotifier(host, port, user, pass, fromName string) *SMTPNotifier {
	return &SMTPNotifier{
		host:     host,
		port:     port,
		user:     user,
		pass:     pass,
		fromName: fromName,
	}
}

func (n *SMTPNotifier) sendEmail(to, subject, htmlBody string) {
	auth := smtp.PlainAuth("", n.user, n.pass, n.host)

	msg := []byte("To: " + to + "\r\n" +
		"From: " + n.fromName + " <" + n.user + ">\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		htmlBody + "\r\n")

	addr := fmt.Sprintf("%s:%s", n.host, n.port)
	err := smtp.SendMail(addr, auth, n.user, []string{to}, msg)
	if err != nil {
		log.Printf("[smtp] failed to send email to %s: %v", to, err)
	} else {
		log.Printf("[smtp] email sent successfully to %s", to)
	}
}

// SendRegistrationOTP emails the 6-digit OTP to the user for email verification.
func (n *SMTPNotifier) SendRegistrationOTP(ctx context.Context, toEmail, otp, fullName string) {
	subject := "Verify your Defellix Account"
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px; text-align: center;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">🔐 Account Verification</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				Welcome to Defellix, <strong>%s</strong>!
				To complete your registration and secure your identity on the platform, please use the following OTP.
			</p>
			<div style="background: white; border: 2px dashed #667eea; padding: 24px; margin: 24px 0; border-radius: 8px;">
				<h1 style="color: #667eea; margin: 0; font-size: 40px; letter-spacing: 4px;">%s</h1>
			</div>
			<p style="color: #555; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
			<p style="color: #999; font-size: 12px; margin-top: 32px;">
				If you did not register for Defellix, please ignore this email.
			</p>
		</div>
	`, fullName, otp)

	go n.sendEmail(toEmail, subject, html)
}
