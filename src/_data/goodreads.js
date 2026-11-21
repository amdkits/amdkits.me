// Data for /library/books/, built from a Goodreads library export
// (Goodreads' RSS feeds and API no longer work). To refresh it:
//   Goodreads -> My Books -> Import and export -> Export Library,
//   save the download as src/_data/goodreads_library_export.csv, commit, push.
// Output is published at /goodreads.json. If the CSV is missing it is empty.
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
  const data = { updated: new Date().toISOString().slice(0, 10), reading: [], toRead: [], read: [] };
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
    // Export values look like ="9780062..."; keep digits only. Covers come from Open Library.
    const isbn = get(row, 'ISBN13').replace(/\D/g, '') || get(row, 'ISBN').replace(/[^\dXx]/g, '');
    data[shelf].push({
      id,
      title: get(row, 'Title'),
      author: get(row, 'Author'),
      url: id ? `https://www.goodreads.com/book/show/${id}` : '',
      cover: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : '',
      rating: Number(get(row, 'My Rating')) || 0,
      dateRead: isoDate(get(row, 'Date Read')),
      dateAdded: isoDate(get(row, 'Date Added'))
    });
  }
  return data;
}
