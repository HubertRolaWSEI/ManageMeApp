import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ArrowLeft, UserCheck, CheckCircle2, User as UserIcon } from "lucide-react";
import type { Task, User } from "../../types";
import { PRIORITY_BADGE } from "../../utils/ui-constants";

interface Props {
  task: Task;
  assignableUsers: User[];
  onBack: () => void;
  onAssign: (userId: string) => void;
  onMarkDone: (hours: number) => void;
  getUserName: (id?: string) => string;
}

export function TaskDetailView({ task, assignableUsers, onBack, onAssign, onMarkDone, getUserName }: Props) {
  const [assignId, setAssignId] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [hours, setHours] = useState(0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" /> Zadania</Button>
        <h2 className="font-bold text-lg">Szczegóły zadania</h2>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{task.nazwa}</CardTitle>
            <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${PRIORITY_BADGE[task.priorytet]}`}>{task.priorytet}</span>
          </div>
          <CardDescription>{task.opis}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Stan</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.stan === 'todo' ? 'bg-slate-200 text-slate-600' : task.stan === 'doing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {task.stan.toUpperCase()}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Estymacja</p>
              <p className="font-medium text-xs">{task.przewidywanyCzas}h / {task.zrealizowaneGodziny ?? '—'}h real.</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Przypisana osoba</p>
            <p className="font-medium text-sm flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-slate-400" />
              {getUserName(task.uzytkownikId)}
            </p>
          </div>

          {task.stan === 'todo' && (
            <div className="border rounded-lg p-4 space-y-3 bg-blue-50/50 dark:bg-blue-900/10">
              <p className="text-sm font-semibold flex items-center gap-2 text-blue-600"><UserCheck className="h-4 w-4" /> Przypisz osobę</p>
              <div className="flex gap-2">
                <select className="flex-1 h-9 rounded-md border border-input px-3 text-sm bg-white dark:bg-slate-800" value={assignId} onChange={e => setAssignId(e.target.value)}>
                  <option value="">Wybierz osobę...</option>
                  {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.imie} {u.nazwisko} ({u.rola})</option>)}
                </select>
                <Button onClick={() => onAssign(assignId)} disabled={!assignId} className="bg-blue-600 hover:bg-blue-700 h-9">Przypisz</Button>
              </div>
            </div>
          )}

          {task.stan === 'doing' && (
            <div className="border rounded-lg p-4 space-y-3 bg-green-50/50 dark:bg-green-900/10">
              <p className="text-sm font-semibold flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" /> Zamknij zadanie</p>
              {!showDone ? (
                <Button onClick={() => setShowDone(true)} className="bg-green-600 hover:bg-green-700">Oznacz jako DONE</Button>
              ) : (
                <div className="flex gap-2 items-center flex-wrap">
                  <Input type="number" min={0} placeholder="Godziny" value={hours || ''} onChange={e => setHours(Number(e.target.value))} className="max-w-[100px]" />
                  <Button onClick={() => onMarkDone(hours)} className="bg-green-600 hover:bg-green-700">Zapisz</Button>
                  <Button variant="ghost" onClick={() => setShowDone(false)}>Anuluj</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}