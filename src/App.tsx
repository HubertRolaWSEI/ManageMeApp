import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  DATA_STORAGE_MODE,
  getDataStorageMode,
  setDataStorageMode,
  type DataStorageMode,
} from './config/dataStorage';
import { Header } from './components/Header';
import { NotificationPopup } from './components/NotificationPopup';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { KanbanView } from './components/views/KanbanView';
import { NotificationsView } from './components/views/NotificationsView';
import { ProjectsView } from './components/views/ProjectsView';
import { StoriesView } from './components/views/StoriesView';
import { TaskDetailView } from './components/views/TaskDetailView';
import { TasksView } from './components/views/TasksView';
import { UsersView } from './components/views/UsersView';
import { useTheme } from './hooks/useTheme';
import { auth, googleProvider } from './lib/firebase';
import { NotificationService } from './services/NotificationService';
import { ProjectService } from './services/ProjectService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import { UserService } from './services/UserService';
import type { AppNotification, Project, Story, Task, User, View } from './types';
import { Clock, ShieldX } from 'lucide-react';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Nieznany błąd.';
};

export default function App() {
  const { dark, toggle } = useTheme();

  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [storageMode, setStorageModeState] = useState<DataStorageMode>(() => getDataStorageMode());

  const [view, setView] = useState<View>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => ProjectService.getActiveProjectId());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [popupNotification, setPopupNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setAllUsers(await UserService.fetchAll());
  }, []);

  const refreshProjects = useCallback(async () => {
    setProjects(await ProjectService.fetchAll());
  }, []);

  const refreshStories = useCallback(async () => {
    setStories(await StoryService.fetchAll());
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const data = await NotificationService.getForUser(currentUser.id);
    setNotifications(data);
  }, [currentUser]);

  const refreshTasks = useCallback(async () => {
    if (!activeStoryId) {
      setTasks([]);
      return;
    }

    setLoading(true);
    try {
      const data = await TaskService.fetchByStory(activeStoryId);
      setTasks((previous) => [
        ...previous.filter((task) => task.historijaId !== activeStoryId),
        ...data,
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeStoryId]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (mounted) setBootstrapLoading(true);
      try {
        const [user, users, loadedProjects, loadedStories] = await Promise.all([
          UserService.getLoggedInUser(),
          UserService.fetchAll(),
          ProjectService.fetchAll(),
          StoryService.fetchAll(),
        ]);

        if (!mounted) return;

        setCurrentUser(user);
        setAllUsers(users);
        setProjects(loadedProjects);
        setStories(loadedStories);
      } finally {
        if (mounted) setBootstrapLoading(false);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [storageMode]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    const handler = (event: Event) => {
      const typedEvent = event as CustomEvent<AppNotification>;
      const notification = typedEvent.detail;
      if (!notification || !currentUser) return;
      if (notification.recipientId !== currentUser.id) return;

      setPopupNotification(notification);
      void refreshNotifications();
    };

    window.addEventListener('app-new-notification', handler as EventListener);
    return () => window.removeEventListener('app-new-notification', handler as EventListener);
  }, [currentUser, refreshNotifications]);

  const getUserName = useCallback(
    (id?: string) => {
      if (!id) return '—';
      const found = allUsers.find((user) => user.id === id);
      return found ? `${found.imie} ${found.nazwisko}` : id;
    },
    [allUsers],
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [projects, activeProjectId],
  );
  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeStoryId),
    [stories, activeStoryId],
  );
  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId),
    [tasks, activeTaskId],
  );
  const filteredStories = useMemo(
    () => stories.filter((story) => story.projektId === activeProjectId),
    [stories, activeProjectId],
  );
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = await UserService.handleAuthUser(result.user);
      setCurrentUser(user);
      await refreshUsers();
      await refreshNotifications();
    } catch (error) {
      setAuthError(toErrorMessage(error));
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(result.user, { displayName });
        const user = await UserService.handleAuthUser(result.user, displayName);
        setCurrentUser(user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = await UserService.handleAuthUser(result.user);
        setCurrentUser(user);
      }

      await refreshUsers();
      await refreshNotifications();
    } catch (error) {
      setAuthError(`Błąd: ${toErrorMessage(error)}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    UserService.logout();
    setCurrentUser(null);
    setView('projects');
    setNotifications([]);
    setTasks([]);
  };

  const handleStorageModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as DataStorageMode;
    setDataStorageMode(nextMode);
    setStorageModeState(nextMode);
  };

  if (bootstrapLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardContent className="p-6 text-center text-sm text-slate-500">
            Ładowanie danych aplikacji...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-indigo-600">ManageMe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
              {isRegistering && (
                <input
                  type="text"
                  placeholder="Imię i Nazwisko"
                  className="w-full p-2 border rounded-md dark:bg-slate-800"
                  value={displayName}
                  onChange={(inputEvent) => setDisplayName(inputEvent.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="E-mail"
                className="w-full p-2 border rounded-md dark:bg-slate-800"
                value={email}
                onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Hasło"
                className="w-full p-2 border rounded-md dark:bg-slate-800"
                value={password}
                onChange={(inputEvent) => setPassword(inputEvent.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                {isRegistering ? 'Zarejestruj się' : 'Zaloguj e-mailem'}
              </Button>
            </form>
            <div className="relative py-2 text-center text-xs uppercase text-slate-400">
              <span className="bg-white dark:bg-slate-900 px-2 relative z-10">Lub</span>
              <div className="absolute inset-y-1/2 w-full border-t"></div>
            </div>
            <Button onClick={handleGoogleLogin} variant="outline" className="w-full mt-2">
              Zaloguj przez Google
            </Button>
            {authError && <p className="text-red-500 text-[10px] mt-2 text-center">{authError}</p>}
            <button
              onClick={() => setIsRegistering((value) => !value)}
              className="w-full mt-4 text-sm text-indigo-600 hover:underline"
            >
              {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </button>
            <div className="mt-3">
              <label className="block text-[10px] text-slate-400 text-center mb-1">Storage</label>
              <select
                value={storageMode}
                onChange={handleStorageModeChange}
                className="w-full h-9 rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800"
              >
                <option value="firebase">Firebase (Firestore)</option>
                <option value="localStorage">LocalStorage</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                Domyślny z .env: {DATA_STORAGE_MODE}
              </p>
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
        <Button variant="outline" className="mt-4" onClick={() => void handleLogout()}>
          Wyloguj
        </Button>
      </div>
    );
  }

  if (currentUser.rola === 'guest') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
        <Clock className="h-16 w-16 text-orange-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Oczekiwanie na zatwierdzenie</h2>
        <p className="text-slate-500 text-sm mt-2">Administrator musi nadać Ci rolę pracownika.</p>
        <Button variant="outline" className="mt-8" onClick={() => void handleLogout()}>
          Wyloguj
        </Button>
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
            void (async () => {
              await NotificationService.markAsRead(id);
              setView('notifications');
              await refreshNotifications();
            })();
          }}
        />
        <div className="mx-auto max-w-6xl">
          <Header
            dark={dark}
            toggleTheme={toggle}
            view={view}
            setView={setView}
            unreadCount={unreadCount}
            currentUser={currentUser}
            activeProject={activeProject}
            onHome={() => {
              setView('projects');
              setActiveProjectId(null);
            }}
            onLogout={() => void handleLogout()}
          />
          <main className="mt-6">
            {view === 'users-list' && currentUser.rola === 'admin' && (
              <UsersView
                users={allUsers}
                currentUser={currentUser}
                onUpdateUser={(updatedUser) => {
                  void (async () => {
                    await UserService.updateUser(updatedUser);
                    await refreshUsers();
                  })();
                }}
              />
            )}
            {view === 'projects' && (
              <ProjectsView
                projects={projects}
                onAdd={(form) => {
                  void (async () => {
                    await ProjectService.add(form);
                    await refreshProjects();
                    await refreshNotifications();
                  })();
                }}
                onSelect={(id) => {
                  ProjectService.setActiveProjectId(id);
                  setActiveProjectId(id);
                  setView('stories');
                }}
                onUpdate={(project) => {
                  void (async () => {
                    await ProjectService.update(project);
                    await refreshProjects();
                  })();
                }}
                onDelete={(id) => {
                  void (async () => {
                    await ProjectService.delete(id);
                    await refreshProjects();
                  })();
                }}
              />
            )}
            {view === 'stories' && (
              <StoriesView
                stories={filteredStories}
                onAdd={(form) => {
                  if (!activeProjectId) return;
                  void (async () => {
                    await StoryService.add({ ...form, projektId: activeProjectId, wlascicielId: currentUser.id });
                    await refreshStories();
                  })();
                }}
                onViewTasks={(id) => {
                  setActiveStoryId(id);
                  setView('tasks');
                }}
                onUpdate={(story) => {
                  void (async () => {
                    await StoryService.update(story);
                    await refreshStories();
                  })();
                }}
                onDelete={(id) => {
                  void (async () => {
                    await StoryService.delete(id);
                    await refreshStories();
                  })();
                }}
              />
            )}
            {view === 'tasks' && activeStory && (
              <TasksView
                story={activeStory}
                tasks={tasks.filter((task) => task.historijaId === activeStoryId)}
                loading={loading}
                onBack={() => setView('stories')}
                onAddTask={(form) => {
                  if (!activeStoryId) return;
                  void (async () => {
                    await TaskService.create({ ...form, historijaId: activeStoryId, stan: 'todo' });
                    await refreshTasks();
                    await refreshStories();
                    await refreshNotifications();
                  })();
                }}
                onDeleteTask={(id) => {
                  void (async () => {
                    await TaskService.delete(id);
                    await refreshTasks();
                    await refreshStories();
                    await refreshNotifications();
                  })();
                }}
                onViewDetail={(id) => {
                  setActiveTaskId(id);
                  setView('task-detail');
                }}
                getUserName={getUserName}
              />
            )}
            {view === 'task-detail' && activeTask && (
              <TaskDetailView
                task={activeTask}
                assignableUsers={allUsers.filter((user) => user.rola !== 'guest' && !user.blocked)}
                onBack={() => setView('tasks')}
                onAssign={(userId) => {
                  void (async () => {
                    await TaskService.assignUser(activeTask.id, userId);
                    await refreshTasks();
                    await refreshStories();
                    await refreshNotifications();
                  })();
                }}
                onMarkDone={(hours) => {
                  void (async () => {
                    await TaskService.markDone(activeTask.id, hours);
                    await refreshTasks();
                    await refreshStories();
                    await refreshNotifications();
                    setView('tasks');
                  })();
                }}
                getUserName={getUserName}
              />
            )}
            {view === 'kanban' && (
              <KanbanView
                projectName={activeProject?.nazwa}
                stories={stories}
                tasks={tasks.filter((task) => filteredStories.some((story) => story.id === task.historijaId))}
                onTaskClick={(storyId, taskId) => {
                  setActiveStoryId(storyId);
                  setActiveTaskId(taskId);
                  setView('task-detail');
                }}
              />
            )}
            {view === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                onMarkAllRead={() => {
                  void (async () => {
                    await NotificationService.markAllAsRead(currentUser.id);
                    await refreshNotifications();
                  })();
                }}
                onSelect={(id) => {
                  void (async () => {
                    await NotificationService.markAsRead(id);
                    await refreshNotifications();
                  })();
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
