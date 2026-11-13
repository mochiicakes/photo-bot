import Slider from './Slider'

// Beauty (美肌 smooth skin, 美白 brighten) and filter-strength sliders, shared by the
// capture and customize pages.
export const BeautySliders = ({ smooth, brighten, onChange, disabled }) => (
  <div className="flex flex-col items-center gap-3 w-full">
    <Slider label="Smooth" sublabel="美肌" value={smooth} onChange={(v) => onChange({ smooth: v })} disabled={disabled} />
    <Slider label="Brighten" sublabel="美白" value={brighten} onChange={(v) => onChange({ brighten: v })} disabled={disabled} />
  </div>
)

export const StrengthSlider = ({ filter, value, onChange, disabled }) =>
  filter === 'none' ? null : (
    <Slider label="Strength" sublabel="強さ" value={value} onChange={onChange} disabled={disabled} />
  )
