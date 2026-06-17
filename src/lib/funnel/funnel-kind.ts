import type { FunnelKind } from './types';

const DWA_SOURCES = new Set(['leistungen_digitale_wachstumsarchitektur']);

export function funnelKindFromSource(source?: string): FunnelKind {
  if (source && DWA_SOURCES.has(source)) return 'wachstumsarchitektur';
  return 'starterwelle';
}

export function funnelStartPath(kind: FunnelKind, token: string): string {
  if (kind === 'wachstumsarchitektur') {
    return `/funnel-dw/2?t=${encodeURIComponent(token)}`;
  }
  return `/funnel-2?t=${encodeURIComponent(token)}`;
}

export function funnelResumePath(kind: FunnelKind, token: string): string {
  if (kind === 'wachstumsarchitektur') {
    return `/funnel-dw/4?t=${encodeURIComponent(token)}`;
  }
  return `/funnel-5?t=${encodeURIComponent(token)}`;
}

export function isWachstumsarchitekturLead(lead: { funnel_kind?: FunnelKind | string }): boolean {
  return lead.funnel_kind === 'wachstumsarchitektur';
}
