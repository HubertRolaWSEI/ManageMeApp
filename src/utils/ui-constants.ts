export const PRIORITY_BADGE: Record<string, string> = {
  wysoki: 'bg-red-100 text-red-600',
  średni: 'bg-orange-100 text-orange-600',
  niski: 'bg-green-100 text-green-600',
  high: 'bg-red-100 text-red-600',
  medium: 'bg-orange-100 text-orange-600',
  low: 'bg-green-100 text-green-600',
};

export const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  developer: 'bg-blue-100 text-blue-700',
  devops: 'bg-teal-100 text-teal-700',
};

export const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString('pl-PL') : '—';