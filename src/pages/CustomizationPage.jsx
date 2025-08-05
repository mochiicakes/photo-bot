import { useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext';
import { Download, Mail } from 'lucide-react'
import { toPng } from 'html-to-image'

const CustomizationPage = ({ photos, onNavigate }) => {
  const { isDark } = useTheme();
  const previewRef = useRef(null)
  const [frameColor, setFrameColor] = useState('#f5f5f4')
  const [caption, setCaption] = useState('')

  const frameColors = [
    '#f5f5f4', '#1c1917', '#fecaca', '#ddd6fe', '#bbf7d0', '#fef3c7'
  ]

  const downloadPhotoStrip = async () => {
    if (!previewRef.current) return

    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        style: {
          margin: 0,
          padding: 0,
          background: frameColor,
          boxShadow: 'none'
        }
      })

      const link = document.createElement('a')
      link.download = 'photo-strip.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Could not generate image:', error)
      alert('Failed to download strip. Please try again.')
    }
  }
  
  return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 p-8">      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-stone-800 dark:text-stone-100 mb-4 tracking-wide">            CUSTOMIZE YOUR STRIP
          </h1>
          <button
            onClick={() => onNavigate('capture')}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 text-lg font-medium transition-colors duration-200"
          >
            ← Back to Camera
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {/* Left Panel - Controls */}
          <div className="space-y-8">
            {/* Frame Colors */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-stone-700">              <h3 className="text-xl font-medium mb-6 text-stone-800 dark:text-stone-200">Frame Color</h3>
              <div className="flex gap-4 justify-center">
                {frameColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFrameColor(color)}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 hover:scale-110 ${
                      frameColor === color ? 'border-stone-800 shadow-lg' : 'border-stone-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Caption */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-stone-700">
            <h3 className="text-xl font-medium mb-6 text-stone-800 dark:text-stone-200">Add Caption</h3>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Enter your caption..."
                className="w-full p-4 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500"
              />
            </div>
          </div>

          {/* Center - Preview */}
          <div className="flex justify-center">
            <div
              ref={previewRef}
              className="p-6 rounded-2xl shadow-2xl border border-stone-200 flex flex-col items-center"
              style={{ backgroundColor: frameColor, width: '280px' }}
            >
              <div style={{ height: '24px' }} />
              <div className="space-y-3 w-full">
                {photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg shadow-md"
                  />
                ))}
              </div>
              {caption && (
                <div className="mt-6 text-center text-stone-700 font-medium text-sm px-2">
                  {caption}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-stone-700">              <h3 className="text-xl font-medium mb-6 text-stone-800 dark:text-stone-200">Share Your Strip</h3>
              <div className="space-y-4">
                <button
                  onClick={downloadPhotoStrip}
                  className="w-full bg-stone-800 text-white px-6 py-4 rounded-xl hover:bg-stone-900 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  💾 Download Strip
                </button>
                <button
                  onClick={() => alert('Email feature coming soon!')}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  📧 Send via Email
                </button>
                <button
                  onClick={() => alert('QR Code feature coming soon!')}
                  className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl hover:bg-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  📱 Generate QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomizationPage
