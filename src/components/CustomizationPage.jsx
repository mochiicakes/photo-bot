import { useRef } from 'react'
import html2canvas from 'html2canvas'

const CustomizationPage = ({ photos, onNavigate }) => {
  const previewRef = useRef(null)
  const [frameColor, setFrameColor] = useState('#ffffff')
  const [stickers, setStickers] = useState([])
  const [borderStyle, setBorderStyle] = useState('classic')

  const frameColors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Pink', value: '#fcd5ce' },
    { name: 'Blue', value: '#c7ceea' },
    { name: 'Mint', value: '#b5ead7' },
    { name: 'Yellow', value: '#fff1a6' },
  ]

  const availableStickers = ['❤️', '⭐', '🌟', '💫', '🎈', '🎉', '🌸', '🌺', '🦋', '🌈']

const downloadPhotoStrip = async () => {
  if (!previewRef.current) return
  const canvas = await html2canvas(previewRef.current)
  const link = document.createElement('a')
  link.download = 'photo-strip.png'
  link.href = canvas.toDataURL()
  link.click()
    }
    
  const sharePhotoStrip = () => {
    alert('Sharing photo strip! (This would open sharing options)')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-purple-600 mb-4" style={{fontFamily: 'Just Another Hand, cursive'}}>
          ✨ Customize Your Photo Strip
        </h1>
        <button 
          onClick={() => onNavigate('capture')}
          className="text-lg text-blue-600 hover:text-blue-800 underline" 
          style={{fontFamily: 'Just Another Hand, cursive'}}
        >
          ← Back to Camera
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Left Column - Customization Options */}
        <div className="space-y-6">
          {/* Frame Color */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🎨 Frame Color</h3>
            <div className="grid grid-cols-3 gap-3">
              {frameColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFrameColor(color.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    frameColor === color.value 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value === '#ffffff' ? '#f9f9f9' : color.value }}
                >
                  <div className="text-sm font-semibold" style={{ color: color.value === '#000000' ? 'white' : 'black' }}>
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stickers */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🌟 Stickers</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {availableStickers.map((sticker, i) => (
                <button
                  key={i}
                  onClick={() => setStickers(prev => [...prev, sticker])}
                  className="text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sticker}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Selected: {stickers.join(' ')}
            </div>
          </div>

          {/* Border Style */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📐 Border Style</h3>
            <div className="space-y-2">
              {['classic', 'rounded', 'polaroid'].map((style) => (
                <label key={style} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="borderStyle"
                    value={style}
                    checked={borderStyle === style}
                    onChange={(e) => setBorderStyle(e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="capitalize font-semibold">{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sharing Options */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📤 Sharing Options</h3>
            <div className="space-y-3">
              <button 
                onClick={downloadPhotoStrip}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                💾 Download
              </button>
              <button 
                onClick={sharePhotoStrip}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                📧 Email
              </button>
              <button 
                onClick={() => alert('QR Code generated!')}
                className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold"
              >
                📱 QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Photo Strip Preview */}
        <div ref={previewRef}>
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-center text-gray-800">📸 Photo Strip Preview</h3>
          <div
            className="mx-auto p-4 rounded-lg shadow-lg"
            style={{
              backgroundColor: frameColor,
              maxWidth: '300px',
              border: borderStyle === 'classic' ? '2px solid #333' : 
                     borderStyle === 'rounded' ? '2px solid #333' : 
                     '4px solid #fff',
              borderRadius: borderStyle === 'rounded' ? '20px' : 
                          borderStyle === 'polaroid' ? '8px' : '0px',
              boxShadow: borderStyle === 'polaroid' ? '0 10px 30px rgba(0,0,0,0.3)' : 'inherit'
            }}
          >
            <div className="space-y-2">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`strip-photo-${i}`}
                    className="w-full h-32 object-cover"
                    style={{ 
                      borderRadius: borderStyle === 'rounded' ? '8px' : '0px'
                    }}
                  />
                  {/* Stickers overlay */}
                  <div className="absolute top-1 right-1 text-lg">
                    {stickers.slice(0, 2).join('')}
                  </div>
                </div>
              ))}
            </div>
            {borderStyle === 'polaroid' && (
              <div className="mt-4 text-center text-sm text-gray-600" style={{fontFamily: 'Just Another Hand, cursive'}}>
                Photo Memories ✨
              </div>
            )}
          </div>
        </div>
         </div>
      </div>
    </div>
  )
}

export default CustomizationPage