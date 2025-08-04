import React from 'react';

const PhotoStrip = ({ photos }) => {
  if (photos.length === 0) return null;

  return (
    <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded shadow-lg flex justify-center">
      <div
        className="bg-white dark:bg-black p-4 rounded border shadow-xl"
        style={{
          width: '220px',
          backgroundColor: '#fff',
          border: '2px solid #333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '40px' // reserved for future text
        }}
      >
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`strip-photo-${i}`}
            className="w-full h-32 object-cover rounded"
          />
        ))}

        {/* Future caption area */}
        <div className="text-sm text-gray-500 mt-4 italic">
          {/* Placeholder - can be used later */}
        </div>
      </div>
    </div>
  );
};

export default PhotoStrip;
