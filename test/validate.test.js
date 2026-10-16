import test from 'node:test';
import assert from 'node:assert/strict';
import { validateListing, normalizeWebsite, sniffImage } from '../src/lib/validate.js';
import { slugify, telHref } from '../src/lib/util.js';

const good = { name: 'Bayside Handyman Co.', category: 'home', description: 'Repairs, installs and small home projects, done right.', contact_name: 'Marco Rivera', phone: '(305) 555-0142', email: 'Marco@Example.com', website: 'www.example.com' };

test('accepts a good listing and normalizes it', () => {
  const r = validateListing(good);
  assert.equal(r.ok, true);
  assert.equal(r.values.email, 'marco@example.com');
  assert.equal(r.values.website, 'https://www.example.com/');
});
test('rejects bad fields', () => {
  const r = validateListing({ ...good, name: 'x', email: 'nope', phone: '12', category: 'zzz', description: 'short' });
  assert.deepEqual(Object.keys(r.errors).sort(), ['category', 'description', 'email', 'name', 'phone']);
});
test('description over 500 characters is rejected', () => {
  assert.ok(validateListing({ ...good, description: 'a'.repeat(501) }).errors.description);
});
test('websites: optional, https default, junk rejected, javascript: rejected', () => {
  assert.equal(normalizeWebsite(''), '');
  assert.equal(normalizeWebsite('example.com'), 'https://example.com/');
  assert.equal(normalizeWebsite('javascript:alert(1)'), null);
  assert.equal(normalizeWebsite('not a url'), null);
});
test('slugify', () => {
  assert.equal(slugify('Salt & Cedar Catering'), 'salt-and-cedar-catering');
  assert.equal(slugify('  Café Niño!! '), 'cafe-nino');
  assert.equal(slugify('!!!'), 'business');
});
test('phone links', () => {
  assert.equal(telHref('(305) 555-0142'), 'tel:+13055550142');
});
test('image sniffing', () => {
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])).ext, 'jpg');
  assert.equal(sniffImage(new TextEncoder().encode('this is not an image')), null);
});
