import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

const CustomizationPage = ({ photos, onNavigate }) => {
  const previewRef = useRef(null)
  const [frameColor, setFrameColor] = useState('#ffffff')
  const [caption, setCaption] = useState('')

  const frameColors = [
    '#ffffff', '#000000', '#fcd5ce', '#c7ceea', '#b5ead7', '#fff1a6'
  ]

  const downloadPhotoStrip = async () => {
    if (!previewRef.current) return
    const canvas = await html2canvas(previewRef.current)
    const link = document.createElement('a')
    link.download = 'photo-strip.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-purple-600" style={{ fontFamily: 'Just Another Hand, cursive' }}>✨ Customize Your Photo Strip</h1>
        <button
          onClick={() => onNavigate('capture')}
          className="mt-2 text-blue-600 underline hover:text-blue-800 text-lg"
        >
          ← Back to Camera
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Frame Color & Coming Soon */}
        <div className="space-y-6">
          {/* Frame Color Circles */}
          <div className="bg-white rounded-xl p-4 shadow border">
            <h3 className="text-lg font-semibold mb-2">🎨 Frame Color</h3>
            <div className="flex flex-wrap gap-3">
              {frameColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFrameColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${frameColor === color ? 'border-purple-600' : 'border-gray-300'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Stickers Coming Soon */}
          <div className="bg-white rounded-xl p-4 shadow border">
            <h3 className="text-lg font-semibold">🌟 Stickers</h3>
            <p className="text-sm text-gray-500 italic">Coming soon...</p>
          </div>

          {/* Caption Input */}
          <div className="bg-white rounded-xl p-4 shadow border">
            <h3 className="text-lg font-semibold">📝 Add Caption</h3>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Type your caption here"
              className="w-full mt-2 p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Middle - Photo Strip Preview */}
        <div className="flex justify-center">
          <div
            ref={previewRef}
            className="bg-white p-4 rounded-lg shadow border flex flex-col items-center"
            style={{ backgroundColor: frameColor, width: '220px' }}
          >
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`strip-photo-${i}`}
                className="w-full h-32 object-cover rounded mb-2"
              />
            ))}
            {caption && (
              <div className="mt-4 text-sm text-gray-600 italic text-center">
                {caption}
              </div>
            )}
          </div>
        </div>

        {/* Right - Sharing Options */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow border">
            <h3 className="text-lg font-semibold mb-4">📤 Sharing Options</h3>
            <button
              onClick={downloadPhotoStrip}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              💾 Download
            </button>
            <button
              onClick={() => alert('Email sent!')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              📧 Email
            </button>
            <button
              onClick={() => alert('QR Code generated!')}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              📱 QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomizationPage
