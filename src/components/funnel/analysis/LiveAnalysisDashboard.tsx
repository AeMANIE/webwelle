'use client';

import AdminAnalysisView from './AdminAnalysisView';
import CustomerAnalysisView from './CustomerAnalysisView';
import { useAnalysisViewMode } from './useAnalysisViewMode';
import type { LeadAnalysisProps } from './types';

export default function LiveAnalysisDashboard({
  viewMode: viewModeOverride = 'auto',
  ...props
}: LeadAnalysisProps) {
  const detectedMode = useAnalysisViewMode();
  const viewMode =
    viewModeOverride === 'auto' ? detectedMode : viewModeOverride;

  if (viewMode === 'admin') {
    return <AdminAnalysisView {...props} />;
  }

  return <CustomerAnalysisView {...props} />;
}
