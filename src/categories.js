// The seven categories. `key` is stored in the database; never change a key once listings exist.
export const CATEGORIES = [
  { key: 'home',   name: 'Home services',         blurb: 'Repairs, cleaning, landscaping and more from your Grand Bay neighbors.' },
  { key: 'kids',   name: 'Childcare & Tutoring',  blurb: 'Babysitting, lessons and after-school help.' },
  { key: 'beauty', name: 'Beauty',                blurb: 'Hair, nails, makeup and skincare.' },
  { key: 'food',   name: 'Food & Catering',       blurb: 'Home cooking, baked goods and event menus.' },
  { key: 'pets',   name: 'Pets',                  blurb: 'Walking, sitting, grooming and training.' },
  { key: 'events', name: 'Events',                blurb: 'Planning, decor, photography and entertainment.' },
  { key: 'pro',    name: 'Professional Services', blurb: 'Accounting, legal, design, consulting and more.' },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

// Inline SVG icon bodies (24x24, stroke based), same order as CATEGORIES.
export const CATEGORY_ICONS = {
  home: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.5 17.2a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  kids: '<path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/>',
  beauty: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  food: '<path d="M5 3v7a2 2 0 0 0 2 2v9"/><path d="M9 3v7"/><path d="M7 3v7"/><path d="M17 3c-2 1.5-3 4-3 7h3v11"/>',
  pets: '<circle cx="6.5" cy="10" r="1.8"/><circle cx="10.5" cy="6" r="1.8"/><circle cx="15.5" cy="6" r="1.8"/><circle cx="19" cy="10" r="1.8"/><path d="M12.8 11c-2.6 0-5.3 3.2-5.3 5.7 0 2 1.7 2.8 3.2 2.3.9-.3 1.4-.5 2.1-.5s1.2.2 2.1.5c1.5.5 3.2-.3 3.2-2.3 0-2.5-2.7-5.7-5.3-5.7z"/>',
  events: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 13.5l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>',
  pro: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
};
