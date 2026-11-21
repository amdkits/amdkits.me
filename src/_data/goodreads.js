// Build-time fallback for /library/books/.
//
// If the live /api/goodreads feed is unavailable, the page falls back to
// /goodreads.json, generated from a Goodreads library export. To refresh it:
//   Goodreads -> My Books -> Import and export -> Export Library,
//   then save the downloaded file as src/_data/goodreads_library_export.csv
//   and rebuild. If the file is missing, the fallback is simply empty.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSV_PATH = fileURLToPath(new URL('./goodreads_library_export.csv', import.meta.url));

// Minimal RFC 4180 parser: quoted fields, escaped quotes, newlines in fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

const isoDate = (value) => {
  const m = String(value || '').match(/^(\d{4})[/-](\d{2})[/-](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

export default function () {
  const data = { source: 'export', reading: [], toRead: [], read: [] };
  if (!existsSync(CSV_PATH)) return data;

  const text = readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '');
  const [header = [], ...rows] = parseCsv(text);
  const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
  const get = (row, name) => (name in col ? (row[col[name]] ?? '').trim() : '');

  const shelfFor = { read: 'read', 'currently-reading': 'reading', 'to-read': 'toRead' };

  for (const row of rows) {
    const shelf = shelfFor[get(row, 'Exclusive Shelf')];
    if (!shelf) continue; // custom exclusive shelves such as did-not-finish
    const id = get(row, 'Book Id');
    data[shelf].push({
      id,
      title: get(row, 'Title'),
      author: get(row, 'Author'),
      url: id ? `https://www.goodreads.com/book/show/${id}` : '',
      cover: '',
      rating: Number(get(row, 'My Rating')) || 0,
      dateRead: isoDate(get(row, 'Date Read')),
      dateAdded: isoDate(get(row, 'Date Added'))
    });
  }
  return data;
}
