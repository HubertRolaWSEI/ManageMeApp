import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Pencil, Trash2, Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import type { Story, StoryPriority, StoryStatus } from "../../types";
import { PRIORITY_BADGE, fmt } from "../../utils/ui-constants";

interface Props {
  stories: Story[];
  onAdd: (form: { nazwa: string, opis: string, priorytet: StoryPriority, stan: StoryStatus }) => void;
  onUpdate: (s: Story) => void;
  onDelete: (id: string) => void;
  onViewTasks: (id: string) => void;
}

export function StoriesView({ stories, onAdd, onUpdate, onDelete, onViewTasks }: Props) {
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [form, setForm] = useState({ nazwa: '', opis: '', priorytet: 'średni' as StoryPriority, stan: 'todo' as StoryStatus });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazwa) return;
    if (editingStory) {
      onUpdate({ ...editingStory, ...form });
      setEditingStory(null);
    } else {
      onAdd(form);
    }
    setForm({ nazwa: '', opis: '', priorytet: 'średni', stan: 'todo' });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit shadow-sm">
        <CardHeader><CardTitle>{editingStory ? 'Edytuj historyjkę' : 'Nowa historyjka'}</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <Input placeholder="Nazwa historyjki" value={form.nazwa} onChange={e => setForm({ ...form, nazwa: e.target.value })} />
            <Textarea placeholder="Opis" value={form.opis} onChange={e => setForm({ ...form, opis: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 w-full rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800" value={form.priorytet} onChange={e => setForm({ ...form, priorytet: e.target.value as StoryPriority })}>
                <option value="niski">Priorytet: Niski</option>
                <option value="średni">Priorytet: Średni</option>
                <option value="wysoki">Priorytet: Wysoki</option>
              </select>
              <select className="h-10 w-full rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800" value={form.stan} onChange={e => setForm({ ...form, stan: e.target.value as StoryStatus })}>
                <option value="todo">TODO</option>
                <option value="doing">DOING</option>
                <option value="done">DONE</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">{editingStory ? 'Zaktualizuj' : 'Dodaj historyjkę'}</Button>
            {editingStory && <Button variant="ghost" className="w-full" type="button" onClick={() => { setEditingStory(null); setForm({ nazwa: '', opis: '', priorytet: 'średni', stan: 'todo' }); }}>Anuluj</Button>}
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
              <span className="ml-1 text-slate-300">({stories.filter(s => s.stan === status).length})</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {stories.filter(s => s.stan === status).map(story => (
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
                    <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8" onClick={() => onViewTasks(story.id)}>Zadania</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => { setEditingStory(story); setForm({ nazwa: story.nazwa, opis: story.opis, priorytet: story.priorytet, stan: story.stan }); }}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50" onClick={() => onDelete(story.id)}><Trash2 className="h-3 w-3" /></Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}