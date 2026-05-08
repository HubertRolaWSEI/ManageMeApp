import { LayoutDashboard, Sun, Moon, Bell, ChevronRight, User as UserIcon, Users, LogOut } from "lucide-react"; // Usunięto nieużywane ikony
import { Button } from "./ui/button";
import type { User, Project } from "../types";

interface HeaderProps {
  dark: boolean;
  toggleTheme: () => void;
  view: string;
  setView: (v: any) => void;
  unreadCount: number;
  currentUser: User;
  activeProject?: Project;
  onHome: () => void;
  onLogout: () => void;
}

export function Header({ dark, toggleTheme, view, setView, unreadCount, currentUser, activeProject, onHome, onLogout }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-indigo-600" />
        <div onClick={onHome} className="cursor-pointer">
          <h1 className="text-2xl font-extrabold tracking-tight">ManageMe</h1>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className={view === 'projects' ? 'text-indigo-600 font-semibold' : ''}>Projekty</span>
            {activeProject && (<>
              <ChevronRight className="h-3 w-3" />
              <span className={(view === 'stories' || view === 'kanban') ? 'text-indigo-600 font-semibold' : ''}>{activeProject.nazwa}</span>
            </>)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {currentUser.rola === 'admin' && (
          <Button variant={view === 'users-list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('users-list')}>
            <Users className="h-4 w-4 mr-2" /> Użytkownicy
          </Button>
        )}

        <div className="relative cursor-pointer" onClick={() => setView('notifications')}>
          <div className={`p-2 rounded-full ${view === 'notifications' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
            <Bell className="h-5 w-5" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border">
          <UserIcon className="h-4 w-4 text-slate-400" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold">{currentUser.imie}</span>
            <span className={`text-[9px] uppercase font-bold text-indigo-500`}>{currentUser.rola}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="ml-2 h-7 w-7 p-0 text-red-500">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}