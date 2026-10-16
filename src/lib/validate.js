import { CATEGORY_BY_KEY } from '../categories.js';

export const ACK_VERSION = '2026-10-16b';
export const MIN_PHOTOS = 1;
export const MIN_DESCRIPTION = 30;
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024; // client resizes to ~300KB; this is the hard cap

export const ACK_TEXTS = [
  'I understand that everything I submit (business name, description, photos, contact person, phone, email, website and Instagram) will be shown publicly on the internet, and anyone may contact me.',
  'I own or have permission to use these photos and this text, and I allow the directory to display them.',
  'I am responsible for my business’s licenses, permits, insurance, taxes and compliance with HOA and local rules. The directory does not verify, endorse or guarantee any business.',
];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);

export function normalizeWebsite(raw) {
  let w = clean(raw, 200).replace(/\s+/g, '');
  if (!w) return '';
  if (!/^https?:\/\//i.test(w)) w = 'https://' + w;
  try {
    const u = new URL(w);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    return u.toString();
  } catch { return null; }
}

// Accepts "@handle", "handle" or an instagram.com URL. Returns the bare handle, '' if blank, or null if invalid.
export function normalizeInstagram(raw) {
  let h = clean(raw, 200);
  if (!h) return '';
  const m = h.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i);
  if (m) h = m[1];
  h = h.replace(/^@+/, '');
  if (!/^[A-Za-z0-9._]{1,30}$/.test(h) || /^\.|\.\.|\.$/.test(h)) return null;
  return h;
}

// Validates the text fields of a listing. Returns { ok, errors, values }.
export function validateListing(input) {
  const errors = {};
  const v = {
    name: clean(input.name, 80),
    category: clean(input.category, 20),
    description: clean(input.description, 500),
    contact_name: clean(input.contact_name, 80),
    phone: clean(input.phone, 30),
    email: clean(input.email, 120).toLowerCase(),
    website: '',
    instagram: '',
  };
  if (v.name.length < 2) errors.name = 'Please enter your business name.';
  if (!CATEGORY_BY_KEY[v.category]) errors.category = 'Please choose a category.';
  if (v.description.length < MIN_DESCRIPTION) errors.description = `Please write at least ${MIN_DESCRIPTION} characters about what you do.`;
  if (clean(input.description, 5000).length > 500) errors.description = 'Please keep the description to 500 characters.';
  if (v.contact_name.length < 2) errors.contact_name = 'Please enter a contact person.';
  if (v.phone.replace(/\D/g, '').length < 7 || !/^[\d\s()+.\-x#]+$/.test(v.phone)) errors.phone = 'Please enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errors.email = 'Please enter a valid email address.';
  const w = normalizeWebsite(input.website);
  if (w === null) errors.website = 'That website address does not look right. Leave it blank if you do not have one.';
  else v.website = w;
  const ig = normalizeInstagram(input.instagram);
  if (ig === null) errors.instagram = 'That Instagram name does not look right. Use just your handle, like @yourbusiness, or leave it blank.';
  else v.instagram = ig;
  return { ok: Object.keys(errors).length === 0, errors, values: v };
}

export function sniffImage(bytes) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { type: 'image/png', ext: 'png' };
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { type: 'image/webp', ext: 'webp' };
  return null;
}
