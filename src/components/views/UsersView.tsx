import type { User, UserRole } from '../../types'; // Naprawia błąd 1484
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ShieldAlert, UserX, UserCheck } from "lucide-react";

interface Props {
  users: User[];
  currentUser: User;
  onUpdateUser: (u: User) => void;
}

export function UsersView({ users, currentUser, onUpdateUser }: Props) {
  const roles: UserRole[] = ['admin', 'developer', 'devops', 'guest'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ShieldAlert className="text-indigo-600" /> Zarządzanie Użytkownikami
      </h2>
      <div className="grid gap-4">
        {users.map(u => (
          <Card key={u.id} className={u.blocked ? "opacity-60 bg-slate-50" : "bg-white dark:bg-slate-800"}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{u.imie} {u.nazwisko} {u.id === currentUser.id && "(Ty)"}</p>
                <p className="text-sm text-slate-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <select 
                  className="h-9 rounded-md border text-sm px-2 bg-transparent"
                  value={u.rola}
                  onChange={(e) => onUpdateUser({...u, rola: e.target.value as UserRole})}
                  disabled={u.id === currentUser.id}
                >
                  {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
                
                <Button 
                  variant={u.blocked ? "outline" : "destructive"} 
                  size="sm"
                  onClick={() => onUpdateUser({...u, blocked: !u.blocked})}
                  disabled={u.id === currentUser.id}
                >
                  {u.blocked ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                  {u.blocked ? "Odblokuj" : "Zablokuj"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}