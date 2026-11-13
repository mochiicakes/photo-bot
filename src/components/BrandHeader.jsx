import { useId } from 'react'
import ThemeToggle from './ThemeToggle'

// Sleepy crescent moon with a blush and a little star. Same art as public/favicon.svg.
export const MoonLogo = ({ className = '' }) => {
  const maskId = useId()
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1b2452" />
      <mask id={maskId}>
        <circle cx="30" cy="34" r="20" fill="#fff" />
        <circle cx="41" cy="25" r="16" fill="#000" />
      </mask>
      <circle cx="30" cy="34" r="20" fill="#ffd76a" mask={`url(#${maskId})`} />
      <path d="M17 36q3 3 6 0" fill="none" stroke="#1b2452" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="19" cy="42" rx="3.2" ry="2" fill="#ff9fbf" opacity=".85" />
      <path d="M48 12Q48 17 53 17Q48 17 48 22Q48 17 43 17Q48 17 48 12Z" fill="#fff4c8" />
      <circle cx="54" cy="31" r="1.4" fill="#fff4c8" />
    </svg>
  )
}

const BrandHeader = () => (
  <header className="flex justify-between items-start gap-4 mb-8 md:mb-12">
    <div className="flex items-center gap-3 md:gap-4">
      <MoonLogo className="w-14 h-14 md:w-16 md:h-16 shrink-0 drop-shadow-md" />
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink leading-none">
          月カメ
          <span className="block mt-1 text-xs sm:inline sm:mt-0 sm:ml-2 sm:align-middle sm:text-base md:text-lg font-medium tracking-[0.25em] text-ink-soft">
            TSUKI CAM
          </span>
        </h1>
        <p className="mt-2 text-sm md:text-base text-gold tracking-[0.12em]">
          ちいさな写真館<span className="hidden sm:inline"> · a moonlit photobooth</span>
        </p>
      </div>
    </div>
    <ThemeToggle />
  </header>
)

export default BrandHeader
