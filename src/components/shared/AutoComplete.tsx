'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export interface AutoCompleteOption {
    id: string;
    label: string;
    subtext?: string;
}

interface AutoCompleteProps {
    placeholder?: string;
    value?: string;
    onSelect: (option: AutoCompleteOption | null) => void;
    onLoad: () => Promise<AutoCompleteOption[]>;
}

export function AutoComplete({
    placeholder = 'Search...',
    value,
    onSelect,
    onLoad,
}: AutoCompleteProps) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<AutoCompleteOption[]>([]);
    const [results, setResults] = useState<AutoCompleteOption[]>([]);
    const [visible, setVisible] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadOptions = async () => {
            const data = await onLoad();
            setOptions(data);
            if (value) {
                const selected = data.find((opt) => opt.id === value);
                if (selected) setQuery(selected.label);
            }
        };
        loadOptions();
    }, [onLoad, value]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const filtered = options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query.toLowerCase()) ||
                opt.subtext?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 10));
    }, [query, options]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!visible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    onSelect(results[focusedIndex]);
                    setQuery(results[focusedIndex].label);
                    setVisible(false);
                }
                break;
            case 'Escape':
                setVisible(false);
                break;
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setVisible(true);
                    }}
                    onFocus={() => setVisible(true)}
                    onKeyDown={handleKeyDown}
                    className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                onSelect(null);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <Search className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            {visible && results.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-[250px] overflow-auto shadow-lg">
                    <div className="p-1">
                        {results.map((item, index) => (
                            <Button
                                key={item.id}
                                variant={index === focusedIndex ? 'secondary' : 'ghost'}
                                className="w-full justify-start font-normal h-9 px-2"
                                onClick={() => {
                                    onSelect(item);
                                    setQuery(item.label);
                                    setVisible(false);
                                }}
                            >
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="truncate w-full">{item.label}</span>
                                    {item.subtext && (
                                        <span className="text-[10px] text-muted-foreground truncate w-full">
                                            {item.subtext}
                                        </span>
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
