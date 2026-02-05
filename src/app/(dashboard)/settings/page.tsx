'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUser, useAuthStore } from '@/stores/auth';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  User,
  Loader2,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  Trash2,
  LogOut,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { settingsApi, type NotificationSettings, type Session } from '@/lib/api/settings';

// Query keys
const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
  sessions: () => [...settingsKeys.all, 'sessions'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
};

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const user = useUser();
  const logout = useAuthStore((state) => state.logout);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = React.useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: settingsKeys.sessions(),
    queryFn: () => settingsApi.getSessions(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch notification settings
  const { data: notificationSettings } = useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => settingsApi.getNotificationSettings(),
    staleTime: 1000 * 60 * 5,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update profile'),
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordDialogOpen(false);
      resetPassword();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to change password'),
  });

  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: settingsApi.updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
      toast.success('Notification settings updated');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update settings'),
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: settingsApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      toast.success('Session revoked');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to revoke session'),
  });

  // Revoke all sessions mutation
  const revokeAllSessionsMutation = useMutation({
    mutationFn: settingsApi.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      toast.success('All other sessions revoked');
      setRevokeAllDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to revoke sessions'),
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      name: data.name,
      phone: data.phone || undefined,
    });
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    if (notificationSettings) {
      updateNotificationsMutation.mutate({
        [key]: !notificationSettings[key],
      });
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('mobile') || deviceName.toLowerCase().includes('phone')) {
      return Smartphone;
    }
    return Laptop;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...registerProfile('name')}
                    className={profileErrors.name ? 'border-destructive' : ''}
                  />
                  {profileErrors.name && (
                    <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...registerProfile('phone')}
                />
              </div>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !profileDirty}
              >
                {updateProfileMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    theme === value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted hover:border-muted-foreground/25'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'gameUpdates' as const, label: 'Game updates', description: 'Get notified when games start or end' },
                { key: 'spiritScores' as const, label: 'Spirit scores', description: 'Receive alerts for spirit score submissions' },
                { key: 'eventAnnouncements' as const, label: 'Event announcements', description: 'Stay updated on event changes' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Button
                    variant={notificationSettings?.[item.key] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleNotification(item.key)}
                    disabled={updateNotificationsMutation.isPending}
                  >
                    {notificationSettings?.[item.key] ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Enabled
                      </>
                    ) : (
                      'Enable'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Change password</p>
                <p className="text-sm text-muted-foreground">Update your password regularly</p>
              </div>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                Change
              </Button>
            </div>

            {/* Active Sessions */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
                </div>
                {sessions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevokeAllDialogOpen(true)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out all others
                  </Button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.deviceName);
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg',
                          session.isCurrent ? 'bg-primary/5 border border-primary/20' : 'bg-muted'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {session.deviceName}
                              {session.isCurrent && (
                                <span className="ml-2 text-xs text-primary">(Current)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.ipAddress} · Last active {new Date(session.lastActiveAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => revokeSessionMutation.mutate(session.id)}
                            disabled={revokeSessionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active sessions
                </p>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={logout}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...registerPassword('currentPassword')}
                  className={passwordErrors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerPassword('newPassword')}
                  className={passwordErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all devices except this one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeAllSessionsMutation.mutate()}
              disabled={revokeAllSessionsMutation.isPending}
            >
              {revokeAllSessionsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sign out all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
