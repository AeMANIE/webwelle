'use client';

import AdminAnalysisView from './AdminAnalysisView';
import CustomerAnalysisView from './CustomerAnalysisView';
import { useAnalysisViewMode } from './useAnalysisViewMode';
import type { LeadAnalysisProps } from './types';

export default function LiveAnalysisDashboard(props: LeadAnalysisProps) {
  const viewMode = useAnalysisViewMode();

  if (viewMode === 'admin') {
    return <AdminAnalysisView {...props} />;
  }

  return <CustomerAnalysisView {...props} />;
}
