import { useState, useMemo } from 'react';
import type { Project, Story, User, StoryPriority, StoryStatus } from './types';
import { ProjectService } from './services/ProjectService';
import { StoryService } from './services/StoryService';
import { UserService } from './services/UserService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, LayoutDashboard, User as UserIcon, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export default function App() {
  const [currentUser] = useState<User>(() => UserService.getLoggedInUser());
  const [projects, setProjects] = useState<Project[]>(() => ProjectService.getAll());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => ProjectService.getActiveProjectId());
  const [stories, setStories] = useState<Story[]>(() => StoryService.getAll());
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  
  const [projectForm, setProjectForm] = useState({ nazwa: '', opis: '' });
  const [storyForm, setStoryForm] = useState({ 
    nazwa: '', opis: '', priorytet: 'średni' as StoryPriority, stan: 'todo' as StoryStatus 
  });

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), [projects, activeProjectId]
  );

  const filteredStories = useMemo(() => 
    stories.filter(s => s.projektId === activeProjectId), [stories, activeProjectId]
  );

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.nazwa) return;

    if (editingProject) {
      ProjectService.update({ ...editingProject, ...projectForm });
      setEditingProject(null);
    } else {
      ProjectService.add(projectForm);
    }
    setProjectForm({ nazwa: '', opis: '' });
    setProjects(ProjectService.getAll());
  };

  const handleSelectProject = (id: string | null) => {
    ProjectService.setActiveProjectId(id);
    setActiveProjectId(id);
  };

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.nazwa || !activeProjectId) return;

    if (editingStory) {
      StoryService.update({ ...editingStory, ...storyForm });
      setEditingStory(null);
    } else {
      StoryService.add({ 
        ...storyForm, 
        projektId: activeProjectId, 
        wlascicielId: currentUser.id 
      });
    }
    setStoryForm({ nazwa: '', opis: '', priorytet: 'średni', stan: 'todo' });
    setStories(StoryService.getAll());
  };

  const handleDeleteStory = (id: string) => {
    if (window.confirm("Usunąć tę historyjkę?")) {
      StoryService.delete(id);
      setStories(StoryService.getAll());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">ManageMe</h1>
              {activeProject && (
                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                  <span className="text-slate-400">Projekt:</span> {activeProject.nazwa}
                  <Button variant="ghost" size="sm" onClick={() => handleSelectProject(null)} className="h-6 px-2 text-xs">Zmień</Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-full shadow-sm border">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold">{currentUser.imie} {currentUser.nazwisko}</span>
          </div>
        </header>

        {!activeProjectId ? (
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            <Card className="h-fit shadow-sm">
              <CardHeader><CardTitle>{editingProject ? 'Edytuj projekt' : 'Nowy projekt'}</CardTitle></CardHeader>
              <form onSubmit={handleProjectSubmit}>
                <CardContent className="space-y-4">
                  <Input placeholder="Nazwa" value={projectForm.nazwa} onChange={e => setProjectForm({...projectForm, nazwa: e.target.value})} />
                  <Textarea placeholder="Opis" value={projectForm.opis} onChange={e => setProjectForm({...projectForm, opis: e.target.value})} />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">{editingProject ? 'Zapisz' : 'Utwórz projekt'}</Button>
                  {editingProject && <Button variant="ghost" onClick={() => {setEditingProject(null); setProjectForm({nazwa:'', opis:''})}} className="w-full">Anuluj</Button>}
                </CardFooter>
              </form>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map(p => (
                <Card key={p.id} className="hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => handleSelectProject(p.id)}>
                  <CardHeader><CardTitle>{p.nazwa}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-500 line-clamp-2">{p.opis}</p></CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setEditingProject(p); setProjectForm({nazwa:p.nazwa, opis:p.opis}) }}>Edytuj</Button>
                    <Button variant="secondary" size="sm" className="flex-1">Otwórz</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
              <Card className="h-fit shadow-sm">
                <CardHeader><CardTitle>{editingStory ? 'Edytuj historyjkę' : 'Nowa historyjka'}</CardTitle></CardHeader>
                <form onSubmit={handleStorySubmit}>
                  <CardContent className="space-y-4">
                    <Input placeholder="Nazwa historyjki" value={storyForm.nazwa} onChange={e => setStoryForm({...storyForm, nazwa: e.target.value})} />
                    <Textarea placeholder="Opis" value={storyForm.opis} onChange={e => setStoryForm({...storyForm, opis: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                      <select className="flex h-10 w-full rounded-md border border-input px-3 text-sm bg-white" value={storyForm.priorytet} onChange={e => setStoryForm({...storyForm, priorytet: e.target.value as StoryPriority})}>
                        <option value="niski">Priorytet: Niski</option>
                        <option value="średni">Priorytet: Średni</option>
                        <option value="wysoki">Priorytet: Wysoki</option>
                      </select>
                      <select className="flex h-10 w-full rounded-md border border-input px-3 text-sm bg-white" value={storyForm.stan} onChange={e => setStoryForm({...storyForm, stan: e.target.value as StoryStatus})}>
                        <option value="todo">Status: TODO</option>
                        <option value="doing">Status: DOING</option>
                        <option value="done">Status: DONE</option>
                      </select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">{editingStory ? 'Zaktualizuj' : 'Dodaj historyjkę'}</Button>
                    {editingStory && <Button variant="ghost" onClick={() => {setEditingStory(null); setStoryForm({nazwa:'', opis:'', priorytet:'średni', stan:'todo'})}} className="w-full">Anuluj</Button>}
                  </CardFooter>
                </form>
              </Card>

              <div className="grid gap-6">
                {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
                  <div key={status} className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest text-slate-400">
                      {status === 'todo' && <Clock className="h-4 w-4" />}
                      {status === 'doing' && <PlayCircle className="h-4 w-4 text-blue-500" />}
                      {status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {status === 'todo' ? 'Czekające' : status === 'doing' ? 'W trakcie' : 'Zamknięte'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                      {filteredStories.filter(s => s.stan === status).map(story => (
                        <Card key={story.id} className="bg-white shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg font-bold">{story.nazwa}</CardTitle>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                story.priorytet === 'wysoki' ? 'bg-red-100 text-red-600' : 
                                story.priorytet === 'średni' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                              }`}>{story.priorytet}</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <CardDescription className="text-[10px]">
                                Utworzono: {new Date(story.dataUtworzenia).toLocaleDateString()}
                              </CardDescription>
                              <CardDescription className="text-[10px] font-medium text-indigo-600 flex items-center gap-1">
                                <UserIcon className="h-3 w-3" /> Właściciel: {story.wlascicielId}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-600 line-clamp-3">{story.opis}</p>
                          </CardContent>
                          <CardFooter className="flex gap-2 border-t pt-4">
                            <Button variant="ghost" size="sm" className="flex-1 h-8" onClick={() => { setEditingStory(story); setStoryForm({nazwa:story.nazwa, opis:story.opis, priorytet:story.priorytet, stan:story.stan}) }}><Pencil className="h-3 w-3 mr-2" /> Edytuj</Button>
                            <Button variant="ghost" size="sm" className="flex-1 h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteStory(story.id)}><Trash2 className="h-3 w-3 mr-2" /> Usuń</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}