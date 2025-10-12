'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScenarioCard from '@/components/trainee/ScenarioCard';
import ProgressOverview from '@/components/trainee/ProgressOverview';
import RecentSessions from '@/components/trainee/RecentSessions';
import ImprovementAreas from '@/components/trainee/ImprovementAreas';
import ContinueTraining from '@/components/trainee/ContinueTraining';
import { Scenario } from '@/lib/types/scenario';
import { TrainingSession } from '@/lib/types/session';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Hotel, LogOut, Plus, User, Settings, Sparkles } from 'lucide-react';

export default function Home() {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { user, isAuthenticated, isLoading, logout, token } = useAuthContext();
  const router = useRouter();

  // Fetch scenarios from database
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/scenarios', { headers });
        const data = await response.json();

        if (data.success) {
          setAllScenarios(data.data);
        } else {
          console.error('Failed to load scenarios:', data.error);
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      }
    };

    fetchScenarios();
  }, [token]);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) return;

      try {
        setSessionsLoading(true);
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/sessions?trainee_id=${user.id}`, { headers });
        const data = await response.json();

        if (data.success) {
          setUserSessions(data.data);
        } else {
          console.error('Failed to load sessions:', data.error);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id, token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render content if not authenticated
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
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HospitalityAI
                </h1>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Training
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
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
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
        {/* Welcome Message */}
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground text-lg">Continue your training journey and improve your hospitality skills</p>
        </div>

        {/* Progress Overview */}
        {!sessionsLoading && <ProgressOverview sessions={userSessions} />}

        {/* Continue Training Section */}
        {!sessionsLoading && userSessions.some(s => s.status === 'in_progress') && (
          <ContinueTraining sessions={userSessions} scenarios={allScenarios} />
        )}

        {/* Two Column Layout - Recent Sessions & Improvement Areas */}
        {!sessionsLoading && userSessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSessions sessions={userSessions} scenarios={allScenarios} />
            <ImprovementAreas sessions={userSessions} scenarios={allScenarios} />
          </div>
        )}

        {/* Scenarios Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Available Training Scenarios
              </h2>
              <p className="text-muted-foreground">Select a scenario to begin your practice session</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {allScenarios.length} scenarios
              </Badge>
              <Button asChild className="gap-2">
                <Link href="/scenarios/create">
                  <Plus className="h-4 w-4" />
                  Create Scenario
                </Link>
              </Button>
            </div>
          </div>

          {allScenarios.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Hotel className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No scenarios available</CardTitle>
                <CardDescription className="text-center mb-4">
                  Get started by creating your first training scenario
                </CardDescription>
                <Button asChild>
                  <Link href="/scenarios/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scenario
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  previousSessions={userSessions}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 HospitalityAI Training Platform. Trusted by leading hospitality organizations worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
