import type { Task, TaskStatus } from '../types';
import { NotificationService } from './NotificationService';
import { StoryService } from './StoryService';
import { readCollection, writeCollection } from './storageEngine';

const STORAGE_KEY = 'manageme_tasks';
const COLLECTION = 'tasks';

export class TaskService {
  private static async getAll(): Promise<Task[]> {
    return readCollection<Task>(STORAGE_KEY, COLLECTION);
  }

  private static async saveAll(tasks: Task[]): Promise<void> {
    await writeCollection<Task>(STORAGE_KEY, COLLECTION, tasks);
  }

  static async fetchAll(): Promise<Task[]> {
    return this.getAll();
  }

  static async fetchByStory(historijaId: string): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter((task) => task.historijaId === historijaId);
  }

  static async create(task: Omit<Task, 'id' | 'dataUtworzenia'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      dataUtworzenia: new Date().toISOString(),
    };

    await this.saveAll([...(await this.getAll()), newTask]);

    const story = (await StoryService.fetchAll()).find((candidate) => candidate.id === task.historijaId);
    if (story) {
      await NotificationService.add({
        title: 'Nowe zadanie',
        message: `Dodano zadanie "${newTask.nazwa}" do Twojej historyjki: ${story.nazwa}`,
        priority: 'medium',
        recipientId: story.wlascicielId,
      });
    }

    return newTask;
  }

  static async update(updatedTask: Task): Promise<Task> {
    await this.saveAll((await this.getAll()).map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    await this.checkStoryStatus(updatedTask.historijaId);
    return updatedTask;
  }

  static async delete(id: string): Promise<void> {
    const tasks = await this.getAll();
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) return;

    await this.saveAll(tasks.filter((candidate) => candidate.id !== id));
    await this.checkStoryStatus(task.historijaId);

    const story = (await StoryService.fetchAll()).find((candidate) => candidate.id === task.historijaId);
    if (story) {
      await NotificationService.add({
        title: 'Usunięto zadanie',
        message: `Zadanie "${task.nazwa}" zostało usunięte z historyjki: ${story.nazwa}`,
        priority: 'medium',
        recipientId: story.wlascicielId,
      });
    }
  }

  static async assignUser(taskId: string, userId: string): Promise<Task> {
    const tasks = await this.getAll();
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error('Task not found');

    const updated: Task = {
      ...task,
      uzytkownikId: userId,
      stan: 'doing' as TaskStatus,
      dataStartu: new Date().toISOString(),
    };

    await this.saveAll(tasks.map((candidate) => (candidate.id === taskId ? updated : candidate)));

    const story = (await StoryService.fetchAll()).find((candidate) => candidate.id === task.historijaId);
    if (story && story.stan === 'todo') {
      await StoryService.update({ ...story, stan: 'doing' });
    }

    await NotificationService.add({
      title: 'Przypisano Cię do zadania',
      message: `Zostałeś przypisany do zadania: ${task.nazwa}`,
      priority: 'high',
      recipientId: userId,
    });

    if (story) {
      await NotificationService.add({
        title: 'Zmiana statusu zadania',
        message: `Zadanie "${task.nazwa}" zmieniło status na DOING`,
        priority: 'low',
        recipientId: story.wlascicielId,
      });
    }

    return updated;
  }

  static async markDone(taskId: string, zrealizowaneGodziny: number): Promise<Task> {
    const tasks = await this.getAll();
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error('Task not found');

    const updated: Task = {
      ...task,
      stan: 'done' as TaskStatus,
      dataZakonczenia: new Date().toISOString(),
      zrealizowaneGodziny,
    };

    await this.saveAll(tasks.map((candidate) => (candidate.id === taskId ? updated : candidate)));
    await this.checkStoryStatus(task.historijaId);

    const story = (await StoryService.fetchAll()).find((candidate) => candidate.id === task.historijaId);
    if (story) {
      await NotificationService.add({
        title: 'Zadanie ukończone',
        message: `Zadanie "${task.nazwa}" zmieniło status na DONE`,
        priority: 'medium',
        recipientId: story.wlascicielId,
      });
    }

    return updated;
  }

  private static async checkStoryStatus(historijaId: string): Promise<void> {
    const tasks = (await this.getAll()).filter((task) => task.historijaId === historijaId);
    if (tasks.length === 0 || !tasks.every((task) => task.stan === 'done')) {
      return;
    }

    const story = (await StoryService.fetchAll()).find((candidate) => candidate.id === historijaId);
    if (story && story.stan !== 'done') {
      await StoryService.update({ ...story, stan: 'done' });
    }
  }
}
