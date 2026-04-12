import { waitlistHref } from '@/config/site'

const LABEL = 'Join the waitlist'

type Props = {
  className?: string
  variant?: 'hero' | 'cta' | 'nav'
}

export default function BetaLaunchLink({ className = '', variant = 'hero' }: Props) {
  const href = waitlistHref()
  const hasFormUrl = Boolean(import.meta.env.VITE_WAITLIST_FORM_URL?.trim())

  const base =
    variant === 'hero'
      ? 'group relative px-12 py-5 bg-accent text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(60,180,79,0.3)] hover:shadow-[0_0_50px_rgba(60,180,79,0.5)]'
      : variant === 'cta'
        ? 'bg-[#1C1C1C] text-[#3cb44f] px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#3cb44f] hover:text-black border cursor-pointer transition-colors duration-300 inline-block text-center'
        : 'px-8 cursor-pointer py-3 bg-accent border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[.25em] text-black hover:bg-black hover:text-accent hover:border-accent transition-colors duration-300'

  return (
    <a
      href={href}
      target={hasFormUrl ? '_blank' : undefined}
      rel={hasFormUrl ? 'noopener noreferrer' : undefined}
      className={`${base} ${className}`.trim()}
      title={hasFormUrl ? LABEL : 'Add VITE_WAITLIST_FORM_URL to point to your Google Form'}
      onClick={
        hasFormUrl
          ? undefined
          : (e) => {
              e.preventDefault()
            }
      }
    >
      {variant === 'hero' && (
        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      )}
      <span className={variant === 'hero' ? 'relative flex items-center justify-center gap-2' : ''}>
        {LABEL}
      </span>
    </a>
  )
}

export { LABEL as BETA_LAUNCH_LABEL }
