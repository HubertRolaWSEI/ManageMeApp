import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Plus, ArrowLeft, Clock, PlayCircle, CheckCircle2, Timer, User as UserIcon, Trash2 } from "lucide-react";
import type { Story, Task, TaskPriority, TaskStatus } from "../../types";
import { PRIORITY_BADGE } from "../../utils/ui-constants";

interface Props {
  story: Story;
  tasks: Task[];
  loading: boolean;
  onBack: () => void;
  onAddTask: (form: any) => void;
  onDeleteTask: (id: string) => void;
  onViewDetail: (id: string) => void;
  getUserName: (id?: string) => string;
}

export function TasksView({ story, tasks, loading, onBack, onAddTask, onDeleteTask, onViewDetail, getUserName }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nazwa: '', opis: '', priorytet: 'średni' as TaskPriority, przewidywanyCzas: 1 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazwa) return;
    onAddTask(form);
    setForm({ nazwa: '', opis: '', priorytet: 'średni', przewidywanyCzas: 1 });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" /> Powrót</Button>
        <div>
          <h2 className="font-bold text-lg">{story.nazwa}</h2>
          <p className="text-sm text-slate-400">{story.opis}</p>
        </div>
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-indigo-600"><Plus className="h-4 w-4" /> Nowe zadanie</Button>
      ) : (
        <Card className="max-w-lg shadow-sm">
          <CardHeader><CardTitle>Nowe zadanie</CardTitle></CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              <Input placeholder="Nazwa" value={form.nazwa} onChange={e => setForm({ ...form, nazwa: e.target.value })} />
              <Textarea placeholder="Opis" value={form.opis} onChange={e => setForm({ ...form, opis: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <select className="h-10 rounded-md border px-3 text-sm bg-white dark:bg-slate-800" value={form.priorytet} onChange={e => setForm({ ...form, priorytet: e.target.value as TaskPriority })}>
                  <option value="niski">Priorytet: Niski</option><option value="średni">Priorytet: Średni</option><option value="wysoki">Priorytet: Wysoki</option>
                </select>
                <Input type="number" min={1} value={form.przewidywanyCzas} onChange={e => setForm({ ...form, przewidywanyCzas: Number(e.target.value) })} />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" className="flex-1 bg-indigo-600">Dodaj</Button>
              <Button variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Anuluj</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {loading && <p className="text-slate-400 text-sm">Ładowanie zadań...</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['todo', 'doing', 'done'] as TaskStatus[]).map(status => (
          <div key={status} className="space-y-3 bg-slate-100/50 dark:bg-slate-800/20 p-3 rounded-lg">
            <h3 className="font-bold uppercase text-xs text-slate-400 flex items-center gap-2">
              {status === 'todo' ? <Clock className="h-3 w-3" /> : status === 'doing' ? <PlayCircle className="h-3 w-3 text-blue-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {status === 'todo' ? 'Do zrobienia' : status === 'doing' ? 'W trakcie' : 'Gotowe'}
            </h3>
            {tasks.filter(t => t.stan === status).map(task => (
              <Card key={task.id} className="text-sm">
                <CardHeader className="pb-1 pt-3 px-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{task.nazwa}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${PRIORITY_BADGE[task.priorytet]}`}>{task.priorytet}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-1">
                  <p className="text-xs text-slate-500 line-clamp-2">{task.opis}</p>
                  <p className="text-[10px] text-slate-400 mt-1"><Timer className="h-3 w-3 inline mr-1" />{task.przewidywanyCzas}h</p>
                  {task.uzytkownikId && <p className="text-[10px] text-indigo-500"><UserIcon className="h-3 w-3 inline mr-1" />{getUserName(task.uzytkownikId)}</p>}
                </CardContent>
                <CardFooter className="px-3 pb-3 pt-1 flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onViewDetail(task.id)}>Szczegóły</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-red-400" onClick={() => onDeleteTask(task.id)}><Trash2 className="h-3 w-3" /></Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}