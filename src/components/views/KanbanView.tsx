import { Card, CardHeader, CardContent } from "../ui/card";
import { Kanban } from "lucide-react";
import type { Story, Task, TaskStatus } from "../../types";
import { PRIORITY_BADGE } from "../../utils/ui-constants";

interface Props {
  projectName?: string;
  stories: Story[];
  tasks: Task[];
  onTaskClick: (storyId: string, taskId: string) => void;
}

export function KanbanView({ projectName, stories, tasks, onTaskClick }: Props) {
  const statuses: TaskStatus[] = ['todo', 'doing', 'done'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Kanban className="h-5 w-5 text-indigo-500" />
        <h2 className="font-bold text-lg">Tablica Kanban — {projectName}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map(status => (
          <div key={status} className="space-y-3">
            <div className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${status === 'todo' ? 'bg-slate-200 text-slate-600' : status === 'doing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {status === 'todo' ? 'Do zrobienia' : status === 'doing' ? 'W trakcie' : 'Gotowe'}
              <span className="ml-auto opacity-60">({tasks.filter(t => t.stan === status).length})</span>
            </div>
            {tasks.filter(t => t.stan === status).map(task => {
              const story = stories.find(s => s.id === task.historijaId);
              return (
                <Card key={task.id} className="bg-white dark:bg-slate-800 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer text-sm"
                  onClick={() => onTaskClick(task.historijaId, task.id)}>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-sm leading-tight">{task.nazwa}</span>
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
        ))}
      </div>
    </div>
  );
}