'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Binary, AlertCircle, Bot, Wrench, Cpu, TrendingUp } from 'lucide-react';
import { api, ProjectMetrics } from '@/lib/api';

interface TopSpan {
  name: string;
  type: string;
  count: number;
}

interface ProjectDashboardProps {
  projectName: string;
  metrics: ProjectMetrics | null;
  isLoading?: boolean;
}

export function ProjectDashboard({ projectName, metrics, isLoading }: ProjectDashboardProps) {
  const [topSpans, setTopSpans] = useState<TopSpan[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!projectName) return;
    // Fetch traces to derive top agents/tools
    api.get('/traces', { params: { project_id: projectName } })
      .then(async (res) => {
        const traces = res.data as { trace_id: string }[];
        if (!traces.length) return;

        // Fetch spans for the 5 most recent traces
        const recent = traces.slice(0, 5);
        const spanResults = await Promise.all(
          recent.map(t => api.get(`/traces/${t.trace_id}`).then(r => r.data.spans).catch(() => []))
        );
        const allSpans = spanResults.flat() as { name: string; type: string }[];

        // Count by name
        const counts: Record<string, { type: string; count: number }> = {};
        allSpans.forEach(s => {
          if (!counts[s.name]) counts[s.name] = { type: s.type, count: 0 };
          counts[s.name].count++;
        });

        const sorted = Object.entries(counts)
          .map(([name, v]) => ({ name, type: v.type, count: v.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setTopSpans(sorted);

        // Build simple activity bars (spans per trace)
        const activity = recent.map((t, i) => ({
          label: `T${i + 1}`,
          value: (spanResults[i] as unknown[]).length,
        }));
        setRecentActivity(activity);
      })
      .catch(() => {});
  }, [projectName, metrics]);

  const MetricCard = ({
    title, value, sub, icon: Icon, color,
  }: {
    title: string; value: string | number; sub: string;
    icon: React.ElementType; color: string;
  }) => (
    <Card className={`bg-${color}-500/5 border-${color}-500/10 backdrop-blur-md`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-400`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{isLoading ? '—' : value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );

  const typeIcon = (type: string) => {
    if (type === 'agent') return <Bot className="w-3.5 h-3.5 text-blue-400" />;
    if (type === 'tool') return <Wrench className="w-3.5 h-3.5 text-orange-400" />;
    return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
  };

  const typeColor = (type: string) => {
    if (type === 'agent') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (type === 'tool') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  const maxActivity = Math.max(...recentActivity.map(a => a.value), 1);

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          {projectName}
        </h1>
        <p className="text-muted-foreground mt-2">Real-time performance and usage metrics for this agentic ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Traces"
          value={metrics?.total_traces ?? 0}
          sub="Agent execution sessions"
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Total Spans"
          value={metrics?.total_spans ?? 0}
          sub={`${metrics ? Math.round(metrics.total_spans / (metrics.total_traces || 1)) : 0} spans/trace avg`}
          icon={Binary}
          color="indigo"
        />
        <MetricCard
          title="Avg Latency"
          value={metrics ? `${metrics.avg_duration}s` : '0s'}
          sub="End-to-end execution"
          icon={BarChart3}
          color="emerald"
        />
        <MetricCard
          title="Failure Rate"
          value={metrics ? `${(metrics.failure_rate * 100).toFixed(1)}%` : '0%'}
          sub="Error-terminated spans"
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-semibold">Span Activity (Recent Traces)</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm border border-dashed border-white/10 rounded-lg">
              Run some agents to see activity
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-gray-500">{item.value}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                    style={{ height: `${(item.value / maxActivity) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top agents & tools */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-semibold">Top Agents &amp; Tools</h3>
          </div>
          {topSpans.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm border border-dashed border-white/10 rounded-lg">
              No span data yet
            </div>
          ) : (
            <div className="space-y-3">
              {topSpans.map(span => (
                <div key={span.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-2.5">
                    {typeIcon(span.type)}
                    <span className="text-sm font-medium text-gray-200 truncate max-w-[160px]">{span.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{span.count}×</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${typeColor(span.type)}`}>
                      {span.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
