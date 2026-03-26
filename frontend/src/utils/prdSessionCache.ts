/**
 * Session-scoped cache for raw PRD text extracted on upload.
 * Used to ground AI milestone suggestions; cleared on leave/send/close (see CreateContractForm).
 * sessionStorage is cleared automatically when the browser tab is closed.
 */
const KEY = "defellix_prd_extracted_text";

export function setPrdExtractedText(text: string): void {
    try {
        const t = text?.trim();
        if (!t) return;
        sessionStorage.setItem(KEY, text);
    } catch {
        // QuotaExceeded or private mode — ignore
    }
}

export function getPrdExtractedText(): string {
    try {
        return sessionStorage.getItem(KEY) ?? "";
    } catch {
        return "";
    }
}

export function clearPrdExtractedText(): void {
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
}
