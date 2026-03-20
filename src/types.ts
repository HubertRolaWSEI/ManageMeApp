export type UserRole = 'admin' | 'devops' | 'developer';

export interface User {
  id: string;
  imie: string;
  nazwisko: string;
  rola: UserRole;
}

export type StoryPriority = 'niski' | 'średni' | 'wysoki';
export type StoryStatus = 'todo' | 'doing' | 'done';

export interface Story {
  id: string;
  nazwa: string;
  opis: string;
  priorytet: StoryPriority;
  projektId: string;
  dataUtworzenia: string;
  stan: StoryStatus;
  wlascicielId: string;
}

export interface Project {
  id: string;
  nazwa: string;
  opis: string;
}

export type TaskPriority = 'niski' | 'średni' | 'wysoki';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  nazwa: string;
  opis: string;
  priorytet: TaskPriority;
  historijaId: string;
  przewidywanyCzas: number;
  stan: TaskStatus;
  dataUtworzenia: string;
  dataStartu?: string;
  dataZakonczenia?: string;
  uzytkownikId?: string;
  zrealizowaneGodziny?: number;
}