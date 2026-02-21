import { cn } from '@/lib/utils';
import { Badge } from './badge';

type StatusType =
  | 'scheduled'
  | 'in_progress'
  | 'finished'
  | 'ended'
  | 'canceled'
  | 'draft'
  | 'published'
  | 'completed'
  | 'pending';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  finished: { label: 'Finished (Scores Open)', variant: 'secondary' },
  ended: { label: 'Ended', variant: 'outline' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  pending: { label: 'Pending', variant: 'secondary' },
};

export function StatusBadge({ status, label, size = 'default', className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || { label: status, variant: 'secondary' as const };
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    default: '',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge variant={config.variant} className={cn('capitalize', sizeClasses[size], className)}>
      {displayLabel}
    </Badge>
  );
}
