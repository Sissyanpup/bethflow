export * from './social-platforms.js';

export type Role = 'GUEST' | 'USER' | 'ADMIN';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API response shapes
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Auth
export interface TokenPayload {
  sub: string;       // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

// User
export interface UserPublic {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

// Board
export interface Board {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// List
export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
}

// Card
export interface Card {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  color: string | null;
  position: number;
  isArchived: boolean;
  startDate: string | null;
  endDate: string | null;
  listId: string;
  catalogId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  cardId: string;
  text: string;
  isChecked: boolean;
  position: number;
  createdAt: string;
}

export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardDetail extends Card {
  checklist: ChecklistItem[];
  comments: CardComment[];
  catalog: { id: string; title: string } | null;
}

export interface UserPublicStats {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  onTimePercent: number;
}

// Catalog
export interface Catalog {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// SocialLink
export interface SocialLink {
  id: string;
  userId: string;
  platform: string;
  label: string;
  url: string;
  iconSlug: string | null;
  isVisible: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Feedback
export interface Feedback {
  id: string;
  content: string;
  userId: string | null;
  createdAt: string;
}
