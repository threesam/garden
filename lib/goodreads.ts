import { XMLParser } from "fast-xml-parser";

const USER_ID = "151736867";
const RSS_BASE = `https://www.goodreads.com/review/list_rss/${USER_ID}`;

interface RawEntry {
  title: string;
  author_name: string;
  book_id: string;
  isbn: string;
  user_rating: string;
  average_rating: string;
  book_published: string;
  num_pages: string;
  book_image_url: string;
  book_large_image_url: string;
  user_read_at: string;
  user_date_added: string;
  user_shelves: string;
}

export interface Book {
  id: string;
  title: string;
  cleanTitle: string;
  author: string;
  rating: number;
  averageRating: number;
  published: number;
  pages: number;
  coverUrl: string;
  readAt: Date | null;
  addedAt: Date;
  series: string | null;
  seriesNumber: number | null;
  shelves: string[];
}

const parser = new XMLParser();

function parseSeries(title: string): { cleanTitle: string; series: string | null; seriesNumber: number | null } {
  const match = title.match(/^(.+?)\s*\(([^,]+),\s*#([\d.]+)\)\s*$/);
  if (match) {
    return {
      cleanTitle: match[1].trim(),
      series: match[2].trim(),
      seriesNumber: parseFloat(match[3]),
    };
  }
  return { cleanTitle: title, series: null, seriesNumber: null };
}

function parseEntry(entry: RawEntry): Book {
  const { cleanTitle, series, seriesNumber } = parseSeries(entry.title);
  const readAt = entry.user_read_at ? new Date(entry.user_read_at) : null;
  const addedAt = new Date(entry.user_date_added);

  return {
    id: entry.book_id,
    title: entry.title,
    cleanTitle,
    author: entry.author_name,
    rating: parseInt(entry.user_rating) || 0,
    averageRating: parseFloat(entry.average_rating) || 0,
    published: parseInt(entry.book_published) || 0,
    pages: parseInt(entry.num_pages) || 0,
    coverUrl: entry.book_large_image_url || entry.book_image_url || "",
    readAt,
    addedAt,
    series,
    seriesNumber,
    shelves: entry.user_shelves ? entry.user_shelves.split(",").map((s: string) => s.trim()) : [],
  };
}

async function fetchPage(shelf: string, page: number): Promise<RawEntry[]> {
  const url = `${RSS_BASE}?shelf=${shelf}&page=${page}&per_page=100`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export async function getBooks(shelf = "read"): Promise<Book[]> {
  const pages = await Promise.all([fetchPage(shelf, 1), fetchPage(shelf, 2), fetchPage(shelf, 3)]);
  const entries = pages.flat();
  return entries.map(parseEntry);
}
