import { Bell, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import type { AppNotification } from "../types";

interface Props {
  notification: AppNotification | null;
  onClose: () => void;
  onView: (id: string) => void;
}

export function NotificationPopup({ notification, onClose, onView }: Props) {
  if (!notification) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] w-80 animate-in fade-in slide-in-from-right-4">
      <Card className={`border-l-4 ${notification.priority === 'high' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
            <Bell className="h-4 w-4 text-indigo-500" /> Powiadomienie
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="pb-3 text-sm">
          <p className="font-bold truncate">{notification.title}</p>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{notification.message}</p>
        </CardContent>
        <CardFooter className="py-2 flex justify-end">
          <Button size="sm" className="h-7 text-xs" onClick={() => onView(notification.id)}>Zobacz</Button>
        </CardFooter>
      </Card>
    </div>
  );
}