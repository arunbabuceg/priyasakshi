import React, { useState } from 'react';
import { imageUrl } from '@/lib/imageUrl';

/**
 * ProductGallery — primary image with thumbnail row when a product has
 * multiple images. Falls back gracefully to a single image.
 */
export default function ProductGallery({ images = [], alt, testId }) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (safe.length === 0) return null;
  const current = imageUrl(safe[Math.min(active, safe.length - 1)]);

  return (
    <div className="w-full h-full flex flex-col gap-3" data-testid={testId}>
      <div
        className="flex-1 rounded-[24px] overflow-hidden"
        style={{
          boxShadow:
            'inset 0 8px 16px rgba(0,0,0,0.08), inset 0 -8px 16px rgba(255,255,255,0.35)',
        }}
      >
        <img
          src={current}
          alt={alt}
          className="w-full h-full object-cover"
          data-testid={testId ? `${testId}-primary` : undefined}
        />
      </div>
      {safe.length > 1 && (
        <div className="flex gap-2" data-testid={testId ? `${testId}-thumbs` : undefined}>
          {safe.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`w-14 h-14 rounded-2xl overflow-hidden clay-btn-ghost p-1 ${
                i === active ? 'ring-2 ring-[#8B2956]' : ''
              }`}
              aria-label={`Show image ${i + 1}`}
              data-testid={testId ? `${testId}-thumb-${i}` : undefined}
            >
              <img src={imageUrl(src)} alt={`${alt} — ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
