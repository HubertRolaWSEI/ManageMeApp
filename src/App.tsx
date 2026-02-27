import { useState } from 'react';
import type { Project } from './types';
import { ProjectService } from './services/ProjectService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2, LayoutDashboard } from "lucide-react";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => ProjectService.getAll());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ nazwa: '', opis: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazwa || !form.opis) return;

    if (editingProject) {
      if (!window.confirm("Zapisać zmiany?")) return;
      ProjectService.update({ ...editingProject, ...form });
      setEditingProject(null);
    } else {
      ProjectService.add(form);
    }

    setForm({ nazwa: '', opis: '' });
    setProjects(ProjectService.getAll());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Usunąć ten projekt?")) {
      ProjectService.delete(id);
      setProjects(ProjectService.getAll());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-indigo-600" /> ManageMe
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Zapisano projektów: {projects.length}</p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <aside>
            <Card className="sticky top-8 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingProject ? <Pencil className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                  {editingProject ? 'Edytuj projekt' : 'Nowy projekt'}
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Nazwa projektu" 
                    value={form.nazwa}
                    onChange={e => setForm({ ...form, nazwa: e.target.value })}
                  />
                  <Textarea 
                    placeholder="Opis projektu" 
                    className="min-h-[120px]"
                    value={form.opis}
                    onChange={e => setForm({ ...form, opis: e.target.value })}
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {editingProject ? 'Zapisz zmiany' : 'Dodaj projekt'}
                  </Button>
                  {editingProject && (
                    <Button variant="ghost" onClick={() => {setEditingProject(null); setForm({nazwa:'', opis:''})}} className="w-full">
                      Anuluj
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          </aside>

          <main>
            <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
              {projects.map(project => (
                <Card key={project.id} className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{project.nazwa}</CardTitle>
                    <CardDescription className="text-[10px] font-mono uppercase tracking-tighter">
                      ID: {project.id.slice(0,8)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 line-clamp-3 min-h-[60px]">{project.opis}</p>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => {setEditingProject(project); setForm({nazwa:project.nazwa, opis:project.opis})}} className="flex-1 gap-2">
                      <Pencil className="h-3.5 w-3.5" /> Edytuj
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)} className="flex-1 gap-2">
                      <Trash2 className="h-3.5 w-3.5" /> Usuń
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}