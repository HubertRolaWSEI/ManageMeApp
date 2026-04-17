import { useState, useMemo, useEffect, useCallback } from 'react';
import { auth, googleProvider } from "./lib/firebase"; // To musi wskazywać na Twój plik lib/firebase.ts
import { signInWithPopup, signOut } from "firebase/auth"; // To są funkcje z biblioteki
import { ProjectService } from './services/ProjectService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import { UserService } from './services/UserService';
import { NotificationService } from './services/NotificationService';
import { useTheme } from './hooks/useTheme';

// Importy komponentów UI
import { Header } from './components/Header';
import { NotificationPopup } from './components/NotificationPopup';
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card"; // Teraz zostaną użyte
import { Button } from "./components/ui/button";
import { Clock, ShieldX } from "lucide-react";

// Importy widoków
import { ProjectsView } from './components/views/ProjectsView';
import { StoriesView } from './components/views/StoriesView';
import { KanbanView } from './components/views/KanbanView';
import { TasksView } from './components/views/TasksView';
import { TaskDetailView } from './components/views/TaskDetailView';
import { NotificationsView } from './components/views/NotificationsView';
import { UsersView } from './components/views/UsersView';

import type { Project, Story, Task, User, AppNotification, View } from './types'; // Jawny import typów (błąd 1484)

export default function App() {
  const { dark, toggle } = useTheme();
  
  // Stan Użytkownika i Nawigacji
  const [currentUser, setCurrentUser] = useState<User | null>(() => UserService.getLoggedInUser());
  const [view, setView] = useState<View>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => ProjectService.getActiveProjectId());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Stan Danych
  const [projects, setProjects] = useState<Project[]>(() => ProjectService.getAll());
  const [stories, setStories] = useState<Story[]>(() => StoryService.getAll());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [popupNotification, setPopupNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper do pobierania nazwy użytkownika (naprawia błąd 2304)
  const getUserName = useCallback((id?: string) => {
    if (!id) return '—';
    const allUsers = UserService.getAll();
    const u = allUsers.find(user => user.id === id);
    return u ? `${u.imie} ${u.nazwisko}` : id;
  }, []);

  // Wartości obliczane
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const activeStory = useMemo(() => stories.find(s => s.id === activeStoryId), [stories, activeStoryId]);
  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const filteredStories = useMemo(() => stories.filter(s => s.projektId === activeProjectId), [stories, activeProjectId]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // Odświeżanie danych
  const refreshNotifications = useCallback(() => {
    if (currentUser) setNotifications(NotificationService.getForUser(currentUser.id));
  }, [currentUser]);

  const refreshStories = useCallback(() => setStories(StoryService.getAll()), []);
  
  const refreshTasks = useCallback(async () => {
    if (!activeStoryId) return;
    setLoading(true);
    const data = await TaskService.fetchByStory(activeStoryId);
    setTasks(prev => [...prev.filter(t => t.historijaId !== activeStoryId), ...data]);
    setLoading(false);
  }, [activeStoryId]);

  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);
  useEffect(() => { if (activeStoryId) refreshTasks(); }, [activeStoryId, refreshTasks]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const n = e.detail as AppNotification;
      if (currentUser && n.recipientId === currentUser.id) {
        refreshNotifications();
        if (n.priority === 'high' || n.priority === 'medium') {
          setPopupNotification(n);
          setTimeout(() => setPopupNotification(null), 6000);
        }
      }
    };
    window.addEventListener('app-new-notification', handleNewNotification);
    return () => window.removeEventListener('app-new-notification', handleNewNotification);
  }, [currentUser, refreshNotifications]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = UserService.handleAuthUser(result.user);
      setCurrentUser(user);
    } catch (error) {
      console.error("Błąd logowania:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    UserService.logout();
    setCurrentUser(null);
    setActiveProjectId(null);
    setView('projects');
  };

  // --- EKRAN LOGOWANIA (Używa CardHeader, CardTitle, CardContent) ---
  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-600">ManageMe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-slate-500 mb-4">Zaloguj się przez Google, aby kontynuować</p>
            <Button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Zaloguj przez Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- EKRAN BLOKADY ---
  if (currentUser.blocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
        <ShieldX className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900">Konto zablokowane</h2>
        <p className="text-red-700 mt-2 text-sm">Twoje uprawnienia zostały cofnięte przez administratora.</p>
        <Button variant="outline" className="mt-6 border-red-200" onClick={handleLogout}>Wyloguj</Button>
      </div>
    );
  }

  // --- EKRAN GOŚCIA ---
  if (currentUser.rola === 'guest') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <Clock className="h-16 w-16 text-orange-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Oczekiwanie na zatwierdzenie</h2>
        <p className="text-slate-500 mt-2 text-sm">Twoje konto posiada rolę Gość. Administrator musi nadać Ci rolę pracownika.</p>
        <Button variant="outline" className="mt-8" onClick={handleLogout}>Wyloguj</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors`}>
      <div className="p-4 md:p-8 text-slate-900 dark:text-slate-100">
        
        <NotificationPopup 
          notification={popupNotification} 
          onClose={() => setPopupNotification(null)}
          onView={(id) => { 
            NotificationService.markAsRead(id); 
            setView('notifications'); 
            refreshNotifications(); 
          }}
        />

        <div className="mx-auto max-w-6xl">
          <Header 
            dark={dark} toggleTheme={toggle} view={view} setView={setView} 
            unreadCount={unreadCount} currentUser={currentUser} activeProject={activeProject}
            onHome={() => { setView('projects'); setActiveProjectId(null); }}
            onLogout={handleLogout}
          />

          <main className="mt-6">
            {view === 'users-list' && currentUser.rola === 'admin' && (
              <UsersView 
                users={UserService.getAll()} 
                currentUser={currentUser}
                onUpdateUser={(u) => { UserService.updateUser(u); refreshNotifications(); }} 
              />
            )}

            {view === 'projects' && (
              <ProjectsView 
                projects={projects} 
                onAdd={(f) => { ProjectService.add(f); setProjects(ProjectService.getAll()); }}
                onUpdate={(p) => { ProjectService.update(p); setProjects(ProjectService.getAll()); }}
                onDelete={(id) => { ProjectService.delete(id); setProjects(ProjectService.getAll()); }}
                onSelect={(id) => { 
                  ProjectService.setActiveProjectId(id); 
                  setActiveProjectId(id); 
                  setView('stories'); 
                }}
              />
            )}

            {view === 'stories' && (
              <StoriesView 
                stories={filteredStories}
                onAdd={(f) => { 
                  if (activeProjectId) {
                    StoryService.add({...f, projektId: activeProjectId, wlascicielId: currentUser.id}); 
                    refreshStories(); 
                  }
                }}
                onUpdate={(s) => { StoryService.update(s); refreshStories(); }}
                onDelete={(id) => { StoryService.delete(id); refreshStories(); }}
                onViewTasks={(id) => { setActiveStoryId(id); setView('tasks'); }}
              />
            )}

            {view === 'tasks' && activeStory && (
              <TasksView 
                story={activeStory} 
                tasks={tasks.filter(t => t.historijaId === activeStoryId)}
                loading={loading} 
                onBack={() => setView('stories')}
                onAddTask={async (f) => { 
                  if (activeStoryId) {
                    await TaskService.create({...f, historijaId: activeStoryId, stan: 'todo'}); 
                    refreshTasks(); 
                  }
                }}
                onDeleteTask={async (id) => { await TaskService.delete(id); refreshTasks(); }}
                onViewDetail={(id) => { setActiveTaskId(id); setView('task-detail'); }}
                getUserName={getUserName}
              />
            )}

            {view === 'task-detail' && activeTask && (
              <TaskDetailView 
                task={activeTask} 
                assignableUsers={UserService.getAll().filter(u => u.rola !== 'guest' && !u.blocked)}
                onBack={() => setView('tasks')}
                onAssign={async (uid) => { await TaskService.assignUser(activeTask.id, uid); refreshTasks(); }}
                onMarkDone={async (h) => { await TaskService.markDone(activeTask.id, h); refreshTasks(); setView('tasks'); }}
                getUserName={getUserName}
              />
            )}

            {view === 'kanban' && (
              <KanbanView 
                projectName={activeProject?.nazwa} 
                stories={stories}
                tasks={tasks.filter(t => filteredStories.some(s => s.id === t.historijaId))}
                onTaskClick={(sid, tid) => { setActiveStoryId(sid); setActiveTaskId(tid); setView('task-detail'); }}
              />
            )}

            {view === 'notifications' && (
              <NotificationsView 
                notifications={notifications} 
                onMarkAllRead={() => { NotificationService.markAllAsRead(currentUser.id); refreshNotifications(); }}
                onSelect={(id) => { NotificationService.markAsRead(id); refreshNotifications(); }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}