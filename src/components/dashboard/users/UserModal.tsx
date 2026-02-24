'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCog, UserPlus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { adminApi, type AdminUser, type CreateUserRequest, type UpdateUserRequest } from '@/lib/api/admin';

interface UserModalProps {
    user?: AdminUser | null; // If provided, it's Edit mode
    isOpen: boolean;
    onClose: () => void;
}

export function UserModal({ user, isOpen, onClose }: UserModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!user;

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        role: 'scorekeeper' as AdminUser['role'],
        status: 'active' as AdminUser['status'],
    });

    React.useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Don't show password on edit
                role: user.role,
                status: user.status,
            });
        } else if (!isOpen) {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'scorekeeper',
                status: 'active',
            });
        }
    }, [user, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (isEdit && user) {
                return adminApi.updateUser(user.id, data as UpdateUserRequest);
            }
            return adminApi.createUser(data as CreateUserRequest);
        },
        onSuccess: () => {
            toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            name: formData.name,
            role: formData.role,
        };

        if (!isEdit) {
            data.email = formData.email;
            data.password = formData.password;
        } else {
            // Email might be editable depending on backend, but DTO suggests it's name/role/isActive
            data.email = formData.email;
            data.status = formData.status;
        }

        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isEdit ? <UserCog className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                            {isEdit ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Update user details and permissions."
                                : "Create a new user account and assign an initial role."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                                disabled={isEdit}
                            />
                        </div>

                        {!isEdit && (
                            <div className="grid gap-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required={!isEdit}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="role">System Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: AdminUser['role']) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="event_manager">Event Manager</SelectItem>
                                    <SelectItem value="team_manager">Team Manager</SelectItem>
                                    <SelectItem value="scorekeeper">Scorekeeper</SelectItem>
                                    <SelectItem value="spectator">Spectator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isEdit && (
                            <div className="grid gap-2">
                                <Label htmlFor="status">Account Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: AdminUser['status']) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
