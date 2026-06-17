import { Check } from 'lucide-react';
import HeroIndustrySearch from '@/components/funnel/HeroIndustrySearch';
import type { LeistungOffer } from './leistungen-offers';

export interface ProductPackageCardProps {
  offer: LeistungOffer;
}

export default function ProductPackageCard({ offer }: ProductPackageCardProps) {
  return (
    <div
      id={offer.id}
      className="scroll-mt-28 bg-card rounded-xl p-8 border border-border shadow-md hover:shadow-xl transition-all duration-300 overflow-visible"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2 tracking-wide">
          {offer.title}
        </h3>
        <p className="text-sm text-primary-on-card font-semibold mb-2 italic">
          {offer.tagline}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <h4 className="text-base font-semibold text-foreground">{offer.audienceHeading}</h4>
        {offer.audienceText ? (
          <p className="text-foreground text-sm leading-relaxed">{offer.audienceText}</p>
        ) : (
          offer.audienceItems.map((item) => (
            <div key={item} className="flex items-start">
              <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-foreground text-sm leading-relaxed">{item}</span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 mb-8">
        <h4 className="text-base font-semibold text-foreground">{offer.useCaseHeading}</h4>
        {offer.useCaseItems.map((item) => (
          <div key={item} className="flex items-start">
            <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-foreground text-sm leading-relaxed">{item}</span>
          </div>
        ))}
      </div>

      <div className="pt-8 mt-8 border-t border-border">
        <h4 className="text-base font-semibold text-foreground mb-2">
          {offer.ctaHeading}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {offer.ctaDescription}
        </p>
        <HeroIndustrySearch
          variant="card"
          inputId={offer.inputId}
          source={offer.source}
          funnelKind={offer.funnelKind}
          submitLabel={offer.submitLabel}
          className="pb-2"
        />
      </div>
    </div>
  );
}
