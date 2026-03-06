export interface User {
  id: string;
  imie: string;
  nazwisko: string;
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