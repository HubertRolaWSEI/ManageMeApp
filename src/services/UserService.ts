// src/services/UserService.ts
import type { User } from '../types';
import { NotificationService } from './NotificationService';

// KLUCZOWE: Wpisz tutaj dokładnie ten e-mail, który widać na zrzucie ekranu
const SUPER_ADMIN_EMAIL = "hubert.rola1337@gmail.com"; 

export const UserService = {
  getAll(): User[] {
    const data = localStorage.getItem('app_users');
    return data ? JSON.parse(data) : [];
  },

  handleAuthUser(firebaseUser: any, customDisplayName?: string): User {
    const users = this.getAll();
    let user = users.find(u => u.email === firebaseUser.email);

    if (!user) {
      const isSuperAdmin = firebaseUser.email === SUPER_ADMIN_EMAIL;
      const nameFromEmail = firebaseUser.email.split('@')[0];
      const finalName = customDisplayName || firebaseUser.displayName || nameFromEmail;
      const [imie, ...nazwiskoParts] = finalName.split(' ');
      
      user = {
        id: firebaseUser.uid,
        imie: imie,
        nazwisko: nazwiskoParts.join(' ') || '',
        email: firebaseUser.email,
        rola: isSuperAdmin ? 'admin' : 'guest',
        blocked: false
      };

      localStorage.setItem('app_users', JSON.stringify([...users, user]));
      this.notifyAdminsAboutNewUser(user);
    }

    localStorage.setItem('logged_in_user', JSON.stringify(user));
    return user;
  },

  notifyAdminsAboutNewUser(newUser: User) {
    const admins = this.getAll().filter(u => u.rola === 'admin');
    admins.forEach(admin => {
      NotificationService.add({
        title: 'Nowy użytkownik',
        message: `Użytkownik ${newUser.email} zarejestrował się.`,
        priority: 'high',
        recipientId: admin.id
      });
    });
  },

  getLoggedInUser(): User | null {
    const data = localStorage.getItem('logged_in_user');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return this.getAll().find(u => u.id === parsed.id) || null;
  },

  updateUser(updatedUser: User) {
    const users = this.getAll().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem('app_users', JSON.stringify(users));
  },

  logout() {
    localStorage.removeItem('logged_in_user');
  }
};