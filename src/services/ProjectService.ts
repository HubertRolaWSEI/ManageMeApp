import type { Project } from '../types';
import { UserService } from './UserService';
import { NotificationService } from './NotificationService';

const STORAGE_KEY = 'manageme_projects';
const ACTIVE_PROJECT_KEY = 'manageme_active_project';

export class ProjectService {
  static getAll(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveAll(projects: Project[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  static add(project: Omit<Project, 'id'>): Project {
    const projects = this.getAll();
    const id = crypto.randomUUID();
    const newProject = { ...project, id };
    this.saveAll([...projects, newProject]);

    // Powiadomienie: Utworzono nowy projekt (high, otrzymuje każdy admin)
    const admins = UserService.getAll().filter(u => u.rola === 'admin');
    admins.forEach(admin => {
      NotificationService.add({
        title: 'Nowy Projekt',
        message: `Utworzono nowy projekt: ${newProject.nazwa}`,
        priority: 'high',
        recipientId: admin.id
      });
    });

    return newProject;
  }

  static update(updatedProject: Project) {
    const projects = this.getAll().map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    this.saveAll(projects);
  }

  static delete(id: string) {
    const projects = this.getAll().filter(p => p.id !== id);
    this.saveAll(projects);
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(null);
    }
  }

  static getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  }

  static setActiveProjectId(id: string | null) {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  }
}