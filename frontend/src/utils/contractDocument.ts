/**
 * Shared freelance service agreement text (Indian MoU / service contract style)
 * and PDF export — used by CreateContractForm and ClientContractReview.
 */

import { jsPDF } from "jspdf";

export type MilestoneDoc = {
    title: string;
    description: string;
    amount: number;
    due_date: string;
    is_initial_payment?: boolean;
    submission_criteria?: string;
};

export type ContractDocumentInput = {
    projectTitle: string;
    projectCategory: string;
    projectDesc: string;
    coreDeliverable: string;
    outOfScope: string;
    startDate: string;
    deadline: string;
    duration: string;
    contractCurrency: string;
    totalAmount: number;
    milestones: MilestoneDoc[];
    paymentMethod: string;
    revisionPolicy: string;
    intellectualProperty: string;
    customTerms: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
    clientPhone: string;
    clientCountry?: string;
    freelancerName?: string;
    /** For reference line on document */
    contractId?: number | null;
};

function formatINDate(d: Date = new Date()): string {
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function safe(s: string | undefined | null, fallback: string): string {
    const t = (s ?? "").trim();
    return t || fallback;
}

/**
 * Markdown for on-screen preview (CreateContractForm step 5).
 */
export function buildContractMarkdown(input: ContractDocumentInput): string {
    const {
        projectTitle,
        projectCategory,
        projectDesc,
        coreDeliverable,
        outOfScope,
        startDate,
        deadline,
        duration,
        contractCurrency,
        totalAmount,
        milestones,
        paymentMethod,
        revisionPolicy,
        intellectualProperty,
        customTerms,
        clientName,
        clientCompany,
        clientEmail,
        clientPhone,
        clientCountry,
        freelancerName,
        contractId,
    } = input;

    const ref =
        contractId != null && contractId > 0
            ? `DFX-CTR-${contractId}`
            : `DFX-DRAFT-${Date.now().toString(36).toUpperCase()}`;
    const today = formatINDate();
    const place = safe(clientCountry, "India");
    const flName = safe(freelancerName, "Defellix Verified Service Provider");

    const milestoneBlock =
        milestones.length === 0
            ? "\n(Payment schedule to be recorded in writing or platform milestones.)\n"
            : milestones
                  .map((ms, i) => {
                      const init = ms.is_initial_payment ? " **(Initial / advance portion)**" : "";
                      const due =
                          fmtDateLabel(ms.due_date) ||
                          safe(ms.due_date, "As per mutual coordination");
                      return `
**3.2.${i + 1} Milestone ${i + 1} — ${safe(ms.title, "Untitled")}**${init}
- **Deliverables:** ${safe(ms.description, "As described in the scope above.")}
- **Due date:** ${due}
- **Amount:** ${contractCurrency} ${(ms.amount || 0).toLocaleString("en-IN")}
- **Mode of submission:** ${safe(ms.submission_criteria, "Electronic / link-based delivery")}
`;
                  })
                  .join("\n");

    const annexureTable =
        milestones.length === 0
            ? "| Sr. No. | Milestone | Due Date | Amount | Submission Criteria |\n| :--- | :--- | :--- | :--- | :--- |\n| 1 | To be mutually defined in writing | TBD | TBD | As agreed |\n"
            : [
                  "| Sr. No. | Milestone | Due Date | Amount | Submission Criteria |",
                  "| :--- | :--- | :--- | :--- | :--- |",
                  ...milestones.map((ms, i) => {
                      const due = fmtDateLabel(ms.due_date) || safe(ms.due_date, "TBD");
                      const amt = `${contractCurrency} ${(ms.amount || 0).toLocaleString("en-IN")}`;
                      return `| ${i + 1} | ${safe(ms.title, "Untitled")} | ${due} | ${amt} | ${safe(ms.submission_criteria, "Electronic / link-based delivery")} |`;
                  }),
              ].join("\n");

    return `
---

## SERVICE AGREEMENT & MEMORANDUM OF UNDERSTANDING

Professional freelance services — **Indian Contract Act, 1872**; electronic records under the **Information Technology Act, 2000**, where applicable.

---

**Reference:** ${ref}  
**Date:** ${today}  
**Place:** ${place}

---

## BETWEEN

**FIRST PARTY — Service Provider / Freelancer** ("First Party")  
**Name / Style:** ${flName}  
(Engaged through the Defellix trust and contracting platform)

**AND**

**SECOND PARTY — Client** ("Second Party")  
**Name:** ${safe(clientName, "[Client name]")}  
**Organisation:** ${safe(clientCompany, "—")}  
**Email:** ${safe(clientEmail, "[Email]")}  
**Phone:** ${safe(clientPhone, "—")}

(The First Party and Second Party are together the **Parties** and each a **Party**.)

---

## RECITALS

**WHEREAS** the First Party is willing to provide professional services in the nature of **${safe(projectCategory, "professional services")}**;

**WHEREAS** the Second Party desires to procure such services for the project titled **"${safe(projectTitle, "Project")}"**;

**WHEREAS** the Parties wish to record the commercial and legal terms on a without-prejudice basis and avoid dispute as to scope, consideration, and timelines;

**NOW, THEREFORE**, in consideration of the mutual covenants and for other good and valuable consideration (receipt and sufficiency whereof is acknowledged), the Parties agree as follows:

---

## 1. PROJECT AND SCOPE OF SERVICES

1.1 The First Party shall render services broadly described as: **${safe(projectCategory, "As agreed")}**.

1.2 **Project overview:**  
${safe(projectDesc, "As may be further described in annexures or written instructions agreed between the Parties.")}

1.3 **Primary deliverables (core handover):**  
${safe(coreDeliverable, "As specified in writing between the Parties.")}

1.4 **Explicit exclusions / out of scope:**  
${safe(outOfScope, "Any matter not expressly stated in this Agreement or a written change request approved by both Parties shall be out of scope.")}

---

## 2. TERM, COMMENCEMENT AND COMPLETION

2.1 **Commencement:** ${safe(startDate, "As agreed")}  
2.2 **Target completion / deadline:** ${safe(deadline, "As agreed")}  
2.3 **Estimated duration:** ${safe(duration, "As per milestones and written coordination")}

---

## 3. CONSIDERATION AND MILESTONES

3.1 The total contract value is **${contractCurrency} ${totalAmount.toLocaleString("en-IN")}** (unless revised in writing).

3.2 Payment shall be released against the following milestones (unless otherwise agreed in writing):

${milestoneBlock}

3.3 **Payment channel / method:** ${safe(paymentMethod, "As agreed between the Parties")}.

3.4 Taxes, statutory deductions, foreign exchange charges, and bank fees (if any) shall be borne as per applicable law and mutual understanding, unless expressly stated otherwise.

---

## 4. REVISIONS

4.1 **Revision policy:** ${safe(revisionPolicy, "Reasonable rounds as agreed")}. Work beyond the agreed revision rounds may be treated as a change request and may attract additional time and fees.

---

## 5. INTELLECTUAL PROPERTY

5.1 **Ownership / licence:** ${safe(intellectualProperty, "As per industry practice and further correspondence.")}

5.2 The First Party may retain the non-exclusive right to display anonymised or portfolio excerpts of the work, subject to confidentiality and the Second Party’s reasonable written objections.

---

## 6. CONFIDENTIALITY AND CONDUCT

6.1 Each Party shall keep confidential all non-public business and technical information received from the other, except as required by law or with prior written consent.

6.2 The Parties shall act in good faith, respond within reasonable time on project communications, and use the Defellix platform record (including timestamps and status) as a primary reference for delivery and acceptance where available.

---

## 7. LIMITATION AND DISCLAIMERS

7.1 This document is a **commercial services agreement** generated for operational clarity. It is **not a substitute for independent legal advice**. The Parties may seek counsel on tax, employment, export control, or sector-specific compliance.

7.2 Except for liability that cannot be limited under applicable law, neither Party’s aggregate liability under this Agreement shall exceed the fees actually paid by the Second Party to the First Party under this project (unless a higher amount is mandated by statute).

---

## 8. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION

8.1 This Agreement shall be governed by the **laws of India**.

8.2 Subject to mandatory provisions of law, the Parties submit to the **exclusive jurisdiction of the courts at Bengaluru, Karnataka, India** for any dispute arising out of this Agreement. The Parties may first attempt amicable resolution and, if they so agree in writing later, mediation or arbitration in India.

---

## 9. ELECTRONIC EXECUTION AND PLATFORM RECORD

9.1 The Parties acknowledge that this Agreement may be **accepted and authenticated through secure electronic means** on the Defellix platform (including verification by one-time password or other methods made available). Such electronic acceptance is intended to be valid under the **Information Technology Act, 2000**, to the extent applicable.

9.2 **No physical signature block is required** on a paper counterpart for the electronically executed version to record the Parties’ consent; the platform audit trail (timestamps, OTP confirmation, and contract state) shall constitute supporting evidence of execution alongside this document.

9.3 By proceeding on the platform, the Parties confirm they have read, understood, and agree to be bound by the terms above and any **additional terms** set out below.

---

## 10. ADDITIONAL TERMS AND CONDITIONS

${safe(customTerms, "Standard professional conduct, non-solicitation (where reasonable), and mutual indemnity for breach of confidentiality apply. Further clauses may be added by mutual written agreement.")}

---

**IN WITNESS WHEREOF**, the Parties adopt this Agreement through the electronic process described in Clause 9.

---

## ANNEXURE A — MILESTONE PAYMENT SCHEDULE

${annexureTable}

**— End of Agreement —**
`.trim();
}

const MM_PER_LINE = 5.2;

function fmtDateLabel(s?: string | null): string {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Download only the agreement as a multi-page A4 PDF (not the full browser page).
 */
export function downloadContractPdf(input: ContractDocumentInput, fileBaseName?: string): void {
    const md = buildContractMarkdown(input).replace(/\r/g, "").trim();
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 20;
    const marginR = 20;
    const marginTop = 22;
    const marginBottom = 18;
    const maxW = pageW - marginL - marginR;
    const pageBodyTop = marginTop + 6;
    const pageBodyBottom = pageH - marginBottom - 8;
    let y = pageBodyTop;

    const ref =
        input.contractId != null && input.contractId > 0
            ? `DFX-CTR-${input.contractId}`
            : "DFX-DRAFT";
    const generatedAt = formatINDate();

    const renderPageHeader = () => {
        doc.setTextColor(90, 90, 90);
        doc.setFont("times", "bold");
        doc.setFontSize(8.5);
        doc.text("SERVICE AGREEMENT / MOU", marginL, marginTop - 6);
        doc.setFont("times", "normal");
        doc.text(`Ref: ${ref}`, pageW - marginR, marginTop - 6, { align: "right" });
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        doc.line(marginL, marginTop - 3, pageW - marginR, marginTop - 3);
        doc.setTextColor(20, 20, 20);
    };

    const renderPageFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(170, 170, 170);
        doc.setLineWidth(0.15);
        doc.line(marginL, pageH - marginBottom + 2, pageW - marginR, pageH - marginBottom + 2);
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(`Generated on ${generatedAt}`, marginL, pageH - marginBottom + 6);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageW - marginR, pageH - marginBottom + 6, {
            align: "right",
        });
        doc.setTextColor(20, 20, 20);
    };

    const newPageIfNeeded = (needed: number) => {
        if (y + needed > pageBodyBottom) {
            doc.addPage();
            renderPageHeader();
            y = pageBodyTop;
        }
    };

    renderPageHeader();
    doc.setFont("times", "normal");
    doc.setTextColor(20, 20, 20);

    const writeWrappedLine = (
        text: string,
        opts?: {
            font?: "normal" | "bold";
            size?: number;
            lineMult?: number;
            align?: "left" | "center";
            extraGapAfter?: number;
            firstIndent?: number;
            restIndent?: number;
        }
    ) => {
        const font = opts?.font ?? "normal";
        const size = opts?.size ?? 10.5;
        const lineMult = opts?.lineMult ?? 1.26;
        const align = opts?.align ?? "left";
        const extraGapAfter = opts?.extraGapAfter ?? 0;
        const firstIndent = opts?.firstIndent ?? 0;
        const restIndent = opts?.restIndent ?? 0;

        doc.setFont("times", font);
        doc.setFontSize(size);
        const splitWithIndents = (t: string) => {
            if (align !== "left" || (firstIndent <= 0 && restIndent <= 0)) {
                return doc.splitTextToSize(t, maxW);
            }
            const first = doc.splitTextToSize(t, Math.max(30, maxW - firstIndent));
            if (first.length <= 1) return first;
            // Re-wrap remaining lines to respect restIndent width
            const remainingText = first.slice(1).join(" ");
            const rest = doc.splitTextToSize(remainingText, Math.max(30, maxW - restIndent));
            return [first[0], ...rest];
        };
        const wrapped = splitWithIndents(text);
        const lineH = (size / 72) * 25.4 * lineMult;

        for (let i = 0; i < wrapped.length; i++) {
            const ln = wrapped[i];
            newPageIfNeeded(lineH);
            const x =
                align === "center"
                    ? pageW / 2
                    : marginL + (i === 0 ? firstIndent : restIndent);
            doc.text(ln, x, y, {
                align,
            });
            y += lineH;
        }
        if (extraGapAfter > 0) {
            y += extraGapAfter;
        }
    };

    const cleanInline = (line: string): string =>
        line
            .replace(/<[^>]+>/g, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/\s{2,}/g, " ")
            .trim();

    const drawTableRow = (cols: string[], isHeader: boolean) => {
        const rowTopPadding = 1.4;
        const rowBottomPadding = 1.3;
        const colRatios = [0.1, 0.30, 0.17, 0.16, 0.27];
        const colWidths = colRatios.map((r) => maxW * r);
        const fontSize = isHeader ? 9.6 : 9.2;
        const lineH = (fontSize / 72) * 25.4 * 1.2;
        const normalized = [...cols, "", "", "", ""].slice(0, 5).map((c) => cleanInline(c));
        const wrappedPerCol = normalized.map((c, i) => doc.splitTextToSize(c, colWidths[i] - 1.8));
        const maxLines = Math.max(...wrappedPerCol.map((w) => Math.max(1, w.length)));
        const rowHeight = rowTopPadding + rowBottomPadding + lineH * maxLines;
        newPageIfNeeded(rowHeight + 0.2);

        let x = marginL;
        if (isHeader) {
            doc.setFillColor(238, 241, 245);
            doc.rect(marginL, y, maxW, rowHeight, "F");
        }

        doc.setDrawColor(155, 155, 155);
        doc.setLineWidth(0.14);
        doc.rect(marginL, y, maxW, rowHeight);

        for (let i = 0; i < colWidths.length - 1; i++) {
            x += colWidths[i];
            doc.line(x, y, x, y + rowHeight);
        }

        x = marginL;
        doc.setFont("times", isHeader ? "bold" : "normal");
        doc.setFontSize(fontSize);
        for (let i = 0; i < colWidths.length; i++) {
            const colLines = wrappedPerCol[i];
            let textY = y + rowTopPadding + lineH * 0.9;
            for (const t of colLines) {
                doc.text(t, x + 0.9, textY);
                textY += lineH;
            }
            x += colWidths[i];
        }

        y += rowHeight;
    };

    const lines = md.split("\n");
    let firstH2Rendered = false;
    let inTable = false;
    let tableHeaderDone = false;
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) {
            y += MM_PER_LINE * 0.28;
            continue;
        }
        if (line === "---") {
            newPageIfNeeded(2);
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.2);
            doc.line(marginL, y, pageW - marginR, y);
            y += MM_PER_LINE * 0.55;
            continue;
        }
        if (line.startsWith("## ")) {
            const t = cleanInline(line.replace(/^##\s+/, ""));
            inTable = false;
            tableHeaderDone = false;
            if (!firstH2Rendered) {
                writeWrappedLine(t, {
                    font: "bold",
                    size: 13.2,
                    align: "center",
                    lineMult: 1.2,
                    extraGapAfter: MM_PER_LINE * 0.2,
                });
                firstH2Rendered = true;
            } else {
                y += MM_PER_LINE * 0.12;
                writeWrappedLine(t, {
                    font: "bold",
                    size: 11.4,
                    align: "left",
                    lineMult: 1.2,
                    extraGapAfter: MM_PER_LINE * 0.08,
                });
                doc.setDrawColor(115, 115, 115);
                doc.setLineWidth(0.22);
                doc.line(marginL, y, marginL + 32, y);
                y += MM_PER_LINE * 0.18;
            }
            continue;
        }
        if (line.startsWith("### ")) {
            const t = cleanInline(line.replace(/^###\s+/, ""));
            writeWrappedLine(t, {
                font: "bold",
                size: 11.2,
                lineMult: 1.2,
                extraGapAfter: MM_PER_LINE * 0.15,
            });
            continue;
        }
        if (/^\|.*\|$/.test(line)) {
            if (!inTable) {
                // Give the table a bit of breathing room from prior paragraph.
                y += MM_PER_LINE * 0.18;
                inTable = true;
                tableHeaderDone = false;
            }
            const cells = line
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim());
            const isSeparator = cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
            if (isSeparator) {
                continue;
            }
            const looksLikeHeader = cells.some((c) =>
                /sr\.\s*no\.?|milestone|due\s*date|amount|submission/i.test(c)
            );
            const isHeader = !tableHeaderDone && looksLikeHeader;
            drawTableRow(cells, isHeader);
            if (isHeader) tableHeaderDone = true;
            continue;
        }
        if (inTable) {
            // Leaving table mode: add a little gap after the table.
            y += MM_PER_LINE * 0.18;
            inTable = false;
            tableHeaderDone = false;
        }
        if (/^[-*]\s+/.test(line)) {
            const t = `• ${cleanInline(line.replace(/^[-*]\s+/, ""))}`;
            writeWrappedLine(t, {
                size: 10.2,
                lineMult: 1.24,
                firstIndent: 2.2,
                restIndent: 4.2,
            });
            continue;
        }
        if (/^\d+(\.\d+)*\s+/.test(line)) {
            writeWrappedLine(cleanInline(line), {
                size: 10.35,
                lineMult: 1.26,
                firstIndent: 1.8,
                restIndent: 4,
                extraGapAfter: MM_PER_LINE * 0.03,
            });
            continue;
        }

        const isAllCapsShort = line === line.toUpperCase() && line.length < 55;
        writeWrappedLine(cleanInline(line), {
            font: isAllCapsShort ? "bold" : "normal",
            size: isAllCapsShort ? 10.8 : 10.4,
            lineMult: 1.28,
        });
    }

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        renderPageFooter(p, totalPages);
    }

    const slug =
        (fileBaseName || input.projectTitle || "contract")
            .replace(/[^a-zA-Z0-9\u0900-\u097F\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .slice(0, 48) || "contract";
    doc.save(`${slug}-agreement.pdf`);
}

/** Map API public contract (client review) to document builder input */
export function mapPublicContractToDocumentInput(c: {
    id: number;
    project_name: string;
    project_category: string;
    description: string;
    due_date?: string;
    start_date?: string;
    total_amount: number;
    currency: string;
    client_name: string;
    client_company_name?: string;
    client_email: string;
    client_phone?: string;
    client_country?: string;
    terms_and_conditions?: string;
    revision_policy?: string;
    out_of_scope_work?: string;
    intellectual_property?: string;
    estimated_duration?: string;
    payment_method?: string;
    freelancer_name?: string;
    submission_criteria?: string;
    milestones: Array<{
        id: number;
        title: string;
        description?: string;
        amount: number;
        due_date?: string;
        order_index?: number;
        submission_criteria?: string;
    }>;
}): ContractDocumentInput {
    return {
        projectTitle: c.project_name,
        projectCategory: c.project_category,
        projectDesc: c.description,
        coreDeliverable: safe(c.submission_criteria, c.description),
        outOfScope: safe(c.out_of_scope_work, ""),
        startDate: fmtDateLabel(c.start_date) || safe(c.start_date, ""),
        deadline: fmtDateLabel(c.due_date) || safe(c.due_date, ""),
        duration: safe(c.estimated_duration, ""),
        contractCurrency: c.currency || "INR",
        totalAmount: c.total_amount,
        milestones: c.milestones.map((m) => ({
            title: m.title,
            description: m.description || "",
            amount: m.amount,
            due_date: fmtDateLabel(m.due_date) || m.due_date || "",
            is_initial_payment: m.order_index === 0,
            submission_criteria: m.submission_criteria,
        })),
        paymentMethod: safe(c.payment_method, ""),
        revisionPolicy: safe(c.revision_policy, ""),
        intellectualProperty: safe(c.intellectual_property, ""),
        customTerms: safe(c.terms_and_conditions, ""),
        clientName: c.client_name,
        clientCompany: safe(c.client_company_name, ""),
        clientEmail: c.client_email,
        clientPhone: safe(c.client_phone, ""),
        clientCountry: c.client_country,
        freelancerName: c.freelancer_name,
        contractId: c.id,
    };
}
