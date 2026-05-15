import type { Context, SessionFlavor } from 'grammy';

export interface BoardSummary {
  id: string;
  title: string;
  isPublic: boolean;
}

export interface CardSummary {
  id: string;
  title: string;
  description: string | null;
}

export interface ListDetail {
  id: string;
  title: string;
  cards: CardSummary[];
}

export interface BoardDetail {
  id: string;
  title: string;
  lists: ListDetail[];
}

export type ConvState =
  | { cmd: 'login'; step: 'email' }
  | { cmd: 'login'; step: 'password'; email: string }
  | { cmd: 'addcard'; step: 'pick_board' }
  | { cmd: 'addcard'; step: 'pick_list'; boardId: string; boardTitle: string }
  | { cmd: 'addcard'; step: 'card_title'; boardId: string; boardTitle: string; listId: string; listTitle: string };

export interface SessionData {
  conv?: ConvState;
  boardsCache?: BoardSummary[];
  boardDetail?: BoardDetail;
}

export type BotContext = Context & SessionFlavor<SessionData>;
