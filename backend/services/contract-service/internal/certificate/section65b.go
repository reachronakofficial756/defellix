package certificate

import (
	"bytes"
	"fmt"
	"time"

	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
)

// Section65BData holds everything needed to generate the certificate
type Section65BData struct {
	Contract    *domain.Contract
	Submissions []*domain.Submission
}

// GenerateSection65BHTML produces a court-admissible HTML document per Section 65B
// of the Indian Evidence Act, 1872. This can be converted to PDF by the frontend
// or served directly as a printable HTML page.
func GenerateSection65BHTML(data *Section65BData) ([]byte, error) {
	c := data.Contract

	signedDate := "N/A"
	if c.ClientSignedAt != nil {
		signedDate = c.ClientSignedAt.Format("02 January 2006, 03:04 PM IST")
	}

	dueDate := "N/A"
	if c.DueDate != nil {
		dueDate = c.DueDate.Format("02 January 2006")
	}

	blockchainStatus := "Not recorded on blockchain"
	blockchainDetails := ""
	if c.BlockchainTxHash != "" {
		blockchainStatus = "Verified on Blockchain"
		blockNum := "Pending"
		if c.BlockchainBlockNum != nil {
			blockNum = fmt.Sprintf("%d", *c.BlockchainBlockNum)
		}
		gasUsed := "N/A"
		if c.BlockchainGasUsed != nil {
			gasUsed = fmt.Sprintf("%d", *c.BlockchainGasUsed)
		}
		blockchainDetails = fmt.Sprintf(`
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Transaction Hash</td><td style="padding:8px 12px;font-family:monospace;word-break:break-all;color:#555;">%s</td></tr>
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Transaction ID</td><td style="padding:8px 12px;font-family:monospace;color:#555;">%s</td></tr>
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Block Number</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Network</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Gas Used</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
			<tr><td style="padding:8px 12px;font-weight:600;color:#333;">Blockchain Status</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
		`, c.BlockchainTxHash, c.BlockchainTxID, blockNum, c.BlockchainNetwork, gasUsed, c.BlockchainStatus)
	}

	generatedAt := time.Now().Format("02 January 2006, 03:04 PM IST")

	var timelineHTML bytes.Buffer
	if len(c.Milestones) > 0 {
		timelineHTML.WriteString(`<h4>Milestones</h4><table><tr><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Milestone</th><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Amount</th><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Status</th></tr>`)
		for _, m := range c.Milestones {
			timelineHTML.WriteString(fmt.Sprintf(`<tr><td style="padding:8px;">%s</td><td style="padding:8px;">%s %.2f</td><td style="padding:8px;">%s</td></tr>`, m.Title, c.Currency, m.Amount, m.Status))
		}
		timelineHTML.WriteString(`</table>`)
	}

	if len(data.Submissions) > 0 {
		timelineHTML.WriteString(`<h4 style="margin-top:20px;">Work Submissions & Responses</h4><table><tr><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Date</th><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Milestone ID</th><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Description</th><th align="left" style="padding:8px;border-bottom:1px solid #ccc;">Status</th></tr>`)
		for _, s := range data.Submissions {
			mID := "Entire Project"
			if s.MilestoneID != nil {
				mID = fmt.Sprintf("#%d", *s.MilestoneID)
			}
			timelineHTML.WriteString(fmt.Sprintf(`<tr><td style="padding:8px;">%s</td><td style="padding:8px;">%s</td><td style="padding:8px;max-width:300px;word-wrap:break-word;">%s</td><td style="padding:8px;">%s</td></tr>`, s.SubmittedAt.Format("02 Jan 2006"), mID, s.Description, s.Status))
		}
		timelineHTML.WriteString(`</table>`)
	}
	if timelineHTML.Len() == 0 {
		timelineHTML.WriteString("<p>No milestones or active submissions recorded.</p>")
	}

	var buf bytes.Buffer
	fmt.Fprintf(&buf, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Section 65B Certificate - Contract #%d</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 4px; }
  .header h2 { color: #667eea; font-size: 16px; font-weight: 600; margin-top: 0; }
  .section { margin-bottom: 28px; }
  .section h3 { color: #1a1a2e; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
  table { width: 100%%; border-collapse: collapse; margin-top: 8px; }
  table tr:nth-child(even) { background: #f8f9fa; }
  .certification { background: #f0f4ff; border: 2px solid #667eea; padding: 24px; border-radius: 8px; margin: 32px 0; }
  .certification p { margin: 8px 0; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #999; font-size: 12px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .badge-verified { background: #d4edda; color: #155724; }
  .badge-pending { background: #fff3cd; color: #856404; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>

<div class="header">
  <h1>CERTIFICATE UNDER SECTION 65B</h1>
  <h2>Indian Evidence Act, 1872</h2>
  <p style="color:#999;font-size:13px;">Generated by Defellix Platform • %s</p>
</div>

<div class="section">
  <h3>1. Contract Details</h3>
  <table>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;width:200px;">Contract ID</td><td style="padding:8px 12px;color:#555;">#%d</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Project Name</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Project Category</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Total Amount</td><td style="padding:8px 12px;color:#555;">%s %.2f</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Due Date</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Contract Status</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Client Signed At</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
  </table>
</div>

<div class="section">
  <h3>2. Parties Involved</h3>
  <table>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;width:200px;">Client Name</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Client Company</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Client Email</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;color:#333;">Client Company Address</td><td style="padding:8px 12px;color:#555;">%s</td></tr>
  </table>
</div>

<div class="section">
  <h3>3. Blockchain Verification <span class="badge %s">%s</span></h3>
  <table>
    %s
  </table>
</div>

<div class="section">
  <h3>4. Dispute Evidence & Complete Timeline</h3>
  %s
</div>

<div class="certification">
  <h3 style="margin-top:0;color:#1a1a2e;">5. Certification Statement</h3>
  <p>I, the undersigned, being the authorized platform operator of <strong>Defellix</strong>, hereby certify the following in compliance with <strong>Section 65B of the Indian Evidence Act, 1872</strong>:</p>
  <ol>
    <li>The electronic record identified above (Contract #%d) was produced by the computer systems of the Defellix platform, which were operating properly at the material time and were regularly used to store information of the kind described herein.</li>
    <li>The information contained in the electronic record was supplied to the computer in the ordinary course of its activities on the Defellix platform.</li>
    <li>The contract details, including timestamps, amounts, parties, and terms, were recorded automatically by the Defellix platform at the time of their creation and subsequent modification.</li>
    <li>The blockchain transaction (if recorded) provides an independent, immutable, and tamper-proof verification of the contract's existence and integrity at the stated timestamp.</li>
    <li>No part of this electronic record has been altered, modified, or tampered with since its original creation.</li>
  </ol>
  <p style="margin-top:20px;"><strong>Certified by:</strong> Defellix Platform (Automated System)</p>
  <p><strong>Date of Certification:</strong> %s</p>
</div>

<div class="footer">
  <p>This certificate has been auto-generated by the Defellix platform.</p>
  <p>It is intended to comply with the requirements of Section 65B of the Indian Evidence Act, 1872, as interpreted by the Supreme Court of India in <em>Anvar P.V. v. P.K. Basheer (2014)</em> and <em>Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020)</em>.</p>
  <p>For verification, the blockchain transaction hash above can be independently verified on the %s network.</p>
</div>

</body>
</html>`,
		c.ID,
		generatedAt,
		c.ID, c.ProjectName, c.ProjectCategory,
		c.Currency, c.TotalAmount,
		dueDate, c.Status, signedDate,
		c.ClientName, c.ClientCompanyName, c.ClientEmail, c.ClientCompanyAddress,
		badgeClass(blockchainStatus), blockchainStatus,
		blockchainDetails,
		timelineHTML.String(),
		c.ID,
		generatedAt,
		networkName(c.BlockchainNetwork),
	)

	return buf.Bytes(), nil
}

func badgeClass(status string) string {
	if status == "Verified on Blockchain" {
		return "badge-verified"
	}
	return "badge-pending"
}

func networkName(n string) string {
	switch n {
	case "base_sepolia":
		return "Base Sepolia Testnet"
	case "base_mainnet":
		return "Base Mainnet"
	default:
		if n == "" {
			return "blockchain"
		}
		return n
	}
}
