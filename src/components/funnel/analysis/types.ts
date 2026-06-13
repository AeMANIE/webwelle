import type { FunnelAddonSelection } from '@/lib/funnel/packages';
import type { ResearchItem } from '@/lib/funnel/analysis/analysis-types';

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
  onContinue?: () => void;
  showContinueCta?: boolean;
};
