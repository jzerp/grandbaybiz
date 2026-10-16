import { sniffImage, MAX_PHOTO_BYTES } from './validate.js';

// Stores one uploaded image in R2. Returns the key, or throws Error with a user-friendly message.
export async function savePhoto(env, file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') throw new Error('One of the photos could not be read.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('One of the photos is too large. Please try a smaller photo.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error('Photos must be JPG, PNG or WebP images.');
  const key = `p/${crypto.randomUUID()}.${kind.ext}`;
  await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: kind.type, cacheControl: 'public, max-age=31536000, immutable' } });
  return key;
}

export async function deletePhotos(env, keys) {
  const list = [...new Set(keys)].filter((k) => /^p\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(k));
  if (list.length) await env.PHOTOS.delete(list);
}

export const photoUrl = (key) => `/photos/${key.slice(2)}`;
export const keyFromPath = (p) => `p/${p}`;
