import type { Story } from '../types';

const STORAGE_KEY = 'manageme_stories';

export class StoryService {
  static getAll(): Story[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveAll(stories: Story[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  }

  static add(story: Omit<Story, 'id' | 'dataUtworzenia'>): Story {
    const stories = this.getAll();
    const newStory: Story = {
      ...story,
      id: crypto.randomUUID(),
      dataUtworzenia: new Date().toISOString()
    };
    this.saveAll([...stories, newStory]);
    return newStory;
  }

  static update(updatedStory: Story) {
    const stories = this.getAll().map(s => 
      s.id === updatedStory.id ? updatedStory : s
    );
    this.saveAll(stories);
  }

  static delete(id: string) {
    const stories = this.getAll().filter(s => s.id !== id);
    this.saveAll(stories);
  }
}