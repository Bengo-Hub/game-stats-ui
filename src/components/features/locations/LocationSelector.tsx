'use client';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLocations } from '@/lib/hooks/useGeographic';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, MapPin, Plus } from 'lucide-react';
import * as React from 'react';
import { LocationDialog } from './LocationDialog';

interface LocationSelectorProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function LocationSelector({
    value,
    onValueChange,
    placeholder = "Select location...",
    className,
}: LocationSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [showAddDialog, setShowAddDialog] = React.useState(false);
    const { data: locations = [], isLoading } = useLocations();

    const selectedLocation = React.useMemo(
        () => locations.find((l) => l.id === value),
        [locations, value]
    );

    return (
        <>
            <div className={cn("flex items-center gap-2", className)}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="flex-1 justify-between gap-2"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className="h-4 w-4 shrink-0 opacity-50" />
                                <span>{selectedLocation?.name || placeholder}</span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search locations..." />
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                                {locations.map((location) => (
                                    <CommandItem
                                        key={location.id}
                                        value={location.name}
                                        onSelect={() => {
                                            onValueChange(location.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === location.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{location.name}</span>
                                            {location.city && (
                                                <span className="text-xs text-muted-foreground">{location.city}</span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddDialog(true)}
                    title="Add new location"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <LocationDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={(newLocation) => {
                    onValueChange(newLocation.id);
                }}
            />
        </>
    );
}
