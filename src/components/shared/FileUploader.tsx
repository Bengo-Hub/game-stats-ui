'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { CheckCircle2, File, Loader2, Upload, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface FileUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    accept?: string;
    maxSize?: number; // in MB
    label?: string;
    description?: string;
    className?: string;
}

export function FileUploader({
    value,
    onChange,
    onRemove,
    accept = 'image/*',
    maxSize = 5,
    label = 'Upload Image',
    description = 'PNG, JPG or WEBP (max. 5MB)',
    className,
}: FileUploaderProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [dragActive, setDragActive] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Use the actual API endpoint via apiClient to ensure auth header is included
            const data = await apiClient.post<{ url: string }>('/upload', formData);
            onChange(data.url);
            toast.success('File uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const removeFile = () => {
        onChange('');
        if (onRemove) onRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && <label className="text-sm font-medium">{label}</label>}

            {!value ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors',
                        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                        isUploading && 'pointer-events-none opacity-60'
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        accept={accept}
                        className="hidden"
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-primary/10 rounded-full mb-3">
                                <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-semibold">Click to upload or drag and drop</p>
                            {description && (
                                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="relative border rounded-lg p-2 bg-muted/30 flex items-center gap-3">
                    <div className="w-16 h-16 rounded border overflow-hidden bg-background flex items-center justify-center">
                        {accept.startsWith('image/') ? (
                            <img
                                src={value}
                                alt="Uploaded"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '';
                                    (e.target as HTMLImageElement).className = 'hidden';
                                }}
                            />
                        ) : (
                            <File className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{value.split('/').pop()}</p>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Verified</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
