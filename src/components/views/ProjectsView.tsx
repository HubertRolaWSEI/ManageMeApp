import { useState } from 'react';
import type { Project } from '../../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface ProjectsViewProps {
  projects: Project[];
  onAdd: (form: { nazwa: string; opis: string }) => void;
  onUpdate: (p: Project) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function ProjectsView({ projects, onAdd, onUpdate, onDelete, onSelect }: ProjectsViewProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ nazwa: '', opis: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazwa) return;
    if (editingProject) {
      onUpdate({ ...editingProject, ...form });
      setEditingProject(null);
    } else {
      onAdd(form);
    }
    setForm({ nazwa: '', opis: '' });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit shadow-sm">
        <CardHeader><CardTitle>{editingProject ? 'Edytuj projekt' : 'Nowy projekt'}</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <Input placeholder="Nazwa" value={form.nazwa} onChange={e => setForm({ ...form, nazwa: e.target.value })} />
            <Textarea placeholder="Opis" value={form.opis} onChange={e => setForm({ ...form, opis: e.target.value })} />
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-indigo-600">{editingProject ? 'Zapisz' : 'Utwórz projekt'}</Button>
            {editingProject && <Button variant="ghost" className="w-full" onClick={() => { setEditingProject(null); setForm({ nazwa: '', opis: '' }); }}>Anuluj</Button>}
          </CardFooter>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map(p => (
          <Card key={p.id} className="hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => onSelect(p.id)}>
            <CardHeader><CardTitle>{p.nazwa}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-500 line-clamp-2">{p.opis}</p></CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={e => { e.stopPropagation(); setEditingProject(p); setForm({ nazwa: p.nazwa, opis: p.opis }); }}>
                <Pencil className="h-3 w-3 mr-1" /> Edytuj
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={e => { e.stopPropagation(); onDelete(p.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}