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

// NotifyContractSent sends a professional HTML email to the client with the contract review link.
func (n *SMTPNotifier) NotifyContractSent(ctx context.Context, contractID uint, clientEmail, shareableLink string) {
	subject := fmt.Sprintf("📄 You've Received a New Contract to Review — Contract #%d", contractID)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Contract</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 8px;">You have a new contract to review</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              A freelancer has sent you a <strong>digital service contract</strong> for your review and signature on <strong>Defellix</strong>.
              Please review all terms carefully before signing.
            </p>
            <!-- Info Box -->
            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fdf9;border:1px solid #d4edda;border-radius:12px;margin:0 0 32px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 8px;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Contract Reference</p>
                <p style="margin:0;color:#0d1a10;font-size:22px;font-weight:900;letter-spacing:-0.5px;">#DEF-%04d</p>
              </td></tr>
            </table>
            <!-- CTA Button -->
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="%s" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#3cb44f,#2d8a3e);color:#ffffff;text-decoration:none;border-radius:100px;font-size:16px;font-weight:800;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(60,180,79,0.35);">
                  Review &amp; Sign Contract →
                </a>
              </td></tr>
            </table>
            <!-- Steps -->
            <table width="100%%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="width:40px;height:40px;background:#e8f5e9;border-radius:50%%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:18px;">👁️</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;text-transform:uppercase;letter-spacing:0.05em;">1. Review</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#888;">Read all terms carefully</p>
                </td>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="width:40px;height:40px;background:#e8f5e9;border-radius:50%%;margin:0 auto 12px;font-size:18px;line-height:40px;">💬</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;text-transform:uppercase;letter-spacing:0.05em;">2. Negotiate</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#888;">Request changes if needed</p>
                </td>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="width:40px;height:40px;background:#e8f5e9;border-radius:50%%;margin:0 auto 12px;font-size:18px;line-height:40px;">✅</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;text-transform:uppercase;letter-spacing:0.05em;">3. Sign</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#888;">Sign with OTP verification</p>
                </td>
              </tr>
            </table>
            <!-- Link copy -->
            <p style="color:#999;font-size:12px;text-align:center;margin:0 0 4px;">Or copy this link:</p>
            <p style="color:#3cb44f;font-size:12px;text-align:center;word-break:break-all;margin:0;"><a href="%s" style="color:#3cb44f;">%s</a></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fdf9;border-top:1px solid #e8f0ea;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 4px;color:#aaa;font-size:12px;">🔒 Secured by <strong style="color:#0d1a10;">Defellix Protocol</strong> · Digital signatures are legally binding</p>
            <p style="margin:0;color:#ccc;font-size:11px;">If you didn't expect this email, you can safely ignore it. This link will expire once the contract is signed.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, contractID, shareableLink, shareableLink, shareableLink)

	go n.sendEmail(clientEmail, subject, html)
}

func (n *SMTPNotifier) NotifyWorkSubmitted(ctx context.Context, contractID uint, clientEmail, projectName, reviewLink string) {
	subject := fmt.Sprintf("🟢 Milestone Submitted for Review — Contract #%d", contractID)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Milestone Submitted</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 8px;">Work Submitted for Review</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              The freelancer has submitted work for a milestone on your project <strong>%s</strong>.
              Please review the submission and either approve it to release funds or request revisions.
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="%s" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#3cb44f,#2d8a3e);color:#ffffff;text-decoration:none;border-radius:100px;font-size:16px;font-weight:800;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(60,180,79,0.35);">
                  Review Submission →
                </a>
              </td></tr>
            </table>
            <p style="color:#999;font-size:12px;text-align:center;margin:0 0 4px;">Or copy this link:</p>
            <p style="color:#3cb44f;font-size:12px;text-align:center;word-break:break-all;margin:0;"><a href="%s" style="color:#3cb44f;">%s</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, projectName, reviewLink, reviewLink, reviewLink)

	go n.sendEmail(clientEmail, subject, html)
}

func (n *SMTPNotifier) NotifyRevisionRequested(ctx context.Context, contractID uint, freelancerEmail, projectName, comment string) {
	subject := fmt.Sprintf("⚠️ Revision Requested — %s", projectName)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Revision Requested</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:40px 48px;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 8px;">Revision Requested</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              Your client has requested revisions on project <strong>%s</strong>. Please review their feedback and update your submission accordingly.
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:12px;margin:0 0 32px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 8px;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Client Feedback</p>
                <p style="margin:0;color:#0d1a10;font-size:14px;line-height:1.6;font-style:italic;">"%s"</p>
              </td></tr>
            </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, projectName, comment)

	go n.sendEmail(freelancerEmail, subject, html)
}

func (n *SMTPNotifier) NotifyWorkAccepted(ctx context.Context, contractID uint, freelancerEmail, projectName string, rating int) {
	subject := fmt.Sprintf("✅ Milestone Approved — %s", projectName)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Work Accepted</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:40px 48px;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 8px;">🎉 Milestone Approved!</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              Great news! Your milestone for <strong>%s</strong> has been approved by the client with a <strong>%d-star</strong> rating.
            </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, projectName, rating)

	go n.sendEmail(freelancerEmail, subject, html)
}

func (n *SMTPNotifier) NotifyContractCompleted(ctx context.Context, contractID uint, clientEmail, projectName, reviewLink string) {
	subject := fmt.Sprintf("🎊 Project Completed — Please Review %s", projectName)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Project Completed</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:40px 48px;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 16px;">Project Successfully Completed! 🎉</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              All milestones for <strong>%s</strong> have been approved. The contract is now marked as <strong>completed</strong>.
            </p>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 32px;">
              We'd love to hear about your experience! Please take a moment to rate the freelancer and leave a testimonial. Your feedback helps build trust on the platform.
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="%s" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#3cb44f,#2d8a3e);color:#ffffff;text-decoration:none;border-radius:100px;font-size:16px;font-weight:800;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(60,180,79,0.35);">
                  Leave a Review & Testimonial →
                </a>
              </td></tr>
            </table>
            <table width="100%%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="font-size:28px;margin-bottom:8px;">⭐</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;">Rate Quality</p>
                </td>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="font-size:28px;margin-bottom:8px;">💬</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;">Write Review</p>
                </td>
                <td width="33%%" style="padding:16px;text-align:center;vertical-align:top;">
                  <div style="font-size:28px;margin-bottom:8px;">🏆</div>
                  <p style="margin:0;font-size:12px;font-weight:700;color:#0d1a10;">Give Testimonial</p>
                </td>
              </tr>
            </table>
            <p style="color:#999;font-size:12px;text-align:center;margin:0 0 4px;">Or copy this link:</p>
            <p style="color:#3cb44f;font-size:12px;text-align:center;word-break:break-all;margin:0;"><a href="%s" style="color:#3cb44f;">%s</a></p>
        </td></tr>
        <tr><td style="background:#f8fdf9;border-top:1px solid #e8f0ea;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 4px;color:#aaa;font-size:12px;">🔒 Secured by <strong style="color:#0d1a10;">Defellix Protocol</strong></p>
            <p style="margin:0;color:#ccc;font-size:11px;">Your review helps the freelancer build their credibility score and build trust in the ecosystem.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, projectName, reviewLink, reviewLink, reviewLink)

	go n.sendEmail(clientEmail, subject, html)
}

func (n *SMTPNotifier) NotifyReviewReceived(ctx context.Context, contractID uint, freelancerEmail, projectName string, rating int) {
	subject := fmt.Sprintf("⭐ New Review Received — %s (%d/5)", projectName, rating)
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Review Received</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0d1a10 0%%,#1e3824 100%%);padding:36px 48px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;">defellix</div>
            <div style="width:40px;height:2px;background:#3cb44f;margin:12px auto 0;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:40px 48px;text-align:center;">
            <h1 style="color:#0d1a10;font-size:24px;font-weight:800;margin:0 0 16px;">You received a new review! ⭐</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              Your client left a <strong>%d-star</strong> review for project <strong>%s</strong>. This review contributes to your credibility score on Defellix.
            </p>
            <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 8px;">Log in to your dashboard to see the full review and how it impacts your score.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, rating, projectName)

	go n.sendEmail(freelancerEmail, subject, html)
}

// SendSigningOTP emails the 6-digit OTP to the client for identity verification before contract sign.
func (n *SMTPNotifier) SendSigningOTP(ctx context.Context, clientEmail, otp, projectName string) {
	subject := fmt.Sprintf("Verify your signature for \"%s\"", projectName)
	html := fmt.Sprintf(`
		<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px; text-align: center;">
			<h2 style="color: #1a1a2e; margin-bottom: 8px;">🔐 Contract Signature Verification</h2>
			<p style="color: #555; font-size: 16px; line-height: 1.6;">
				You are attempting to sign the contract for <strong>%s</strong> on Defellix.
				To confirm your identity and legally bind the signature to this email address, please use the following OTP.
			</p>
			<div style="background: white; border: 2px dashed #667eea; padding: 24px; margin: 24px 0; border-radius: 8px;">
				<h1 style="color: #667eea; margin: 0; font-size: 40px; letter-spacing: 4px;">%s</h1>
			</div>
			<p style="color: #555; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
			<p style="color: #999; font-size: 12px; margin-top: 32px;">
				If you did not initiate this request, someone may have entered your email by mistake. You can safely ignore this.
			</p>
		</div>
	`, projectName, otp)

	go n.sendEmail(clientEmail, subject, html)
}
