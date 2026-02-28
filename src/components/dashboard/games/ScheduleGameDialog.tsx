'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as React from 'react';
import { GameForm } from './GameForm';

interface ScheduleGameDialogProps {
  trigger?: React.ReactNode;
  eventId?: string; // Pre-select event if provided
  onSuccess?: () => void;
}

export function ScheduleGameDialog({ trigger, eventId, onSuccess }: ScheduleGameDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Game</DialogTitle>
          <DialogDescription>
            Create a new game by selecting teams, time, and field.
          </DialogDescription>
        </DialogHeader>

        <GameForm
          initialEventId={eventId}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleGameDialog;
