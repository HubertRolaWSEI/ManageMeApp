import type { User } from '../types';

export class UserService {
  static getLoggedInUser(): User {
    return {
      id: 'user-123',
      imie: 'Jan',
      nazwisko: 'Kowalski'
    };
  }
}