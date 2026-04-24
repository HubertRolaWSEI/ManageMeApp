import type { Project } from '../types';
import { NotificationService } from './NotificationService';
import { UserService } from './UserService';
import { readCollection, writeCollection } from './storageEngine';

const STORAGE_KEY = 'manageme_projects';
const ACTIVE_PROJECT_KEY = 'manageme_active_project';
const COLLECTION = 'projects';

export class ProjectService {
  static async fetchAll(): Promise<Project[]> {
    return readCollection<Project>(STORAGE_KEY, COLLECTION);
  }

  private static async saveAll(projects: Project[]): Promise<void> {
    await writeCollection<Project>(STORAGE_KEY, COLLECTION, projects);
  }

  static async add(project: Omit<Project, 'id'>): Promise<Project> {
    const projects = await this.fetchAll();
    const id = crypto.randomUUID();
    const newProject = { ...project, id };
    await this.saveAll([...projects, newProject]);

    const admins = (await UserService.fetchAll()).filter((user) => user.rola === 'admin');
    await Promise.all(
      admins.map((admin) =>
        NotificationService.add({
          title: 'Nowy Projekt',
          message: `Utworzono nowy projekt: ${newProject.nazwa}`,
          priority: 'high',
          recipientId: admin.id,
        }),
      ),
    );

    return newProject;
  }

  static async update(updatedProject: Project): Promise<void> {
    const projects = (await this.fetchAll()).map((project) =>
      project.id === updatedProject.id ? updatedProject : project,
    );
    await this.saveAll(projects);
  }

  static async delete(id: string): Promise<void> {
    const projects = (await this.fetchAll()).filter((project) => project.id !== id);
    await this.saveAll(projects);
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(null);
    }
  }

  static getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  }

  static setActiveProjectId(id: string | null): void {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  }
}
