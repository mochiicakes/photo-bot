import { useState } from "react"
import { ImageIcon } from "lucide-react"

const PhotoCount = ({ targetCount, setTargetCount }) => {
  const [open, setOpen] = useState(false)

  const options = [1, 2, 3, 4]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 flex items-center justify-center rounded-full border border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
        aria-label="Select Number of Photos"
      >
        <ImageIcon className="w-5 h-5" />
        <span className="absolute -bottom-1.5 -right-1 text-xs ...">
          {targetCount}
        </span>
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-black border border-black dark:border-white rounded shadow z-10 flex">
        {options.map((num) => (
            <button
            key={num}
            onClick={() => {
                setTargetCount(num)
                setOpen(false)
            }}
            className={`px-3 py-1 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition ${
                num === targetCount
                ? "bg-black text-white dark:bg-white dark:text-black"
                : ""
            }`}
            >
            {num}
            </button>
        ))}
        </div>
      )}
    </div>
  )
}

export default PhotoCount
