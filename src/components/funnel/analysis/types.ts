import type { FunnelAddonSelection } from '@/lib/funnel/packages';
import type { ResearchItem } from '@/lib/funnel/analysis/analysis-types';

export type AnalysisViewModeOverride = 'auto' | 'customer' | 'admin';

export type LeadAnalysisProps = {
  lead: {
    industry_normalized?: string;
    industry_raw?: string;
    postal_code?: string;
    city?: string;
    market?: string;
    design_reference_urls?: string[];
    addon_selection?: FunnelAddonSelection | null;
    design_preferences?: {
      interactiveElements?: string;
      informationDensity?: string;
      visualStyle?: string;
    } | null;
    existing_website?: boolean | null;
    existing_website_url?: string | null;
  };
  research: ResearchItem[];
  token: string;
  onRefresh: () => void;
  pollCount?: number;
  maxPolls?: number;
  onContinue?: () => void | Promise<void>;
  showContinueCta?: boolean;
  continueLoading?: boolean;
  continueError?: string | null;
  continueLabel?: string;
  /** Funnel-5 should always show the customer UI; staff preview uses ?view=admin */
  viewMode?: AnalysisViewModeOverride;
};
