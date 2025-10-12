import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Heart, MessageCircle, Lightbulb, Briefcase, Zap, ArrowRight } from 'lucide-react';

interface ImprovementAreasProps {
  sessions: TrainingSession[];
  scenarios: Scenario[];
}

interface CompetencyData {
  name: string;
  key: 'empathy' | 'clarity' | 'problem_solving' | 'professionalism';
  avgScore: number;
  icon: React.ReactNode;
  improvements: string[];
}

export default function ImprovementAreas({ sessions, scenarios }: ImprovementAreasProps) {
  const completedSessions = sessions.filter((s) => s.status === 'completed' && s.scores);

  if (completedSessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <Lightbulb className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-sm text-muted-foreground">Complete some scenarios to get personalized improvement recommendations</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average scores for each competency
  const competencies: CompetencyData[] = [
    {
      name: 'Empathy',
      key: 'empathy',
      avgScore: 0,
      icon: <Heart className="w-5 h-5" />,
      improvements: [],
    },
    {
      name: 'Communication Clarity',
      key: 'clarity',
      avgScore: 0,
      icon: <MessageCircle className="w-5 h-5" />,
      improvements: [],
    },
    {
      name: 'Problem Solving',
      key: 'problem_solving',
      avgScore: 0,
      icon: <Lightbulb className="w-5 h-5" />,
      improvements: [],
    },
    {
      name: 'Professionalism',
      key: 'professionalism',
      avgScore: 0,
      icon: <Briefcase className="w-5 h-5" />,
      improvements: [],
    },
  ];

  // Calculate averages and collect improvements
  competencies.forEach((comp) => {
    const scores = completedSessions.map((s) => s.scores[comp.key]);
    comp.avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Collect unique improvement suggestions for this competency
    const improvementsSet = new Set<string>();
    completedSessions.forEach((session) => {
      if (session.evaluation?.detailed_feedback?.[comp.key]?.areas_for_improvement) {
        session.evaluation.detailed_feedback[comp.key].areas_for_improvement.forEach((item) => {
          improvementsSet.add(item);
        });
      }
    });
    comp.improvements = Array.from(improvementsSet).slice(0, 3);
  });

  // Sort by lowest score first (areas needing most improvement)
  const sortedCompetencies = [...competencies].sort((a, b) => a.avgScore - b.avgScore);
  const weakestCompetencies = sortedCompetencies.slice(0, 2);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  // Find scenarios that match weak competencies
  const recommendedScenarios = scenarios.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-xl">Areas for Improvement</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {/* Weakest Competencies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {weakestCompetencies.map((comp) => (
            <Card
              key={comp.key}
              className={`border-2 ${getScoreColor(comp.avgScore)}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {comp.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{comp.name}</h3>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{comp.avgScore.toFixed(0)}</div>
                </div>

                {comp.improvements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold mb-2">Focus on:</p>
                    {comp.improvements.map((improvement, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span className="flex-1">{improvement}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Scenarios */}
        {recommendedScenarios.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Recommended Practice Scenarios
              </h3>
              <div className="space-y-2">
                {recommendedScenarios.map((scenario) => (
                  <Link
                    key={scenario.id}
                    href={`/scenarios/${scenario.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-3 bg-background hover:bg-muted border hover:border-blue-500/50 rounded-lg transition-all">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {scenario.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{scenario.difficulty}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
