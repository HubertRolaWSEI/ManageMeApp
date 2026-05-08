// src/components/views/UsersView.tsx
import type { User, UserRole } from '../../types';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { UserCog, ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  users: User[];
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

export function UsersView({ users, currentUser, onUpdateUser }: Props) {
  const roles: UserRole[] = ['admin', 'developer', 'devops', 'guest'];

  const handleRoleChange = (user: User, newRole: string) => {
    // Nie pozwól samemu sobie odebrać admina (bezpieczeństwo)
    if (user.id === currentUser.id && newRole !== 'admin') {
      alert("Nie możesz zmienić własnej roli administratora.");
      return;
    }
    onUpdateUser({ ...user, rola: newRole as UserRole });
  };

  const toggleBlock = (user: User) => {
    if (user.id === currentUser.id) return;
    onUpdateUser({ ...user, blocked: !user.blocked });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="h-6 w-6 text-indigo-600" />
        <h2 className="text-2xl font-bold">Zarządzanie Użytkownikami</h2>
      </div>

      <div className="grid gap-4">
        {users.map(user => (
          <Card key={user.id} className={user.blocked ? "opacity-60 bg-slate-50" : ""}>
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg">{user.imie} {user.nazwisko}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* LISTA WYBORU ROLI */}
                <select 
                  value={user.rola}
                  onChange={(e) => handleRoleChange(user, e.target.value)}
                  className="p-2 border rounded-md bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>

                {/* PRZYCISK BLOKADY */}
                <Button 
                  variant={user.blocked ? "outline" : "destructive"}
                  size="sm"
                  disabled={user.id === currentUser.id}
                  onClick={() => toggleBlock(user)}
                  className="flex items-center gap-2"
                >
                  {user.blocked ? (
                    <><ShieldCheck className="h-4 w-4" /> Odblokuj</>
                  ) : (
                    <><ShieldAlert className="h-4 w-4" /> Zablokuj</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}