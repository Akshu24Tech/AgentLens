'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Binary, AlertCircle } from 'lucide-react';

interface ProjectMetrics {
  total_traces: number;
  total_spans: number;
  avg_duration: number;
  failure_rate: number;
}

interface ProjectDashboardProps {
  projectName: string;
  metrics: ProjectMetrics;
}

export function ProjectDashboard({ projectName, metrics }: ProjectDashboardProps) {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          {projectName} Overview
        </h1>
        <p className="text-muted-foreground mt-2">Real-time performance and usage metrics for this agentic ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-500/5 border-blue-500/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Traces</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total_traces}</div>
            <p className="text-xs text-muted-foreground">+2 since last hour</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-500/5 border-indigo-500/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spans</CardTitle>
            <Binary className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total_spans}</div>
            <p className="text-xs text-muted-foreground">{Math.round(metrics.total_spans / (metrics.total_traces || 1))} spans/trace avg</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avg_duration}s</div>
            <p className="text-xs text-muted-foreground">End-to-end execution</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(metrics.failure_rate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Error-terminated spans</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-4">Project Health</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground italic border border-dashed border-white/20 rounded-lg">
             Dynamic Health charts coming in Phase 5...
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-4">Top Agents & Tools</h3>
          <div className="space-y-4">
             {['ResearchAgent', 'GoogleSearch', 'PlanGenerator'].map(agent => (
               <div key={agent} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                 <span className="font-medium">{agent}</span>
                 <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/30">Active</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
