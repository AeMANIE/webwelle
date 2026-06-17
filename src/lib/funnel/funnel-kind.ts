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
    return dwaResumePath('consultation_requested', token);
  }
  return `/funnel-5?t=${encodeURIComponent(token)}`;
}

/** Statusabhängiger DWA-Funnel-Link für Admin und Portal */
export function dwaResumePath(status: string, token: string): string {
  const t = encodeURIComponent(token);
  if (status === 'new') return `/funnel-dw/2?t=${t}`;
  if (status === 'research_running') return `/funnel-dw/3?t=${t}`;
  return `/funnel-dw/4?t=${t}`;
}

export function dwaResumeStepLabel(status: string): string {
  if (status === 'new') return '2';
  if (status === 'research_running') return '3';
  return '4';
}

export function isWachstumsarchitekturLead(lead: { funnel_kind?: FunnelKind | string }): boolean {
  return lead.funnel_kind === 'wachstumsarchitektur';
}
