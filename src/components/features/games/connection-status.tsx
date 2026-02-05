'use client';

import * as React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  lastUpdate?: Date | null;
  showLabel?: boolean;
  className?: string;
}

export function ConnectionStatus({
  status,
  lastUpdate,
  showLabel = true,
  className,
}: ConnectionStatusProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = React.useState<string>('');

  React.useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const statusConfig = {
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      pulse: false,
    },
    connecting: {
      icon: Loader2,
      label: 'Connecting...',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      pulse: true,
    },
    connected: {
      icon: Wifi,
      label: 'Live',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      pulse: true,
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      pulse: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          config.pulse && status === 'connecting' && 'animate-spin',
          config.pulse && status === 'connected' && 'animate-pulse'
        )}
      />
      {showLabel && (
        <>
          <span>{config.label}</span>
          {status === 'connected' && lastUpdate && (
            <span className="text-muted-foreground">• {timeSinceUpdate}</span>
          )}
        </>
      )}
    </div>
  );
}

// Connection indicator dot (minimal version)
export function ConnectionDot({
  status,
  className,
}: {
  status: ConnectionStatus;
  className?: string;
}) {
  const dotConfig = {
    disconnected: 'bg-muted-foreground',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-green-500 animate-pulse',
    error: 'bg-red-500',
  };

  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', dotConfig[status], className)}
      title={status}
    />
  );
}

export default ConnectionStatus;
