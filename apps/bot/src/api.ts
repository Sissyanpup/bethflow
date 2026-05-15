import axios from 'axios';
import type { BoardDetail, BoardSummary } from './types.js';

const client = axios.create({
  baseURL: process.env.API_BASE_URL ?? 'http://api:4000',
  timeout: 10_000,
});

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function login(email: string, password: string) {
  const res = await client.post<{
    success: true;
    data: {
      token: string;
      expiresAt: string;
      user: { displayName: string | null; username: string };
    };
  }>('/api/auth/bot-token', { email, password });
  return {
    token: res.data.data.token,
    displayName: res.data.data.user.displayName,
    username: res.data.data.user.username,
  };
}

export async function revokeToken(token: string): Promise<void> {
  await client.delete('/api/auth/bot-token', { headers: authHeaders(token) });
}

export async function getBoards(token: string): Promise<BoardSummary[]> {
  const res = await client.get<{
    success: true;
    data: BoardSummary[];
  }>('/api/boards', { headers: authHeaders(token) });
  return res.data.data;
}

export async function getBoardDetail(token: string, boardId: string): Promise<BoardDetail> {
  const res = await client.get<{
    success: true;
    data: BoardDetail;
  }>(`/api/boards/${boardId}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function createCard(
  token: string,
  listId: string,
  title: string,
): Promise<{ id: string; title: string }> {
  const res = await client.post<{
    success: true;
    data: { id: string; title: string };
  }>(`/api/cards/list/${listId}`, { title }, { headers: authHeaders(token) });
  return res.data.data;
}
