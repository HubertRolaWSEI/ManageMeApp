import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '../types';
import { NotificationService } from './NotificationService';
import { readCollection, writeCollection } from './storageEngine';

const SUPER_ADMIN_EMAIL = 'hubert.rola1337@gmail.com';
const LOGGED_IN_USER_KEY = 'logged_in_user';
const STORAGE_KEY = 'app_users';
const COLLECTION = 'users';

const splitDisplayName = (fullName: string) => {
  const [imie, ...nazwiskoParts] = fullName.trim().split(' ');
  return {
    imie: imie || 'User',
    nazwisko: nazwiskoParts.join(' '),
  };
};

export const UserService = {
  async fetchAll(): Promise<User[]> {
    return readCollection<User>(STORAGE_KEY, COLLECTION);
  },

  async saveAll(users: User[]): Promise<void> {
    await writeCollection<User>(STORAGE_KEY, COLLECTION, users);
  },

  async handleAuthUser(firebaseUser: FirebaseUser, customDisplayName?: string): Promise<User> {
    if (!firebaseUser.email) {
      throw new Error('Authenticated Firebase user has no email address.');
    }

    const users = await this.fetchAll();
    let user = users.find((candidate) => candidate.email === firebaseUser.email);

    if (!user) {
      const isSuperAdmin = firebaseUser.email === SUPER_ADMIN_EMAIL;
      const emailLocalPart = firebaseUser.email.split('@')[0];
      const finalDisplayName = customDisplayName || firebaseUser.displayName || emailLocalPart;
      const { imie, nazwisko } = splitDisplayName(finalDisplayName);

      user = {
        id: firebaseUser.uid,
        imie,
        nazwisko,
        email: firebaseUser.email,
        rola: isSuperAdmin ? 'admin' : 'guest',
        blocked: false,
      };

      await this.saveAll([...users, user]);
      await this.notifyAdminsAboutNewUser(user);
    }

    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify({ id: user.id }));
    return user;
  },

  async notifyAdminsAboutNewUser(newUser: User): Promise<void> {
    const admins = (await this.fetchAll()).filter((user) => user.rola === 'admin');
    await Promise.all(
      admins.map((admin) =>
        NotificationService.add({
          title: 'Nowy użytkownik',
          message: `Użytkownik ${newUser.email} zarejestrował się.`,
          priority: 'high',
          recipientId: admin.id,
        }),
      ),
    );
  },

  async getLoggedInUser(): Promise<User | null> {
    const raw = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { id?: string };
      if (!parsed.id) return null;
      const users = await this.fetchAll();
      return users.find((user) => user.id === parsed.id) ?? null;
    } catch {
      return null;
    }
  },

  async updateUser(updatedUser: User): Promise<void> {
    const users = (await this.fetchAll()).map((user) =>
      user.id === updatedUser.id ? updatedUser : user,
    );
    await this.saveAll(users);
  },

  logout(): void {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  },
};
