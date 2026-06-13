import { resolveAnalysisLoadState } from './analysis-state';
import { parseResearchData } from './parse-research';
import type {
  AdminAnalysisViewModel,
  FunnelLeadSnapshot,
  ResearchItem,
} from './analysis-types';

export function mapAdminAnalysisViewModel(input: {
  lead: FunnelLeadSnapshot;
  research: ResearchItem[];
  pollCount?: number;
  maxPolls?: number;
  hasLoadError?: boolean;
}): AdminAnalysisViewModel {
  const parsed = parseResearchData(input.research, input.lead);
  const state = resolveAnalysisLoadState({
    research: input.research,
    pollCount: input.pollCount ?? 0,
    maxPolls: input.maxPolls ?? 60,
    hasLoadError: input.hasLoadError,
  });

  const workflows = input.research.map((r) => ({
    key: r.workflow_key,
    status: r.status,
    updatedAt: r.updated_at,
    hasPayload: Boolean(r.payload && Object.keys(r.payload).length > 0),
  }));

  return {
    state,
    workflows,
    parsed,
    lead: input.lead,
  };
}
