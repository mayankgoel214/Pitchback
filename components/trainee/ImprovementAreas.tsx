import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import Link from 'next/link';

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
      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Performance Data Yet</h3>
        <p className="text-sm text-slate-400">Complete some scenarios to get personalized improvement recommendations</p>
      </div>
    );
  }

  // Calculate average scores for each competency
  const competencies: CompetencyData[] = [
    {
      name: 'Empathy',
      key: 'empathy',
      avgScore: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      improvements: [],
    },
    {
      name: 'Communication Clarity',
      key: 'clarity',
      avgScore: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      improvements: [],
    },
    {
      name: 'Problem Solving',
      key: 'problem_solving',
      avgScore: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      improvements: [],
    },
    {
      name: 'Professionalism',
      key: 'professionalism',
      avgScore: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
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
    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-rose-900/20 border-2 border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-400/30">
          <svg className="w-5 h-5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Areas for Improvement</h2>
      </div>

      {/* Weakest Competencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {weakestCompetencies.map((comp) => (
          <div
            key={comp.key}
            className={`border-2 rounded-xl p-5 ${getScoreColor(comp.avgScore)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  {comp.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{comp.name}</h3>
                  <p className="text-xs text-slate-400">Average Score</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{comp.avgScore.toFixed(0)}</div>
            </div>

            {comp.improvements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300 mb-2">Focus on:</p>
                {comp.improvements.map((improvement, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span className="flex-1">{improvement}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommended Scenarios */}
      {recommendedScenarios.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recommended Practice Scenarios
          </h3>
          <div className="space-y-2">
            {recommendedScenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="block group"
              >
                <div className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                      {scenario.title}
                    </h4>
                    <p className="text-xs text-slate-400">{scenario.difficulty}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
