export type UserRole = 'admin' | 'devops' | 'developer' | 'guest';

export interface User {
  id: string;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  blocked: boolean;
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

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: NotificationPriority;
  isRead: boolean;
  recipientId: string;
}

export type View = 'projects' | 'stories' | 'tasks' | 'task-detail' | 'kanban' | 'notifications' | 'users-list';