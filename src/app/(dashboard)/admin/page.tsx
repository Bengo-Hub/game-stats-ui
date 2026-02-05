'use client';

import { PermissionGuard } from '@/components/guards/permission-guard';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { adminApi, type AdminUser, type ScoreEdit } from '@/lib/api/admin';
import { usePaginationState } from '@/lib/hooks/usePagination';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity,
    AlertCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit3,
    History,
    Key,
    Loader2,
    MoreHorizontal,
    RefreshCcw,
    Shield,
    UserCheck,
    UserCog,
    Users,
    UserX,
    X,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

// Query keys
const adminKeys = {
  all: ['admin'] as const,
  users: (params?: unknown) => [...adminKeys.all, 'users', params] as const,
  auditLogs: (params?: unknown) => [...adminKeys.all, 'auditLogs', params] as const,
  scoreEdits: (params?: unknown) => [...adminKeys.all, 'scoreEdits', params] as const,
  systemHealth: () => [...adminKeys.all, 'systemHealth'] as const,
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-500',
    event_manager: 'bg-blue-500/10 text-blue-500',
    team_manager: 'bg-green-500/10 text-green-500',
    scorekeeper: 'bg-yellow-500/10 text-yellow-500',
    spectator: 'bg-gray-500/10 text-gray-500',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

function getStatusColor(status: string): 'scheduled' | 'in_progress' | 'finished' | 'canceled' {
  switch (status) {
    case 'active':
      return 'in_progress';
    case 'inactive':
      return 'canceled';
    case 'suspended':
      return 'canceled';
    case 'pending':
      return 'scheduled';
    case 'approved':
      return 'finished';
    case 'rejected':
      return 'canceled';
    default:
      return 'scheduled';
  }
}

// User Management Tab Component
function UserManagementTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const pagination = usePaginationState(20);

  // Fetch users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: adminKeys.users({ search: searchTerm, role: roleFilter, status: statusFilter, ...pagination }),
    queryFn: () => adminApi.listUsers({
      search: searchTerm || undefined,
      role: roleFilter !== 'all' ? roleFilter as AdminUser['role'] : undefined,
      status: statusFilter !== 'all' ? statusFilter as AdminUser['status'] : undefined,
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
    }),
    staleTime: 1000 * 60 * 2,
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('User suspended');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('User activated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUser['role'] }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('User role updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => adminApi.resetUserPassword(userId),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and roles</CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search users..."
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="event_manager">Event Manager</SelectItem>
              <SelectItem value="team_manager">Team Manager</SelectItem>
              <SelectItem value="scorekeeper">Scorekeeper</SelectItem>
              <SelectItem value="spectator">Spectator</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getRoleColor(user.role))}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getStatusColor(user.status)} label={user.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'admin' })}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'event_manager' })}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Make Event Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'scorekeeper' })}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Make Scorekeeper
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => activateMutation.mutate(user.id)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => suspendMutation.mutate(user.id)} className="text-destructive">
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {users.length} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page + 1)}
              disabled={users.length < pagination.pageSize}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Audit Log Tab Component
function AuditLogTab() {
  const [entityFilter, setEntityFilter] = React.useState<string>('all');
  const [actionFilter, setActionFilter] = React.useState<string>('');
  const pagination = usePaginationState(50);

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: adminKeys.auditLogs({ entityType: entityFilter, action: actionFilter, ...pagination }),
    queryFn: () => adminApi.listAuditLogs({
      entityType: entityFilter !== 'all' ? entityFilter : undefined,
      action: actionFilter || undefined,
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
    }),
    staleTime: 1000 * 60,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => adminApi.exportAuditLogs({ entityType: entityFilter !== 'all' ? entityFilter : undefined }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Complete history of all system changes</CardDescription>
          </div>
          <div className="flex gap-2">
            {['all', 'game', 'user', 'team', 'event'].map((type) => (
              <Button
                key={type}
                variant={entityFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntityFilter(type)}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                          {log.entityType}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.action.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded truncate block">
                          {JSON.stringify(log.details)}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {auditLogs.length} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page + 1)}
              disabled={auditLogs.length < pagination.pageSize}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Score Edit Approval Tab Component
function ScoreEditApprovalTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<ScoreEdit['status']>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedEdit, setSelectedEdit] = React.useState<ScoreEdit | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  // Fetch score edits
  const { data: scoreEdits = [], isLoading } = useQuery({
    queryKey: adminKeys.scoreEdits({ status: statusFilter }),
    queryFn: () => adminApi.listScoreEdits({ status: statusFilter }),
    staleTime: 1000 * 30, // 30 seconds for pending items
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveScoreEdit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.scoreEdits() });
      toast.success('Score edit approved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectScoreEdit(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.scoreEdits() });
      toast.success('Score edit rejected');
      setRejectDialogOpen(false);
      setSelectedEdit(null);
      setRejectReason('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleReject = () => {
    if (selectedEdit && rejectReason) {
      rejectMutation.mutate({ id: selectedEdit.id, reason: rejectReason });
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Override Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Score Override</CardTitle>
          <CardDescription>
            Make direct corrections to game scores with audit trail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreOverrideDialog />
        </CardContent>
      </Card>

      {/* Pending Edits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Score Edit Requests</CardTitle>
              <CardDescription>Review and approve score corrections</CardDescription>
            </div>
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected'] as ScoreEdit['status'][]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : scoreEdits.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No {statusFilter} score edit requests
            </p>
          ) : (
            <div className="space-y-4">
              {scoreEdits.map((edit) => (
                <div key={edit.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{edit.gameName}</span>
                    <StatusBadge status={getStatusColor(edit.status)} label={edit.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Previous Score:</span>
                      <span className="ml-2 font-medium">{edit.previousHomeScore} - {edit.previousAwayScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proposed Score:</span>
                      <span className="ml-2 font-medium text-primary">{edit.newHomeScore} - {edit.newAwayScore}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="ml-2">{edit.reason}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested by:</span>
                      <span className="ml-2">{edit.requestedByName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2">{formatDate(edit.createdAt)}</span>
                    </div>
                    {edit.reviewedByName && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Reviewed by:</span>
                        <span className="ml-2">{edit.reviewedByName}</span>
                        {edit.reviewedAt && <span className="text-muted-foreground ml-2">at {formatDate(edit.reviewedAt)}</span>}
                      </div>
                    )}
                    {edit.rejectionReason && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Rejection reason:</span>
                        <span className="ml-2 text-destructive">{edit.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                  {edit.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(edit.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEdit(edit);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Score Edit</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this score edit request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Explain why this edit is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason || rejectMutation.isPending}
              variant="destructive"
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Score Override Dialog Component
function ScoreOverrideDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [gameId, setGameId] = React.useState('');
  const [homeScore, setHomeScore] = React.useState('');
  const [awayScore, setAwayScore] = React.useState('');
  const [reason, setReason] = React.useState('');

  const overrideMutation = useMutation({
    mutationFn: () =>
      adminApi.overrideGameScore(gameId, {
        homeTeamScore: parseInt(homeScore, 10),
        awayTeamScore: parseInt(awayScore, 10),
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
      toast.success('Score updated successfully');
      setOpen(false);
      setGameId('');
      setHomeScore('');
      setAwayScore('');
      setReason('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = () => {
    overrideMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Edit3 className="h-4 w-4 mr-2" />
          Override Score
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Game Score</DialogTitle>
          <DialogDescription>
            All score overrides are logged in the audit trail. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gameId">Game ID</Label>
            <Input
              id="gameId"
              placeholder="Enter game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeScore">Home Score</Label>
              <Input
                id="homeScore"
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awayScore">Away Score</Label>
              <Input
                id="awayScore"
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Override (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this score needs to be corrected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!gameId || !homeScore || !awayScore || !reason || overrideMutation.isPending}
          >
            {overrideMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export Tab Component
function ExportTab() {
  const handleExport = async (type: 'events' | 'games' | 'teams' | 'users', format: 'csv' | 'json') => {
    try {
      const blob = await adminApi.exportData(type, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    }
  };

  const exportOptions = [
    { type: 'games' as const, title: 'Games', description: 'All games with scores' },
    { type: 'teams' as const, title: 'Teams', description: 'All teams and rosters' },
    { type: 'events' as const, title: 'Events', description: 'All tournaments' },
    { type: 'users' as const, title: 'Users', description: 'User accounts' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>Export tournament data in various formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exportOptions.map(({ type, title, description }) => (
            <Card key={type} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Download className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport(type, 'csv')}>
                    CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport(type, 'json')}>
                    JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Admin Page
export default function AdminPage() {
  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => adminApi.getSystemHealth(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  // Fetch counts for stats cards
  const { data: users = [] } = useQuery({
    queryKey: adminKeys.users({ limit: 1000 }),
    queryFn: () => adminApi.listUsers({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: pendingEdits = [] } = useQuery({
    queryKey: adminKeys.scoreEdits({ status: 'pending' }),
    queryFn: () => adminApi.listScoreEdits({ status: 'pending' }),
    staleTime: 1000 * 30,
  });

  const { data: todayAuditLogs = [] } = useQuery({
    queryKey: adminKeys.auditLogs({ today: true }),
    queryFn: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return adminApi.listAuditLogs({
        startDate: today.toISOString(),
        limit: 1000,
      });
    },
    staleTime: 1000 * 60,
  });

  const activeUsers = users.filter((u) => u.status === 'active').length;

  return (
    <PermissionGuard permission="view_admin" fallback={
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Shield className="h-16 w-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    }>
      <div className="space-y-6">
        <PageHeader
          title="Admin Dashboard"
          description="Manage users, scores, and view audit logs"
        />

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">{activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAuditLogs.length}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Edits</CardTitle>
              <AlertCircle className={cn('h-4 w-4', pendingEdits.length > 0 ? 'text-yellow-500' : 'text-muted-foreground')} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEdits.length}</div>
              <p className="text-xs text-muted-foreground">Requires review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className={cn('h-4 w-4', systemHealth?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500')} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', systemHealth?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500')}>
                {systemHealth?.status === 'healthy' ? 'Healthy' : systemHealth?.status || 'Loading...'}
              </div>
              <p className="text-xs text-muted-foreground">
                {systemHealth?.database?.status === 'up' ? 'All systems operational' : 'Checking...'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <UserCog className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="scores">
              <Edit3 className="h-4 w-4 mr-2" />
              Score Editing
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="scores">
            <ScoreEditApprovalTab />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTab />
          </TabsContent>

          <TabsContent value="export">
            <ExportTab />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
