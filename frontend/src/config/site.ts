/** Google Form / waitlist URL — set `VITE_WAITLIST_FORM_URL` in `.env` and Vercel. */
export const WAITLIST_FORM_URL: string =
  (import.meta.env.VITE_WAITLIST_FORM_URL as string | undefined)?.trim() || ''

export const SITE_ORIGIN = 'https://defellix.com'

export function waitlistHref(): string {
  return WAITLIST_FORM_URL || '#'
}
