import type { User } from '../types';

const MOCK_USERS: User[] = [
  { id: 'user-admin-1', imie: 'Jan', nazwisko: 'Kowalski', rola: 'admin' },
  { id: 'user-dev-1', imie: 'Anna', nazwisko: 'Nowak', rola: 'developer' },
  { id: 'user-dev-2', imie: 'Piotr', nazwisko: 'Wiśniewski', rola: 'developer' },
  { id: 'user-devops-1', imie: 'Marek', nazwisko: 'Zieliński', rola: 'devops' },
];

export class UserService {
  static getLoggedInUser(): User {
    return MOCK_USERS[0];
  }

  static getAll(): User[] {
    return MOCK_USERS;
  }

  static getById(id: string): User | undefined {
    return MOCK_USERS.find(u => u.id === id);
  }

  static getAssignable(): User[] {
    return MOCK_USERS.filter(u => u.rola === 'developer' || u.rola === 'devops');
  }
}