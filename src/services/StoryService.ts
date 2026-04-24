import type { Story } from '../types';
import { readCollection, writeCollection } from './storageEngine';

const STORAGE_KEY = 'manageme_stories';
const COLLECTION = 'stories';

export class StoryService {
  static async fetchAll(): Promise<Story[]> {
    return readCollection<Story>(STORAGE_KEY, COLLECTION);
  }

  private static async saveAll(stories: Story[]): Promise<void> {
    await writeCollection<Story>(STORAGE_KEY, COLLECTION, stories);
  }

  static async add(story: Omit<Story, 'id' | 'dataUtworzenia'>): Promise<Story> {
    const stories = await this.fetchAll();
    const newStory: Story = {
      ...story,
      id: crypto.randomUUID(),
      dataUtworzenia: new Date().toISOString()
    };
    await this.saveAll([...stories, newStory]);
    return newStory;
  }

  static async update(updatedStory: Story): Promise<void> {
    const stories = (await this.fetchAll()).map(s =>
      s.id === updatedStory.id ? updatedStory : s
    );
    await this.saveAll(stories);
  }

  static async delete(id: string): Promise<void> {
    const stories = (await this.fetchAll()).filter(s => s.id !== id);
    await this.saveAll(stories);
  }
}
