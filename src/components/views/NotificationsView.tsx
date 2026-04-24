import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { AppNotification } from "../../types";
import { PRIORITY_BADGE, fmt } from "../../utils/ui-constants";

interface Props {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelect: (id: string) => void;
}

export function NotificationsView({ notifications, onMarkAllRead, onSelect }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Powiadomienia</h2>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead}>Oznacz wszystkie jako przeczytane</Button>
      </div>
      <div className="space-y-3">
        {notifications.map(n => (
          <Card key={n.id} className={`cursor-pointer transition-all ${!n.isRead ? 'border-indigo-300 bg-indigo-50/20' : ''}`} onClick={() => onSelect(n.id)}>
            <CardContent className="p-4 flex gap-4 items-center">
              <div className={`h-2 w-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-indigo-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-semibold truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-400 ml-2">{fmt(n.date)}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_BADGE[n.priority]}`}>{n.priority}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}