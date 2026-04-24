import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase";

// Serwisy
import { ProjectService } from './services/ProjectService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import { UserService } from './services/UserService';
import { NotificationService } from './services/NotificationService';
import { useTheme } from './hooks/useTheme';

// UI i Ikony
import { Header } from './components/Header';
import { NotificationPopup } from './components/NotificationPopup';
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Clock, ShieldX } from "lucide-react";

// Widoki
import { ProjectsView } from './components/views/ProjectsView';
import { StoriesView } from './components/views/StoriesView';
import { KanbanView } from './components/views/KanbanView';
import { TasksView } from './components/views/TasksView';
import { TaskDetailView } from './components/views/TaskDetailView';
import { NotificationsView } from './components/views/NotificationsView';
import { UsersView } from './components/views/UsersView';

import { getActiveBackendName } from './lib/storage';
import { setStorageBackend, type StorageBackend } from './config/app-config';

import type { Project, Story, Task, User, AppNotification, View } from './types';

export default function App() {
  const { dark, toggle } = useTheme();
  
  // Stan Użytkownika i Formularza
  const [currentUser, setCurrentUser] = useState<User | null>(() => UserService.getLoggedInUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => UserService.getAll()); // NOWY STAN: Reaktywna lista użytkowników
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  // Stan Danych
  const [view, setView] = useState<View>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => ProjectService.getActiveProjectId());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(() => ProjectService.getAll());
  const [stories, setStories] = useState<Story[]>(() => StoryService.getAll());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [popupNotification, setPopupNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(false);

  // Funkcja odświeżania powiadomień
  const refreshNotifications = useCallback(() => {
    if (currentUser) setNotifications(NotificationService.getForUser(currentUser.id));
  }, [currentUser]);

  const getUserName = useCallback((id?: string) => {
    if (!id) return '—';
    const u = allUsers.find(user => user.id === id); // Używamy allUsers zamiast serwisu
    return u ? `${u.imie} ${u.nazwisko}` : id;
  }, [allUsers]);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const activeStory = useMemo(() => stories.find(s => s.id === activeStoryId), [stories, activeStoryId]);
  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const filteredStories = useMemo(() => stories.filter(s => s.projektId === activeProjectId), [stories, activeProjectId]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // Handlery Auth
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = UserService.handleAuthUser(result.user);
      setCurrentUser(user);
      setAllUsers(UserService.getAll()); // Odświeżamy listę po zalogowaniu
    } catch (err: any) { setAuthError(err.message); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(result.user, { displayName });
        setCurrentUser(UserService.handleAuthUser(result.user, displayName));
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(UserService.handleAuthUser(result.user));
      }
      setAllUsers(UserService.getAll()); // Odświeżamy listę
    } catch (err: any) { setAuthError("Błąd: " + err.message); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    UserService.logout();
    setCurrentUser(null);
    setView('projects');
  };

  const refreshTasks = useCallback(async () => {
    if (!activeStoryId) return;
    setLoading(true);
    const data = await TaskService.fetchByStory(activeStoryId);
    setTasks(prev => [...prev.filter(t => t.historijaId !== activeStoryId), ...data]);
    setLoading(false);
  }, [activeStoryId]);

  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);
  useEffect(() => { if (activeStoryId) refreshTasks(); }, [activeStoryId, refreshTasks]);

  // --- RENDERY (STRAŻNICY) ---

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader><CardTitle className="text-2xl font-bold text-center text-indigo-600">ManageMe</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
              {isRegistering && (
                <input type="text" placeholder="Imię i Nazwisko" className="w-full p-2 border rounded-md dark:bg-slate-800"
                  value={displayName} onChange={e => setDisplayName(e.target.value)} required />
              )}
              <input type="email" placeholder="E-mail" className="w-full p-2 border rounded-md dark:bg-slate-800"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Hasło" className="w-full p-2 border rounded-md dark:bg-slate-800"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full">{isRegistering ? 'Zarejestruj się' : 'Zaloguj e-mailem'}</Button>
            </form>
            <div className="relative py-2 text-center text-xs uppercase text-slate-400">
              <span className="bg-white dark:bg-slate-900 px-2 relative z-10">Lub</span>
              <div className="absolute inset-y-1/2 w-full border-t"></div>
            </div>
            <Button onClick={handleGoogleLogin} variant="outline" className="w-full mt-2">Zaloguj przez Google</Button>
            {authError && <p className="text-red-500 text-[10px] mt-2 text-center">{authError}</p>}
            <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-indigo-600 hover:underline">
              {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </button>
            <div className="mt-4 pt-4 border-t text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Magazyn danych:</span>
                <select
                  value={getActiveBackendName()}
                  onChange={e => {
                    setStorageBackend(e.target.value as StorageBackend);
                    window.location.reload();
                  }}
                  className="text-xs rounded-md border px-2 py-1 bg-white dark:bg-slate-800"
                >
                  <option value="localStorage">localStorage (przeglądarka)</option>
                  <option value="firestore">Firestore (baza NoSQL)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.blocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-4">
        <ShieldX className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900">Konto zablokowane</h2>
        <Button variant="outline" className="mt-4" onClick={handleLogout}>Wyloguj</Button>
      </div>
    );
  }

  if (currentUser.rola === 'guest') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
        <Clock className="h-16 w-16 text-orange-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Oczekiwanie na zatwierdzenie</h2>
        <p className="text-slate-500 text-sm mt-2">Administrator musi nadać Ci rolę pracownika.</p>
        <Button variant="outline" className="mt-8" onClick={handleLogout}>Wyloguj</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors`}>
      <div className="p-4 md:p-8 text-slate-900 dark:text-slate-100">
        <NotificationPopup notification={popupNotification} onClose={() => setPopupNotification(null)}
          onView={(id) => { NotificationService.markAsRead(id); setView('notifications'); refreshNotifications(); } } />
        <div className="mx-auto max-w-6xl">
          <Header dark={dark} toggleTheme={toggle} view={view} setView={setView} unreadCount={unreadCount} 
            currentUser={currentUser} activeProject={activeProject} onHome={() => { setView('projects'); setActiveProjectId(null); }} onLogout={handleLogout} />
          <main className="mt-6">
            {view === 'users-list' && currentUser.rola === 'admin' && (
              <UsersView 
                users={allUsers} 
                currentUser={currentUser} 
                onUpdateUser={u => { 
                  UserService.updateUser(u); 
                  setAllUsers(UserService.getAll()); // ODŚWIEŻENIE LISTY PO ZMIANIE ROLI
                }} 
              />
            )}
            {view === 'projects' && (
              <ProjectsView projects={projects} 
                onAdd={f => { ProjectService.add(f); setProjects(ProjectService.getAll()); }} 
                onSelect={id => { ProjectService.setActiveProjectId(id); setActiveProjectId(id); setView('stories'); }} 
                onUpdate={p => { ProjectService.update(p); setProjects(ProjectService.getAll()); }} 
                onDelete={id => { ProjectService.delete(id); setProjects(ProjectService.getAll()); }} />
            )}
            {view === 'stories' && (
              <StoriesView stories={filteredStories} 
                onAdd={f => { if (activeProjectId) { StoryService.add({...f, projektId: activeProjectId, wlascicielId: currentUser.id}); setStories(StoryService.getAll()); } }} 
                onViewTasks={id => { setActiveStoryId(id); setView('tasks'); }} 
                onUpdate={s => { StoryService.update(s); setStories(StoryService.getAll()); }} 
                onDelete={id => { StoryService.delete(id); setStories(StoryService.getAll()); }} />
            )}
            {view === 'tasks' && activeStory && (
              <TasksView story={activeStory} tasks={tasks.filter(t => t.historijaId === activeStoryId)} loading={loading} onBack={() => setView('stories')} 
                onAddTask={async f => { if (activeStoryId) { await TaskService.create({...f, historijaId: activeStoryId, stan: 'todo'}); refreshTasks(); } }} 
                onDeleteTask={async id => { await TaskService.delete(id); refreshTasks(); }} 
                onViewDetail={id => { setActiveTaskId(id); setView('task-detail'); }} getUserName={getUserName} />
            )}
            {view === 'task-detail' && activeTask && (
              <TaskDetailView task={activeTask} assignableUsers={allUsers.filter(u => u.rola !== 'guest' && !u.blocked)} onBack={() => setView('tasks')} 
                onAssign={async uid => { await TaskService.assignUser(activeTask.id, uid); refreshTasks(); }} 
                onMarkDone={async h => { await TaskService.markDone(activeTask.id, h); refreshTasks(); setView('tasks'); }} getUserName={getUserName} />
            )}
            {view === 'kanban' && (
              <KanbanView projectName={activeProject?.nazwa} stories={stories} tasks={tasks.filter(t => filteredStories.some(s => s.id === t.historijaId))} 
                onTaskClick={(sid, tid) => { setActiveStoryId(sid); setActiveTaskId(tid); setView('task-detail'); }} />
            )}
            {view === 'notifications' && (
              <NotificationsView notifications={notifications} 
                onMarkAllRead={() => { NotificationService.markAllAsRead(currentUser.id); refreshNotifications(); }} 
                onSelect={id => { NotificationService.markAsRead(id); refreshNotifications(); }} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}