'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Game } from '@/types';
import * as React from 'react';
import { GameForm } from './GameForm';

interface EditGameDialogProps {
  game: Game;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditGameDialog({ game, trigger, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess }: EditGameDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const handleSuccess = () => {
    setOpen?.(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Update game schedule, field, and logistics.
          </DialogDescription>
        </DialogHeader>

        <GameForm
          game={game}
          onSuccess={handleSuccess}
          onCancel={() => setOpen?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditGameDialog;
