'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import ScenarioCard from '@/components/trainee/ScenarioCard';
import { Scenario } from '@/lib/types/scenario';
import { TrainingSession } from '@/lib/types/session';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Plus, Search, Hotel } from 'lucide-react';

export default function ScenariosPage() {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { user, token } = useAuthContext();

  // Fetch scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/scenarios', { headers });
        const data = await response.json();

        if (data.success) {
          setAllScenarios(data.data);
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [token]);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) return;

      try {
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
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, [user?.id, token]);

  // Get unique categories
  const categories = Array.from(new Set(allScenarios.map(s => s.category)));

  // Filter scenarios
  let filteredScenarios = allScenarios;

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredScenarios = filteredScenarios.filter(
      s =>
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.context_description?.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (categoryFilter !== 'all') {
    filteredScenarios = filteredScenarios.filter(s => s.category === categoryFilter);
  }

  // Difficulty filter
  if (difficultyFilter !== 'all') {
    filteredScenarios = filteredScenarios.filter(s => s.difficulty === difficultyFilter);
  }

  // Calculate stats
  const completedScenarios = new Set(
    userSessions.filter(s => s.status === 'completed').map(s => s.scenario_id)
  ).size;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Training Scenarios</h1>
        <p className="text-xl text-muted-foreground">
          Browse and practice all available training scenarios
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Scenarios</p>
                <p className="text-3xl font-bold">{allScenarios.length}</p>
              </div>
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{completedScenarios}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                <p className="text-3xl font-bold text-blue-600">
                  {allScenarios.length - completedScenarios}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link href="/scenarios/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Scenario
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
            <Tabs value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="beginner">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.slice(0, 4).map((cat) => (
                    <TabsTrigger key={cat} value={cat}>
                      {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {/* Filter results count */}
        {(searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredScenarios.length} {filteredScenarios.length === 1 ? 'scenario' : 'scenarios'} found
            </Badge>
            {(searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setDifficultyFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scenarios Grid */}
      {filteredScenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Hotel className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">
              {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all'
                ? 'No scenarios found'
                : 'No scenarios available'}
            </CardTitle>
            <CardDescription className="text-center mb-4">
              {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first training scenario'}
            </CardDescription>
            {!searchQuery && categoryFilter === 'all' && difficultyFilter === 'all' && (
              <Button asChild>
                <Link href="/scenarios/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scenario
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              previousSessions={userSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
