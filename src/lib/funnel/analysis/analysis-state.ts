import { isFunnelResearchComplete } from '@/lib/funnel/research';
import type { AnalysisLoadState, ResearchItem } from './analysis-types';

export function resolveAnalysisLoadState(input: {
  research: ResearchItem[];
  pollCount: number;
  maxPolls: number;
  hasLoadError?: boolean;
}): AnalysisLoadState {
  if (input.hasLoadError) return 'error';
  if (!input.research.length) {
    return input.pollCount > 0 ? 'polling' : 'loading';
  }

  const complete = isFunnelResearchComplete(input.research);
  const anyTerminal = input.research.some((r) => r.status === 'done' || r.status === 'error');
  const anyError = input.research.some((r) => r.status === 'error');

  if (complete) return 'ready';
  if (input.pollCount >= input.maxPolls) {
    return anyTerminal ? 'partial-ready' : 'timeout';
  }
  if (anyTerminal && !complete) return 'partial-ready';
  if (anyError && !complete) return 'partial-ready';
  return 'polling';
}
