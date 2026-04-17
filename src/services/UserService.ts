import type { User } from '../types'; 
import { NotificationService } from './NotificationService';

const SUPER_ADMIN_EMAIL = "hubert.rola1337@gmail.com"; 

export const UserService = {
  getAll(): User[] {
    const data = localStorage.getItem('app_users');
    return data ? JSON.parse(data) : [];
  },

  handleAuthUser(firebaseUser: any): User {
    const users = this.getAll();
    let user = users.find(u => u.email === firebaseUser.email);

    if (!user) {
      const isSuperAdmin = firebaseUser.email === SUPER_ADMIN_EMAIL;
      const [imie, ...nazwiskoParts] = (firebaseUser.displayName || "Użytkownik").split(' ');
      
      user = {
        id: firebaseUser.uid,
        imie: imie,
        nazwisko: nazwiskoParts.join(' '),
        email: firebaseUser.email,
        rola: isSuperAdmin ? 'admin' : 'guest',
        blocked: false
      };

      localStorage.setItem('app_users', JSON.stringify([...users, user]));
      
      // Powiadomienie dla adminów o nowym koncie
      this.notifyAdminsAboutNewUser(user);
    }

    localStorage.setItem('logged_in_user', JSON.stringify(user));
    return user;
  },

  notifyAdminsAboutNewUser(newUser: User) {
    const admins = this.getAll().filter(u => u.rola === 'admin');
    admins.forEach(admin => {
      NotificationService.add({
        title: 'Nowe konto w systemie',
        message: `Użytkownik ${newUser.imie} ${newUser.nazwisko} (${newUser.email}) zarejestrował się jako gość.`,
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