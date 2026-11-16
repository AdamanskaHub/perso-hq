import { MAX_IMAGE_DATA_URL_CHARS } from './validate';

/**
 * Trophy images are resized in the browser and stored as data URLs inside the same saved data,
 * so they travel with every export. Limits keep the 5 MB browser storage budget healthy.
 */
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TARGET_CHARS = 350_000; // ≈ 260 KB of image data
const SIZES = [1000, 800, 640, 480];
const QUALITIES = [0.85, 0.72, 0.6];

export class ImageError extends Error {}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

export async function resizeImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new ImageError('Please choose a PNG, JPEG, WebP or GIF image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError('That image is over 10 MB. Please choose a smaller one.');
  }
  const img = await load(file);
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  if (!w0 || !h0) throw new ImageError('That image has no dimensions.');

  const keepPng = file.type === 'image/png'; // preserves crisp pixel art where it fits
  let best: string | null = null;

  for (const max of SIZES) {
    const scale = Math.min(1, max / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('Image processing is not available in this browser.');
    // Nearest-neighbour when upscaling is impossible, smooth when shrinking.
    ctx.imageSmoothingEnabled = scale < 1;
    if (!keepPng) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (keepPng) {
      const png = canvas.toDataURL('image/png');
      if (png.startsWith('data:image/png') && png.length <= TARGET_CHARS) return png;
    }
    for (const q of QUALITIES) {
      const jpg = canvas.toDataURL('image/jpeg', q);
      if (!best || jpg.length < best.length) best = jpg;
      if (jpg.length <= TARGET_CHARS) return jpg;
    }
  }
  if (best && best.length <= MAX_IMAGE_DATA_URL_CHARS) return best;
  throw new ImageError('That image is too detailed to store compactly. Try a smaller or simpler one.');
}
