import ThemeToggle from './ThemeToggle'

// Vermilion seal stamp (印章) reading 照相馆, "photo studio".
export const Seal = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`shrink-0 flex items-center justify-center rounded-md bg-accent text-on-accent font-brush leading-none shadow-md -rotate-3 ${className}`}
    style={{ boxShadow: 'inset 0 0 0 3px var(--accent), inset 0 0 0 4.5px var(--on-accent)' }}
  >
    <span style={{ writingMode: 'vertical-rl' }}>照相馆</span>
  </div>
)

const BrandHeader = ({ title = 'PHOTO STUDIO', subtitle = '小小照相馆 · a tiny photobooth' }) => (
  <header className="flex justify-between items-start gap-4 mb-8 md:mb-12">
    <div className="flex items-center gap-4">
      <Seal className="w-12 h-[4.5rem] text-xl md:w-14 md:h-20 md:text-2xl" />
      <div>
        <h1 className="text-2xl md:text-4xl font-semibold tracking-[0.15em] text-ink">{title}</h1>
        <p className="mt-1 text-sm md:text-base text-gold tracking-[0.2em]">{subtitle}</p>
      </div>
    </div>
    <ThemeToggle />
  </header>
)

export default BrandHeader
