'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Hotel,
  Building2,
  Users,
  Copy,
  Check,
  UserPlus,
  Settings,
  Crown,
  MoreVertical,
  Mail,
  Shield,
  ArrowLeft,
  Info,
  Sparkles,
  LogOut,
  Ticket,
  AlertTriangle,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';

interface OrganizationMember {
  id: string;
  email: string;
  name: string;
  role: string;
  isOrgAdmin: boolean;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  type: string;
  inviteCode: string;
  createdAt: string;
  users: OrganizationMember[];
  scenarios: any[];
}

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { user, isAuthenticated, isLoading, token, logout, refreshUser } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setOrganization(data.organization);
        } else {
          setError(data.error || 'Failed to load organization');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrganization();
    }
  }, [isAuthenticated, token]);

  const handleCopyInviteCode = () => {
    if (organization?.inviteCode) {
      navigator.clipboard.writeText(organization.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleJoinOrganization = async () => {
    if (!joinInviteCode || joinInviteCode.length !== 6) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    try {
      setIsJoining(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: joinInviteCode }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Successfully joined organization');
        setJoinDialogOpen(false);
        setJoinInviteCode('');
        // Refresh user and organization data
        await refreshUser();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.error || 'Failed to join organization');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join organization');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveOrganization = async () => {
    try {
      setIsLeaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/organizations/leave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Successfully left organization');
        setLeaveDialogOpen(false);
        // Log out the user since they no longer have an organization
        setTimeout(() => {
          logout();
          router.push('/signup');
        }, 1500);
      } else {
        setError(data.error || 'Failed to leave organization');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to leave organization');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HospitalityAI
                </h1>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Organization
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role}{user?.isOrgAdmin && ' • Org Admin'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {organization && (
          <>
            {/* Organization Header */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {organization.type}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {organization.users.length} members
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                {user?.isOrgAdmin && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Invite Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Members</DialogTitle>
                        <DialogDescription>
                          Share this invite code with your team members. They can use it during signup to join your organization.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Organization Invite Code</Label>
                          <div className="flex gap-2">
                            <Input
                              value={organization.inviteCode}
                              readOnly
                              className="font-mono text-lg tracking-wider"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleCopyInviteCode}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            New members can enter this code during signup to join {organization.name}
                          </p>
                        </div>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Keep this code private. Anyone with this code can join your organization.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members" className="space-y-6">
              <TabsList>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="switch" className="gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Switch
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your organization's members and their roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {organization.users.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="" alt={member.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{member.name}</p>
                                {member.isOrgAdmin && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Crown className="w-3 h-3" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Shield className="w-3 h-3" />
                                <span className="capitalize">{member.role}</span>
                                <span>•</span>
                                <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {user?.isOrgAdmin && member.id !== user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled>Change Role</DropdownMenuItem>
                                <DropdownMenuItem disabled className="text-destructive">
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Members</CardDescription>
                      <CardTitle className="text-3xl">{organization.users.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Organization Scenarios</CardDescription>
                      <CardTitle className="text-3xl">{organization.scenarios.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Administrators</CardDescription>
                      <CardTitle className="text-3xl">
                        {organization.users.filter(u => u.isOrgAdmin).length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              {/* Switch Organization Tab */}
              <TabsContent value="switch" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Join Another Organization</CardTitle>
                    <CardDescription>
                      Enter an invite code to join a different organization. You will leave your current organization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        When you join another organization, you will automatically leave {organization.name}. Make sure you have the invite code from the organization you want to join.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="joinInviteCode">Invite Code</Label>
                        <div className="relative">
                          <Ticket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="joinInviteCode"
                            type="text"
                            value={joinInviteCode}
                            onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            className="pl-10 font-mono tracking-wider"
                            maxLength={6}
                            disabled={isJoining}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the 6-character code provided by the organization
                        </p>
                      </div>

                      <Button
                        onClick={handleJoinOrganization}
                        disabled={isJoining || !joinInviteCode || joinInviteCode.length !== 6}
                        className="w-full"
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining Organization...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Join Organization
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Leave Organization</CardTitle>
                    <CardDescription>
                      Leave {organization.name} and remove your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> Leaving the organization will delete your account. You will need to create a new account to continue using the platform.
                      </AlertDescription>
                    </Alert>

                    {user?.isOrgAdmin && organization.users.filter(u => u.isOrgAdmin).length === 1 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You cannot leave because you are the only admin. Please promote another member to admin first.
                        </AlertDescription>
                      </Alert>
                    )}

                    {organization.users.length === 1 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You cannot leave because you are the only member. Please delete the organization instead from the Settings tab.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={
                            (user?.isOrgAdmin && organization.users.filter(u => u.isOrgAdmin).length === 1) ||
                            organization.users.length === 1
                          }
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Organization
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Leave {organization.name}?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to leave this organization? This action cannot be undone and your account will be deleted. You will be redirected to create a new account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-3 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setLeaveDialogOpen(false)}
                            disabled={isLeaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleLeaveOrganization}
                            disabled={isLeaving}
                          >
                            {isLeaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Leaving...
                              </>
                            ) : (
                              'Leave Organization'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>
                      Manage your organization's details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input value={organization.name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Organization Type</Label>
                        <Input value={organization.type} disabled className="capitalize" />
                      </div>
                      <div className="space-y-2">
                        <Label>Invite Code</Label>
                        <div className="flex gap-2">
                          <Input
                            value={organization.inviteCode}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyInviteCode}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Organization ID</Label>
                        <Input value={organization.id} disabled className="font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label>Created</Label>
                        <Input value={new Date(organization.createdAt).toLocaleString()} disabled />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">
                        These actions are irreversible. Please be careful.
                      </p>
                      <Button variant="destructive" disabled>
                        Delete Organization
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
