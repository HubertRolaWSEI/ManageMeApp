import type { Task, TaskStatus } from '../types';
import { StoryService } from './StoryService';
import { NotificationService } from './NotificationService';

const STORAGE_KEY = 'manageme_tasks';
const API_DELAY = 300;

const fakeApi = <T>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), API_DELAY));

export class TaskService {
  static getAll(): Task[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveAll(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  static async fetchAll(): Promise<Task[]> {
    return fakeApi(this.getAll());
  }

  static async fetchByStory(historijaId: string): Promise<Task[]> {
    return fakeApi(this.getAll().filter(t => t.historijaId === historijaId));
  }

  static async create(task: Omit<Task, 'id' | 'dataUtworzenia'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      dataUtworzenia: new Date().toISOString(),
    };
    this.saveAll([...this.getAll(), newTask]);

    // Powiadomienie: Nowe zadanie w historyjce (medium, właściciel historyjki)
    const story = StoryService.getAll().find(s => s.id === task.historijaId);
    if (story) {
      NotificationService.add({
        title: 'Nowe zadanie',
        message: `Dodano zadanie "${newTask.nazwa}" do Twojej historyjki: ${story.nazwa}`,
        priority: 'medium',
        recipientId: story.wlascicielId
      });
    }

    return fakeApi(newTask);
  }

  static async update(updatedTask: Task): Promise<Task> {
    this.saveAll(this.getAll().map(t => t.id === updatedTask.id ? updatedTask : t));
    this._checkStoryStatus(updatedTask.historijaId);
    return fakeApi(updatedTask);
  }

  static async delete(id: string): Promise<void> {
    const tasks = this.getAll();
    const task = tasks.find(t => t.id === id);
    if (task) {
      this.saveAll(tasks.filter(t => t.id !== id));
      this._checkStoryStatus(task.historijaId);

      // Powiadomienie: Usunięcie zadania (medium, właściciel historyjki)
      const story = StoryService.getAll().find(s => s.id === task.historijaId);
      if (story) {
        NotificationService.add({
          title: 'Usunięto zadanie',
          message: `Zadanie "${task.nazwa}" zostało usunięte z historyjki: ${story.nazwa}`,
          priority: 'medium',
          recipientId: story.wlascicielId
        });
      }
    }
    return fakeApi(undefined);
  }

  static async assignUser(taskId: string, userId: string): Promise<Task> {
    const tasks = this.getAll();
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const updated: Task = {
      ...task,
      uzytkownikId: userId,
      stan: 'doing' as TaskStatus,
      dataStartu: new Date().toISOString(),
    };
    this.saveAll(tasks.map(t => t.id === taskId ? updated : t));

    const story = StoryService.getAll().find(s => s.id === task.historijaId);
    if (story && story.stan === 'todo') {
      StoryService.update({ ...story, stan: 'doing' });
    }

    // Powiadomienie: Przypisanie osoby (high, dla przypisanej osoby)
    NotificationService.add({
      title: 'Przypisano Cię do zadania',
      message: `Zostałeś przypisany do zadania: ${task.nazwa}`,
      priority: 'high',
      recipientId: userId
    });

    // Powiadomienie: Zmiana statusu na doing (low, właściciel historyjki)
    if (story) {
      NotificationService.add({
        title: 'Zmiana statusu zadania',
        message: `Zadanie "${task.nazwa}" zmieniło status na DOING`,
        priority: 'low',
        recipientId: story.wlascicielId
      });
    }

    return fakeApi(updated);
  }

  static async markDone(taskId: string, zrealizowaneGodziny: number): Promise<Task> {
    const tasks = this.getAll();
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const updated: Task = {
      ...task,
      stan: 'done' as TaskStatus,
      dataZakonczenia: new Date().toISOString(),
      zrealizowaneGodziny,
    };
    this.saveAll(tasks.map(t => t.id === taskId ? updated : t));
    this._checkStoryStatus(task.historijaId);

    // Powiadomienie: Zmiana statusu na done (medium, właściciel historyjki)
    const story = StoryService.getAll().find(s => s.id === task.historijaId);
    if (story) {
      NotificationService.add({
        title: 'Zadanie ukończone',
        message: `Zadanie "${task.nazwa}" zmieniło status na DONE`,
        priority: 'medium',
        recipientId: story.wlascicielId
      });
    }

    return fakeApi(updated);
  }

  static _checkStoryStatus(historijaId: string) {
    const tasks = this.getAll().filter(t => t.historijaId === historijaId);
    if (tasks.length > 0 && tasks.every(t => t.stan === 'done')) {
      const story = StoryService.getAll().find(s => s.id === historijaId);
      if (story && story.stan !== 'done') {
        StoryService.update({ ...story, stan: 'done' });
      }
    }
  }
}