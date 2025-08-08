/*!
 * Copyright (c) 2022-2025 Digital Bazaar, Inc. All rights reserved.
 */

// Helper to load image as Promise
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

