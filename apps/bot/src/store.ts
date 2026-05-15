import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

type TokenStore = Record<string, string>;

function load(): TokenStore {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')) as TokenStore;
  } catch {
    return {};
  }
}

function save(data: TokenStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
}

export function getToken(chatId: number): string | undefined {
  return load()[chatId.toString()];
}

export function setToken(chatId: number, token: string): void {
  const data = load();
  data[chatId.toString()] = token;
  save(data);
}

export function deleteToken(chatId: number): void {
  const data = load();
  delete data[chatId.toString()];
  save(data);
}
