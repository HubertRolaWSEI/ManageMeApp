import type { Project } from '../types';

const STORAGE_KEY = 'manageme_projects';

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
    const id = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Date.now().toString();

    const newProject = { ...project, id };
    this.saveAll([...projects, newProject]);
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
  }
}