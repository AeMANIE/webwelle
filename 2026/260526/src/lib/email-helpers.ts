import type Stripe from 'stripe';

// Paket-Display-Namen basierend auf packageType und packageCategory
export function getPackageDisplayName(
  packageType: string,
  packageCategory?: string
): string {
  const names: Record<string, string> = {
    // Webdesign
    'starterwelle': 'StarterWelle',
    'businesswelle': 'BusinessWelle',
    'erfolgswelle': 'ErfolgsWelle',
    // KI
    'flowwelle': 'FlowWelle',
    'powerwelle': 'PowerWelle',
    'meisterwelle': 'MeisterWelle',
    // AI-Voice
    'minijob': 'Mini Job AI-Assistent',
    'midijob': 'Midi Job AI-Assistenz',
    'festangestellt': 'Festangestellt AI-Agent',
    'einrichtungspaket': 'Einrichtungspaket AI Voice'
  };
  
  return names[packageType] || packageType;
}

// Add-ons aus Metadata extrahieren
export function extractAddonsFromMetadata(
  metadata: Stripe.Metadata,
  session: Stripe.Checkout.Session
): Array<{ label: string; price: string; billing: 'oneTime' | 'monthly' | 'yearly' }> {
  const selectedAddons: Array<{ label: string; price: string; billing: 'oneTime' | 'monthly' | 'yearly' }> = [];
  
  // Für Webdesign-Pakete: selectedAddons aus formData
  if (metadata.packageCategory === 'webdesign' && metadata.formData) {
    try {
      const formData = JSON.parse(metadata.formData);
      if (formData.selectedAddons) {
        const addons = JSON.parse(formData.selectedAddons);
        
        // Add-on Labels Mapping
        const addonLabels: Record<string, string> = {
          'terminbuchung': 'Terminbuchungs-System',
          'online-shop': 'Online-Shop',
          'mitglieder-welle': 'MitgliederWelle',
          'lieferdienst': 'Lieferdienst',
          'google-my-business': 'Google My Business Komplettservice',
        };
        
        for (const addon of addons) {
          if (addon.key) {
            const label = addonLabels[addon.key] || addon.key;
            const price = addon.amountCents ? `${(addon.amountCents / 100).toFixed(2)} €` : '0 €';
            const billing = addon.billing === 'yearly' ? 'yearly' : (addon.billing === 'monthly' ? 'monthly' : 'oneTime');
            
            selectedAddons.push({ label, price, billing });
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Parsen der Add-ons aus formData:', error);
    }
  }
  
  // Für AI-Voice-Pakete: addonPriceIds aus metadata
  if (metadata.packageCategory === 'ai-voice' && metadata.addonPriceIds) {
    try {
      const addonPriceIds = JSON.parse(metadata.addonPriceIds);
      
      // AI-Voice Einrichtungspaket
      if (addonPriceIds.includes('price_1SOyytQoIwTqROayNXuZIxWy')) {
        selectedAddons.push({
          label: 'Einrichtungspaket AI Voice',
          price: '1.499,00 €',
          billing: 'oneTime'
        });
      }
    } catch (error) {
      console.error('Fehler beim Parsen der Add-ons aus addonPriceIds:', error);
    }
  }
  
  return selectedAddons;
}

