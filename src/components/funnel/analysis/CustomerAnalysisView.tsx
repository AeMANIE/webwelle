'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Lightbulb,
  Palette,
  Puzzle,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CUSTOMER_COPY, mapCustomerAnalysisViewModel } from '@/lib/funnel/analysis/map-customer-analysis';
import { customerFeatureLabel } from '@/lib/funnel/analysis/analysis-sanitize';
import type { AnalysisTabKey } from '@/lib/funnel/analysis/analysis-types';
import {
  ANIMATION_ADDON,
  BLOG_BUNDLE_10,
  BRANDING_ADDON,
  SEO_PROFI_ADDON,
  effectiveSeoProfi,
  type BlogMode,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';
import { AnalysisHeader } from './AnalysisHeader';
import { AnalysisSummaryCards } from './AnalysisSummaryCards';
import { AddonSelectionCard } from './AddonSelectionCard';
import { ChartInsightWrapper } from './ChartInsightWrapper';
import { StickyAddonSummary } from './StickyAddonSummary';
import {
  DesignScoreChart,
  KeywordDetailsPieChart,
  KeywordVolumeChart,
  PerformanceRadarChart,
  performanceBadgeLabel,
} from './AnalysisCharts';
import { DesignCompetitorSection } from './DesignCompetitorSection';
import { PerformanceSiteSection } from './PerformanceSiteSection';
import { SectionHeading } from './SectionHeading';
import { usePersistedAddonSelection } from './usePersistedAddonSelection';
import type { LeadAnalysisProps } from './types';

const TABS: { key: AnalysisTabKey; label: string }[] = [
  { key: 'seo', label: 'Sichtbarkeit' },
  { key: 'design', label: 'Außenwirkung' },
  { key: 'performance', label: 'Performance' },
  { key: 'recommendation', label: 'Empfehlung' },
];

export default function CustomerAnalysisView({
  lead,
  research,
  token,
  onRefresh,
  pollCount = 0,
  maxPolls = 60,
  onContinue,
  showContinueCta = false,
  continueLoading = false,
  continueError = null,
  continueLabel = 'Jetzt bezahlen',
}: LeadAnalysisProps) {
  const [tab, setTab] = useState<AnalysisTabKey>('seo');
  const [mounted, setMounted] = useState(false);
  const tabSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const openTabFromCard = useCallback((nextTab: AnalysisTabKey) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const vm = useMemo(
    () =>
      mapCustomerAnalysisViewModel({
        lead,
        research,
        pollCount,
        maxPolls,
      }),
    [lead, research, pollCount, maxPolls]
  );

  const { selection, setSelection, saving } = usePersistedAddonSelection(
    token,
    lead.addon_selection as FunnelAddonSelection | null | undefined,
    onRefresh
  );

  function setBlogMode(mode: BlogMode) {
    setSelection((prev) => ({ ...prev, blogMode: mode }));
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <AnalysisHeader vm={vm} />
      <AnalysisSummaryCards vm={vm} activeTab={tab} onOpenTab={openTabFromCard} />

      <div ref={tabSectionRef} className="scroll-mt-6 space-y-6">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              `relative px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ` +
              (tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'seo' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <SectionHeading as="h2" icon={Search}>
              {CUSTOMER_COPY.seoTabTitle}
            </SectionHeading>
            <p className="text-sm text-muted-foreground mt-1">{CUSTOMER_COPY.seoTabIntro}</p>
          </div>
          {vm.topKeywords.length > 0 && (
            <div>
              <SectionHeading icon={Search} className="mb-2">
                Gefragte Suchbegriffe
              </SectionHeading>
              <div className="flex flex-wrap gap-2">
                {vm.topKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {vm.visibilityGaps.length > 0 && (
            <div>
              <SectionHeading icon={TrendingUp} className="mb-2">
                Wo noch Potenzial liegt
              </SectionHeading>
              <p className="text-sm text-muted-foreground mb-2">
                Diese Themen werden in Ihrer Region gesucht und bieten gute Chancen für mehr
                Sichtbarkeit.
              </p>
              <ul className="space-y-1 text-sm">
                {vm.visibilityGaps.map((g) => (
                  <li key={g}>• {g}</li>
                ))}
              </ul>
            </div>
          )}
          <ChartInsightWrapper
            mode="customer"
            title={CUSTOMER_COPY.chartKeywordTitle}
            intro={CUSTOMER_COPY.chartKeywordIntro}
            icon={BarChart3}
            chart={
              <KeywordVolumeChart keywords={vm.parsed.keywords} mounted={mounted} />
            }
            details={
              <KeywordDetailsPieChart keywords={vm.parsed.keywords} mounted={mounted} />
            }
          />
          <div className="space-y-3 pt-2 border-t border-border">
            <SectionHeading icon={Puzzle}>Passende Erweiterungen</SectionHeading>
            <AddonSelectionCard
              title={SEO_PROFI_ADDON.name}
              description={SEO_PROFI_ADDON.description}
              priceCents={SEO_PROFI_ADDON.priceCents}
              selected={effectiveSeoProfi(selection)}
              disabled={saving}
              onToggle={() =>
                setSelection((p) => ({ ...p, seoProfi: !p.seoProfi }))
              }
            />
            <AddonSelectionCard
              title={BLOG_BUNDLE_10.name}
              description={BLOG_BUNDLE_10.description}
              priceCents={BLOG_BUNDLE_10.priceCents}
              selected={selection.blogMode === 'bundle_10'}
              disabled={saving}
              onToggle={() =>
                setBlogMode(selection.blogMode === 'bundle_10' ? 'none' : 'bundle_10')
              }
            />
          </div>
        </div>
      )}

      {tab === 'design' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <SectionHeading as="h2" icon={Palette}>
              {CUSTOMER_COPY.designTabTitle}
            </SectionHeading>
            <p className="text-sm text-muted-foreground mt-1">{CUSTOMER_COPY.designTabIntro}</p>
          </div>
          <ChartInsightWrapper
            mode="customer"
            title={CUSTOMER_COPY.chartDesignTitle}
            intro={CUSTOMER_COPY.chartDesignIntro}
            icon={BarChart3}
            chart={
              <DesignScoreChart competitors={vm.parsed.competitors} mounted={mounted} />
            }
          />
          <DesignCompetitorSection
            competitors={vm.parsed.competitors}
            existingWebsiteUrl={lead.existing_website_url}
          />
          <div className="space-y-3 pt-2 border-t border-border">
            <SectionHeading icon={Sparkles}>Design-Erweiterungen</SectionHeading>
            <AddonSelectionCard
              title={BRANDING_ADDON.name}
              description={BRANDING_ADDON.description}
              priceCents={BRANDING_ADDON.priceCents}
              selected={selection.brandingSelected}
              disabled={saving}
              onToggle={() =>
                setSelection((p) => ({ ...p, brandingSelected: !p.brandingSelected }))
              }
            />
            <AddonSelectionCard
              title={ANIMATION_ADDON.name}
              description={ANIMATION_ADDON.description}
              priceCents={ANIMATION_ADDON.priceCents}
              selected={selection.animationSelected}
              disabled={saving}
              onToggle={() =>
                setSelection((p) => ({ ...p, animationSelected: !p.animationSelected }))
              }
            />
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <SectionHeading as="h2" icon={Zap}>
              {CUSTOMER_COPY.performanceTabTitle}
            </SectionHeading>
            <p className="text-sm text-muted-foreground mt-1">{CUSTOMER_COPY.performanceTabIntro}</p>
          </div>
          <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            {performanceBadgeLabel(vm.performanceBadge)}
          </div>
          <ChartInsightWrapper
            mode="customer"
            title={CUSTOMER_COPY.chartPerformanceTitle}
            intro={CUSTOMER_COPY.chartPerformanceIntro}
            icon={Radar}
            chart={
              <PerformanceRadarChart sites={vm.parsed.performanceSites} mounted={mounted} />
            }
          />
          <PerformanceSiteSection
            sites={vm.parsed.performanceSites}
            existingWebsiteUrl={lead.existing_website_url}
          />
        </div>
      )}

      {tab === 'recommendation' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <SectionHeading as="h2" icon={Lightbulb}>
              {CUSTOMER_COPY.recommendationTabTitle}
            </SectionHeading>
            <p className="text-sm text-muted-foreground mt-1">{CUSTOMER_COPY.recommendationTabIntro}</p>
          </div>
          <p className="text-sm leading-relaxed">{vm.recommendationSummary}</p>
          <p className="text-sm font-medium text-primary">{vm.starterWelleFit}</p>
          {vm.parsed.recommendations.length > 0 && (
            <ul className="space-y-2 text-sm">
              {vm.parsed.recommendations.slice(0, 6).map((r, i) => {
                const label = r.feature || r.label || r.title || r.text || `Empfehlung ${i + 1}`;
                return <li key={i}>• {customerFeatureLabel(String(label))}</li>;
              })}
            </ul>
          )}
        </div>
      )}

      </div>

      <StickyAddonSummary
        selection={selection}
        saving={saving}
        showContinue={showContinueCta}
        onContinue={onContinue}
        continueLoading={continueLoading}
        continueError={continueError}
        continueLabel={continueLabel}
      />
    </div>
  );
}
