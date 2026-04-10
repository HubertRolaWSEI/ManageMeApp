import { useState, useMemo, useEffect, useCallback } from 'react';
import type { 
  Project, Story, Task, User, StoryPriority, StoryStatus, 
  TaskPriority, TaskStatus, AppNotification // Usunięto NotificationPriority
} from './types';
import { ProjectService } from './services/ProjectService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import { UserService } from './services/UserService';
import { NotificationService } from './services/NotificationService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil, Trash2, LayoutDashboard, User as UserIcon,
  CheckCircle2, Clock, PlayCircle, Plus, ArrowLeft,
  Kanban, ListTodo, ChevronRight, UserCheck, Timer, Sun, Moon,
  Bell, X // Usunięto Info
} from "lucide-react";

// --- Typy Widoków ---
type View = 'projects' | 'stories' | 'tasks' | 'task-detail' | 'kanban' | 'notifications' | 'notification-detail';

// --- Hook Motywu ---
function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

const PRIORITY_BADGE: Record<string, string> = {
  wysoki: 'bg-red-100 text-red-600',
  średni: 'bg-orange-100 text-orange-600',
  niski: 'bg-green-100 text-green-600',
  high: 'bg-red-100 text-red-600',
  medium: 'bg-orange-100 text-orange-600',
  low: 'bg-green-100 text-green-600',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  developer: 'bg-blue-100 text-blue-700',
  devops: 'bg-teal-100 text-teal-700',
};

const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString('pl-PL') : '—';

export default function App() {
  const { dark, toggle } = useTheme();

  // -- Dane Użytkownika --
  const [currentUser] = useState<User>(() => UserService.getLoggedInUser());
  const allUsers = useMemo(() => UserService.getAll(), []);
  const assignableUsers = useMemo(() => UserService.getAssignable(), []);

  // -- Główne Stany --
  const [projects, setProjects] = useState<Project[]>(() => ProjectService.getAll());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => ProjectService.getActiveProjectId());
  const [stories, setStories] = useState<Story[]>(() => StoryService.getAll());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // -- Nawigacja i Aktywne Elementy --
  const [view, setView] = useState<View>('projects');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [popupNotification, setPopupNotification] = useState<AppNotification | null>(null);

  // -- Formularze --
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ nazwa: '', opis: '' });
  const [storyForm, setStoryForm] = useState({ nazwa: '', opis: '', priorytet: 'średni' as StoryPriority, stan: 'todo' as StoryStatus });
  const [taskForm, setTaskForm] = useState({ nazwa: '', opis: '', priorytet: 'średni' as TaskPriority, przewidywanyCzas: 1 });

  const [showDoneModal, setShowDoneModal] = useState(false);
  const [doneHours, setDoneHours] = useState(0);
  const [assignUserId, setAssignUserId] = useState('');

  // -- Memos --
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const activeStory = useMemo(() => stories.find(s => s.id === activeStoryId), [stories, activeStoryId]);
  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const activeNotification = useMemo(() => notifications.find(n => n.id === activeNotificationId), [notifications, activeNotificationId]);
  
  const filteredStories = useMemo(() => stories.filter(s => s.projektId === activeProjectId), [stories, activeProjectId]);
  const storyTasks = useMemo(() => tasks.filter(t => t.historijaId === activeStoryId), [tasks, activeStoryId]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // -- Funkcje Odświeżające --
  const refreshStories = useCallback(() => setStories(StoryService.getAll()), []);
  const refreshNotifications = useCallback(() => setNotifications(NotificationService.getForUser(currentUser.id)), [currentUser.id]);
  
  const refreshTasks = useCallback(async () => {
    if (!activeStoryId) return;
    setLoading(true);
    const data = await TaskService.fetchByStory(activeStoryId);
    setTasks(prev => [...prev.filter(t => t.historijaId !== activeStoryId), ...data]);
    setLoading(false);
  }, [activeStoryId]);

  // -- Efekty --
  useEffect(() => { if (activeStoryId) refreshTasks(); }, [activeStoryId, refreshTasks]);
  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);

  // Listener dla nowych powiadomień (Popup)
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const notification = e.detail as AppNotification;
      if (notification.recipientId === currentUser.id) {
        refreshNotifications();
        if (notification.priority === 'high' || notification.priority === 'medium') {
          setPopupNotification(notification);
          setTimeout(() => setPopupNotification(null), 6000);
        }
      }
    };
    window.addEventListener('app-new-notification', handleNewNotification);
    return () => window.removeEventListener('app-new-notification', handleNewNotification);
  }, [currentUser.id, refreshNotifications]);

  const loadAllTasks = useCallback(async () => {
    setLoading(true);
    const data = await TaskService.fetchAll();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (view === 'kanban') loadAllTasks(); }, [view, loadAllTasks]);

  // --- Handlery Akcji ---

  // Projekty
  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.nazwa) return;
    if (editingProject) { 
      ProjectService.update({ ...editingProject, ...projectForm }); 
      setEditingProject(null); 
    } else { 
      const newProj = ProjectService.add(projectForm);
      // Wyzwalanie powiadomienia dla adminów (przykład logiki serwisu w App)
      UserService.getAll().filter(u => u.rola === 'admin').forEach(admin => {
        NotificationService.add({
          title: 'Nowy Projekt',
          message: `Utworzono projekt: ${newProj.nazwa}`,
          priority: 'high',
          recipientId: admin.id
        });
      });
    }
    setProjectForm({ nazwa: '', opis: '' });
    setProjects(ProjectService.getAll());
    refreshNotifications();
  };

  const handleSelectProject = (id: string) => {
    ProjectService.setActiveProjectId(id);
    setActiveProjectId(id);
    setView('stories');
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Usunąć ten projekt?')) { ProjectService.delete(id); setProjects(ProjectService.getAll()); }
  };

  // Historyjki
  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.nazwa || !activeProjectId) return;
    if (editingStory) { StoryService.update({ ...editingStory, ...storyForm }); setEditingStory(null); }
    else StoryService.add({ ...storyForm, projektId: activeProjectId, wlascicielId: currentUser.id });
    setStoryForm({ nazwa: '', opis: '', priorytet: 'średni', stan: 'todo' });
    refreshStories();
  };

  // Zadania
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.nazwa || !activeStoryId) return;
    
    if (editingTask) { 
      await TaskService.update({ ...editingTask, ...taskForm }); 
      setEditingTask(null); 
    } else { 
      const newTask = await TaskService.create({ ...taskForm, historijaId: activeStoryId, stan: 'todo' });
      // Powiadomienie: Nowe zadanie w historyjce (właściciel historyjki)
      if (activeStory) {
        NotificationService.add({
          title: 'Nowe zadanie w historyjce',
          message: `Do "${activeStory.nazwa}" dodano zadanie: ${newTask.nazwa}`,
          priority: 'medium',
          recipientId: activeStory.wlascicielId
        });
      }
    }
    setTaskForm({ nazwa: '', opis: '', priorytet: 'średni', przewidywanyCzas: 1 });
    setShowTaskForm(false);
    await refreshTasks();
    refreshNotifications();
  };

  const handleDeleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (window.confirm('Usunąć to zadanie?')) {
      await TaskService.delete(id);
      if (task && activeStory) {
        NotificationService.add({
          title: 'Zadanie usunięte',
          message: `Z historyjki "${activeStory.nazwa}" usunięto zadanie: ${task.nazwa}`,
          priority: 'medium',
          recipientId: activeStory.wlascicielId
        });
      }
      await refreshTasks();
      refreshStories();
      refreshNotifications();
    }
  };

  const handleAssignUser = async () => {
    if (!activeTaskId || !assignUserId || !activeTask) return;
    await TaskService.assignUser(activeTaskId, assignUserId);
    
    // Powiadomienie: Przypisanie do zadania
    NotificationService.add({
      title: 'Nowe przypisanie',
      message: `Zostałeś przypisany do zadania: ${activeTask.nazwa}`,
      priority: 'high',
      recipientId: assignUserId
    });

    await refreshTasks();
    refreshStories();
    refreshNotifications();
    setAssignUserId('');
  };

  const handleMarkDone = async () => {
    if (!activeTaskId || !activeTask) return;
    await TaskService.markDone(activeTaskId, doneHours);
    
    // Powiadomienie: Status DONE
    if (activeStory) {
      NotificationService.add({
        title: 'Zadanie ukończone',
        message: `Zadanie "${activeTask.nazwa}" w historyjce "${activeStory.nazwa}" ma status DONE`,
        priority: 'medium',
        recipientId: activeStory.wlascicielId
      });
    }

    await refreshTasks();
    refreshStories();
    refreshNotifications();
    setShowDoneModal(false);
    setDoneHours(0);
  };

  // Powiadomienia
  const handleViewNotification = (id: string) => {
    NotificationService.markAsRead(id);
    setActiveNotificationId(id);
    setView('notification-detail');
    refreshNotifications();
  };

  const getUserName = (id?: string) => {
    if (!id) return '—';
    const u = allUsers.find(u => u.id === id);
    return u ? `${u.imie} ${u.nazwisko} (${u.rola})` : id;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* --- POPUP POWIADOMIENIA --- */}
      {popupNotification && (
        <div className="fixed top-6 right-6 z-[100] w-80 animate-in fade-in slide-in-from-right-4 duration-300">
          <Card className={`border-l-4 shadow-xl ${popupNotification.priority === 'high' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Powiadomienie</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPopupNotification(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm font-bold truncate">{popupNotification.title}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{popupNotification.message}</p>
            </CardContent>
            <CardFooter className="py-2 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <Button size="sm" className="h-7 text-xs" onClick={() => { handleViewNotification(popupNotification.id); setPopupNotification(null); }}>
                Zobacz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">ManageMe</h1>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className={`cursor-pointer hover:text-indigo-600 ${view === 'projects' ? 'text-indigo-600 font-semibold' : ''}`}
                  onClick={() => { setView('projects'); setActiveProjectId(null); }}>Projekty</span>
                {activeProject && (<>
                  <ChevronRight className="h-3 w-3" />
                  <span className={`cursor-pointer hover:text-indigo-600 ${(view === 'stories' || view === 'kanban') ? 'text-indigo-600 font-semibold' : ''}`}
                    onClick={() => setView('stories')}>{activeProject.nazwa}</span>
                </>)}
                {view.startsWith('notification') && (<>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-indigo-600 font-semibold">Powiadomienia</span>
                </>)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={toggle} className="h-9 w-9 p-0">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* IKONA POWIADOMIEŃ Z LICZNIKIEM */}
            <div className="relative cursor-pointer group" onClick={() => setView('notifications')}>
              <div className={`p-2 rounded-full transition-colors ${view === 'notifications' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}>
                <Bell className="h-5 w-5" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>

            {activeProjectId && !view.startsWith('notification') && (
              <Button variant="outline" size="sm" onClick={() => setView(view === 'kanban' ? 'stories' : 'kanban')} className="gap-2">
                {view === 'kanban' ? <ListTodo className="h-4 w-4" /> : <Kanban className="h-4 w-4" />}
                {view === 'kanban' ? 'Lista' : 'Kanban'}
              </Button>
            )}

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-sm font-semibold">{currentUser.imie} {currentUser.nazwisko}</span>
                <span className={`text-[9px] uppercase font-bold mt-0.5 ${ROLE_BADGE[currentUser.rola].replace('bg-', 'text-')}`}>{currentUser.rola}</span>
              </div>
            </div>
          </div>
        </header>

        {/* --- WIDOK POWIADOMIEŃ --- */}
        {view === 'notifications' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Powiadomienia</h2>
              <Button variant="ghost" size="sm" onClick={() => { NotificationService.markAllAsRead(currentUser.id); refreshNotifications(); }}>
                Oznacz wszystkie jako przeczytane
              </Button>
            </div>
            <div className="space-y-3">
              {notifications.map(n => (
                <Card key={n.id} 
                  className={`cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!n.isRead ? 'border-indigo-300 bg-indigo-50/20' : ''}`}
                  onClick={() => handleViewNotification(n.id)}>
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-indigo-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`font-semibold truncate ${!n.isRead ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{fmt(n.date)}</span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_BADGE[n.priority]}`}>
                      {n.priority}
                    </span>
                  </CardContent>
                </Card>
              ))}
              {notifications.length === 0 && <p className="text-center text-slate-400 py-12 border-2 border-dashed rounded-lg">Brak powiadomień</p>}
            </div>
          </div>
        )}

        {/* --- SZCZEGÓŁY POWIADOMIENIA --- */}
        {view === 'notification-detail' && activeNotification && (
          <div className="max-w-xl mx-auto space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setView('notifications')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Powrót do listy
            </Button>
            <Card className="shadow-lg overflow-hidden">
              <div className={`h-1 w-full ${PRIORITY_BADGE[activeNotification.priority].split(' ')[0]}`} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{activeNotification.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${PRIORITY_BADGE[activeNotification.priority]}`}>
                    {activeNotification.priority}
                  </span>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {fmt(activeNotification.date)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border text-lg leading-relaxed">
                  {activeNotification.message}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setView('notifications')}>Zamknij</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* PROJECTS */}
        {view === 'projects' && (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit shadow-sm">
              <CardHeader><CardTitle>{editingProject ? 'Edytuj projekt' : 'Nowy projekt'}</CardTitle></CardHeader>
              <form onSubmit={handleProjectSubmit}>
                <CardContent className="space-y-3">
                  <Input placeholder="Nazwa" value={projectForm.nazwa} onChange={e => setProjectForm({ ...projectForm, nazwa: e.target.value })} />
                  <Textarea placeholder="Opis" value={projectForm.opis} onChange={e => setProjectForm({ ...projectForm, opis: e.target.value })} />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">{editingProject ? 'Zapisz' : 'Utwórz projekt'}</Button>
                  {editingProject && <Button variant="ghost" className="w-full" type="button" onClick={() => { setEditingProject(null); setProjectForm({ nazwa: '', opis: '' }); }}>Anuluj</Button>}
                </CardFooter>
              </form>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map(p => (
                <Card key={p.id} className="hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => handleSelectProject(p.id)}>
                  <CardHeader><CardTitle>{p.nazwa}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-500 line-clamp-2">{p.opis}</p></CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={e => { e.stopPropagation(); setEditingProject(p); setProjectForm({ nazwa: p.nazwa, opis: p.opis }); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Edytuj
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {projects.length === 0 && <p className="text-slate-400 text-sm col-span-2">Brak projektów. Utwórz pierwszy!</p>}
            </div>
          </div>
        )}

        {/* STORIES */}
        {view === 'stories' && activeProjectId && (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit shadow-sm">
              <CardHeader><CardTitle>{editingStory ? 'Edytuj historyjkę' : 'Nowa historyjka'}</CardTitle></CardHeader>
              <form onSubmit={handleStorySubmit}>
                <CardContent className="space-y-3">
                  <Input placeholder="Nazwa historyjki" value={storyForm.nazwa} onChange={e => setStoryForm({ ...storyForm, nazwa: e.target.value })} />
                  <Textarea placeholder="Opis" value={storyForm.opis} onChange={e => setStoryForm({ ...storyForm, opis: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <select className="h-10 w-full rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800 dark:text-slate-100" value={storyForm.priorytet} onChange={e => setStoryForm({ ...storyForm, priorytet: e.target.value as StoryPriority })}>
                      <option value="niski">Priorytet: Niski</option>
                      <option value="średni">Priorytet: Średni</option>
                      <option value="wysoki">Priorytet: Wysoki</option>
                    </select>
                    <select className="h-10 w-full rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800 dark:text-slate-100" value={storyForm.stan} onChange={e => setStoryForm({ ...storyForm, stan: e.target.value as StoryStatus })}>
                      <option value="todo">TODO</option>
                      <option value="doing">DOING</option>
                      <option value="done">DONE</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">{editingStory ? 'Zaktualizuj' : 'Dodaj historyjkę'}</Button>
                  {editingStory && <Button variant="ghost" className="w-full" type="button" onClick={() => { setEditingStory(null); setStoryForm({ nazwa: '', opis: '', priorytet: 'średni', stan: 'todo' }); }}>Anuluj</Button>}
                </CardFooter>
              </form>
            </Card>
            <div className="space-y-6">
              {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
                <div key={status}>
                  <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest text-slate-400 mb-3">
                    {status === 'todo' && <Clock className="h-4 w-4" />}
                    {status === 'doing' && <PlayCircle className="h-4 w-4 text-blue-500" />}
                    {status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {status === 'todo' ? 'Czekające' : status === 'doing' ? 'W trakcie' : 'Zamknięte'}
                    <span className="ml-1 text-slate-300">({filteredStories.filter(s => s.stan === status).length})</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredStories.filter(s => s.stan === status).map(story => (
                      <Card key={story.id} className="bg-white dark:bg-slate-800 shadow-sm hover:border-indigo-200 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-bold">{story.nazwa}</CardTitle>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${PRIORITY_BADGE[story.priorytet]}`}>{story.priorytet}</span>
                          </div>
                          <CardDescription className="text-[10px]">Utworzono: {fmt(story.dataUtworzenia)}</CardDescription>
                        </CardHeader>
                        <CardContent><p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{story.opis}</p></CardContent>
                        <CardFooter className="flex gap-2 border-t pt-3">
                          <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8" onClick={() => { setActiveStoryId(story.id); setView('tasks'); }}>Zadania</Button>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => { setEditingStory(story); setStoryForm({ nazwa: story.nazwa, opis: story.opis, priorytet: story.priorytet, stan: story.stan }); }}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50" onClick={() => { StoryService.delete(story.id); refreshStories(); }}><Trash2 className="h-3 w-3" /></Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TASKS */}
        {view === 'tasks' && activeStory && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setView('stories')} className="gap-1"><ArrowLeft className="h-4 w-4" /> Historyjki</Button>
              <div>
                <h2 className="font-bold text-lg">{activeStory.nazwa}</h2>
                <p className="text-sm text-slate-400">{activeStory.opis}</p>
              </div>
            </div>
            <div>
              {!showTaskForm && !editingTask && (
                <Button onClick={() => setShowTaskForm(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Nowe zadanie</Button>
              )}
              {(showTaskForm || editingTask) && (
                <Card className="max-w-lg shadow-sm">
                  <CardHeader><CardTitle>{editingTask ? 'Edytuj zadanie' : 'Nowe zadanie'}</CardTitle></CardHeader>
                  <form onSubmit={handleTaskSubmit}>
                    <CardContent className="space-y-3">
                      <Input placeholder="Nazwa zadania" value={taskForm.nazwa} onChange={e => setTaskForm({ ...taskForm, nazwa: e.target.value })} />
                      <Textarea placeholder="Opis" value={taskForm.opis} onChange={e => setTaskForm({ ...taskForm, opis: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="h-10 rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800 dark:text-slate-100" value={taskForm.priorytet} onChange={e => setTaskForm({ ...taskForm, priorytet: e.target.value as TaskPriority })}>
                          <option value="niski">Priorytet: Niski</option>
                          <option value="średni">Priorytet: Średni</option>
                          <option value="wysoki">Priorytet: Wysoki</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <Input type="number" min={1} placeholder="Godz." value={taskForm.przewidywanyCzas} onChange={e => setTaskForm({ ...taskForm, przewidywanyCzas: Number(e.target.value) })} />
                          <span className="text-sm text-slate-400 whitespace-nowrap">godz.</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">{editingTask ? 'Zapisz' : 'Dodaj'}</Button>
                      <Button variant="ghost" className="flex-1" type="button" onClick={() => { setShowTaskForm(false); setEditingTask(null); setTaskForm({ nazwa: '', opis: '', priorytet: 'średni', przewidywanyCzas: 1 }); }}>Anuluj</Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
            </div>
            {loading && <p className="text-slate-400 text-sm">Ładowanie zadań...</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['todo', 'doing', 'done'] as TaskStatus[]).map(status => (
                <div key={status} className="space-y-3 bg-slate-100/50 dark:bg-slate-800/20 p-3 rounded-lg">
                  <h3 className="font-bold uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2">
                    {status === 'todo' && <Clock className="h-3 w-3" />}
                    {status === 'doing' && <PlayCircle className="h-3 w-3 text-blue-500" />}
                    {status === 'done' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {status === 'todo' ? 'Do zrobienia' : status === 'doing' ? 'W trakcie' : 'Gotowe'}
                    <span className="text-slate-300">({storyTasks.filter(t => t.stan === status).length})</span>
                  </h3>
                  {storyTasks.filter(t => t.stan === status).map(task => (
                    <Card key={task.id} className="bg-white dark:bg-slate-800 shadow-sm hover:border-indigo-200 transition-colors text-sm">
                      <CardHeader className="pb-1 pt-3 px-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-sm leading-tight">{task.nazwa}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${PRIORITY_BADGE[task.priorytet]}`}>{task.priorytet}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 pb-1">
                        <p className="text-xs text-slate-500 line-clamp-2">{task.opis}</p>
                        <p className="text-[10px] text-slate-400 mt-1"><Timer className="h-3 w-3 inline mr-1" />{task.przewidywanyCzas}h est.</p>
                        {task.uzytkownikId && <p className="text-[10px] text-indigo-500 mt-0.5"><UserIcon className="h-3 w-3 inline mr-1" />{getUserName(task.uzytkownikId)}</p>}
                      </CardContent>
                      <CardFooter className="px-3 pb-3 pt-1 flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setActiveTaskId(task.id); setView('task-detail'); }}>Szczegóły</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:bg-red-50" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-3 w-3" /></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TASK DETAIL */}
        {view === 'task-detail' && activeTask && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setView('tasks')} className="gap-1"><ArrowLeft className="h-4 w-4" /> Zadania</Button>
              <h2 className="font-bold text-lg">Szczegóły zadania</h2>
            </div>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{activeTask.nazwa}</CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${PRIORITY_BADGE[activeTask.priorytet]}`}>{activeTask.priorytet}</span>
                </div>
                <CardDescription>{activeTask.opis}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Stan</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTask.stan === 'todo' ? 'bg-slate-200 text-slate-600' : activeTask.stan === 'doing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {activeTask.stan.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Estymacja</p>
                    <p className="font-medium text-xs">{activeTask.przewidywanyCzas}h / {activeTask.zrealizowaneGodziny ?? '—'}h real.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border col-span-2">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Przypisana osoba</p>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      {getUserName(activeTask.uzytkownikId)}
                    </p>
                  </div>
                </div>

                {activeTask.stan === 'todo' && (
                  <div className="border rounded-lg p-4 space-y-3 bg-blue-50/50 dark:bg-blue-900/10">
                    <p className="text-sm font-semibold flex items-center gap-2 text-blue-600"><UserCheck className="h-4 w-4" /> Przypisz osobę</p>
                    <div className="flex gap-2">
                      <select className="flex-1 h-9 rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800 dark:text-slate-100" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                        <option value="">Wybierz osobę...</option>
                        {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.imie} {u.nazwisko} ({u.rola})</option>)}
                      </select>
                      <Button onClick={handleAssignUser} disabled={!assignUserId} className="bg-blue-600 hover:bg-blue-700 h-9">Przypisz</Button>
                    </div>
                  </div>
                )}

                {activeTask.stan === 'doing' && (
                  <div className="border rounded-lg p-4 space-y-3 bg-green-50/50 dark:bg-green-900/10">
                    <p className="text-sm font-semibold flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" /> Zamknij zadanie</p>
                    {!showDoneModal ? (
                      <Button onClick={() => setShowDoneModal(true)} className="bg-green-600 hover:bg-green-700">Oznacz jako DONE</Button>
                    ) : (
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input type="number" min={0} placeholder="Godziny" value={doneHours || ''} onChange={e => setDoneHours(Number(e.target.value))} className="max-w-[100px]" />
                        <Button onClick={handleMarkDone} className="bg-green-600 hover:bg-green-700">Zapisz</Button>
                        <Button variant="ghost" onClick={() => setShowDoneModal(false)}>Anuluj</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* KANBAN */}
        {view === 'kanban' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Kanban className="h-5 w-5 text-indigo-500" />
              <h2 className="font-bold text-lg">Tablica Kanban — {activeProject?.nazwa}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['todo', 'doing', 'done'] as TaskStatus[]).map(status => {
                const projectStoryIds = new Set(filteredStories.map(s => s.id));
                const colTasks = tasks.filter(t => t.stan === status && projectStoryIds.has(t.historijaId));
                return (
                  <div key={status} className="space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${status === 'todo' ? 'bg-slate-200 text-slate-600' : status === 'doing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {status === 'todo' ? 'Do zrobienia' : status === 'doing' ? 'W trakcie' : 'Gotowe'}
                      <span className="ml-auto opacity-60">({colTasks.length})</span>
                    </div>
                    {colTasks.map(task => {
                      const story = stories.find(s => s.id === task.historijaId);
                      return (
                        <Card key={task.id} className="bg-white dark:bg-slate-800 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer text-sm"
                          onClick={() => { setActiveStoryId(task.historijaId); setActiveTaskId(task.id); setView('task-detail'); }}>
                          <CardHeader className="pb-1 pt-3 px-3">
                            <div className="flex justify-between">
                              <span className="font-semibold text-sm">{task.nazwa}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${PRIORITY_BADGE[task.priorytet]}`}>{task.priorytet}</span>
                            </div>
                            {story && <p className="text-[10px] text-indigo-400 mt-0.5">{story.nazwa}</p>}
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            <p className="text-xs text-slate-500 line-clamp-2">{task.opis}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}