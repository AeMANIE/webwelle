export default function Widerruf() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Widerrufsrecht und Rückerstattungsrichtlinie
        </h1>
        <p className="text-center text-gray-300 mb-12">
          der AeManie GmbH
        </p>

        <div className="space-y-8">
          {/* Standard-Rückerstattungsbedingungen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Standard-Rückerstattungsbedingungen
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Produkte und Dienstleistungen, die bei <strong>AeManie GmbH</strong> erworben wurden, können ausschließlich dann rückerstattet werden, wenn Sie innerhalb von <strong>30 Tagen</strong> ab Kaufdatum Ihren Vertrag widerrufen.
              </p>
              
              <div className="bg-gray-800 p-4 border-l-4 border-gray-400">
                <h3 className="font-semibold mb-2 text-white">Wichtige Hinweise:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Aufgrund ihrer Beschaffenheit sind Kryptowährungen, Token und andere digitale Assets im Allgemeinen nicht rückerstattungsfähig und unterliegen starken Kursschwankungen.</li>
                  <li>Erfolgt ein Vertragsverstoß gegen geltendes Recht oder gegen die AGB von AeManie GmbH, besteht <strong>kein Anspruch auf Rückerstattung</strong>.</li>
                </ul>
              </div>
              
              <p>
                Das „Kaufdatum" im Sinne dieser Richtlinie ist das Datum des Erwerbs eines Produkts oder Dienstes – einschließlich automatischer Verlängerung gemäß den Bedingungen des jeweiligen Produkts oder Services.
              </p>
            </div>
          </div>

          {/* Produkte, die regulär rückerstattungsfähig sind */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Produkte, die regulär rückerstattungsfähig sind
            </h2>
            <div className="space-y-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>Hosting (alle Tarife, ausgenommen die erste Zahlung nach einer kostenlosen Testphase sowie alle VPS-Hosting-Tarife)</li>
                  <li>SSL-Zertifikate</li>
                  <li>Tägliche Backups</li>
                  <li>Cloudflare</li>
                  <li>Webwelle Email</li>
                  <li>Titan Email</li>
                  <li>Priority Support</li>
                  <li>NordVPN (6- und 12‑Monats-Tarife)</li>
                </ul>
                <ul className="list-disc list-inside space-y-2">
                  <li>Minecraft (Game Panel) VPS (mit Ausnahme von Upgrades)</li>
                  <li>KVM VPS (mit Ausnahme von Upgrades)</li>
                  <li>React/Next.js Addons</li>
                  <li>Dark Web Monitor</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Produkte, die NICHT rückerstattungsfähig sind */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Produkte, die <span className="text-red-400">nicht</span> rückerstattungsfähig sind
            </h2>
            <div className="space-y-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>Redemption Fees (Gebühren für Domain-Wiederherstellung)</li>
                  <li>Verlängerung von Domainnamen</li>
                  <li>Domain-Transfers (sofern der Transfer erfolgreich war)</li>
                  <li>Privacy Protection (Domain-Datenschutz)</li>
                  <li>SEO-Toolkit</li>
                  <li>SEO-Marketing-Paket</li>
                  <li>Google Workspace Email</li>
                  <li>VPS-Lizenzen</li>
                </ul>
                <ul className="list-disc list-inside space-y-2">
                  <li>Website-Cleanup</li>
                  <li>Upgrades für Minecraft (Game Panel) VPS</li>
                  <li>Upgrades für KVM VPS</li>
                  <li>Speicher-Addons für Webwelle/Hostinger Email</li>
                  <li>Boost-Tarife für Cloud Hosting (Paid Boost)</li>
                  <li>Hostinger Horizons Guthaben-Aufladung (Top Up)</li>
                  <li>Alle bezahlten Support-Services</li>
                  <li>Produkte/Dienste, die wegen missbräuchlicher Nutzung gesperrt wurden</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Besondere Rückerstattungsbedingungen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Besondere Rückerstattungsbedingungen
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Neuregistrierung von Domainnamen:</h3>
                  <p>Erstattungsfähig nur, wenn folgende Bedingungen erfüllt sind:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>die Rückerstattung wird innerhalb von <strong>96 Stunden</strong> nach Registrierung beantragt <strong>und</strong></li>
                    <li>seit der letzten Rückerstattung eines anderen Domains sind mehr als <strong>24 Stunden</strong> verstrichen</li>
                  </ul>
                  <p className="mt-2">
                    Für .br (inkl. .com.br, .net.br) Domains ist eine Rückerstattung nur möglich, wenn diese innerhalb von <strong>168 Stunden</strong> nach Registrierung beantragt wird.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Domain-Transfers:</h3>
                  <p>
                    Nur erstattungsfähig, wenn der Transfer <strong>nicht erfolgreich war</strong> und die Rückerstattung spätestens 30 Tage nach Zahlung beantragt wird.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">VPS-Hosting-Plan:</h3>
                  <p>
                    Nur, wenn die Rückerstattung innerhalb von 30 Tagen ab Kauf beantragt wird <strong>und</strong> zwischen zwei VPS-Rückerstattungen mindestens <strong>180 Tage</strong> liegen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rückerstattungen bei Sonderaktionen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Rückerstattungen bei Sonderaktionen
            </h2>
            <div className="space-y-4 text-white">
              <p>
                AeManie GmbH bietet gelegentlich Sonderaktionen an, beispielsweise eine kostenlose Domain beim Kauf eines Hosting-Pakets mit 12, 24 oder 48 Monaten Laufzeit.
              </p>
              
              <div className="bg-gray-800 p-4 border-l-4 border-gray-400">
                <h3 className="font-semibold mb-2 text-white">Bei diesen Aktionen gilt:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Kostenlose Domains, die im Rahmen von Sonderaktionen bereitgestellt werden, sind <strong>nicht rückerstattungsfähig</strong> (mit Ausnahme der Domains .br, .com.br und .net.br)</li>
                  <li>Ein Umtausch in andere Domains oder Produkte ist nicht möglich</li>
                  <li>In Einzelfällen kann AeManie GmbH den Differenzbetrag zwischen Ihrem gezahlten Betrag und dem Wert der kostenlosen Domain erstatten</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Zahlungsarten mit besonderen Rückerstattungsbedingungen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Zahlungsarten mit besonderen Rückerstattungsbedingungen
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Bitte beachten Sie, dass einzelne Zahlungsanbieter besondere Rückerstattungsrichtlinien haben und manche Zahlungsmethoden <strong>unter keinen Umständen rückerstattungsfähig sind</strong>:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Eingeschränkte Rückerstattungen:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Zahlungen per Multibanco (Portugal), GCash (Philippinen) und Fawry (Ägypten) können nicht auf die ursprüngliche Zahlungsquelle erstattet werden</li>
                    <li>In diesen Fällen ist ausschließlich eine Rückerstattung auf Ihr Guthaben bei AeManie GmbH möglich</li>
                    <li>Zahlungen über VTC Pay (Vietnam) unterstützen vollständige Rückerstattungen auf die ursprüngliche Zahlungsquelle</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Rückerstattung auf Guthaben:</h3>
                  <p>
                    Im Regelfall erfolgt eine Rückerstattung auf die ursprüngliche Zahlungsquelle. Sollte jedoch gewünscht sein, dass ein Guthaben sofort für andere Services genutzt wird, kann die Rückerstattung auf das interne AeManie-Guthabenkonto erfolgen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rückbuchungen und Zahlungsstreitigkeiten */}
          <div className="bg-red-900/20 p-6 border-l-4 border-red-400">
            <h2 className="text-2xl font-bold text-red-300 mb-4">
              Rückbuchungen und Zahlungsstreitigkeiten („Chargebacks")
            </h2>
            <div className="space-y-4 text-red-200">
              <p>
                Im Fall einer Rückbuchung, Zahlungsablehnung, Stornierung oder Betrugsanzeige – insbesondere einer Kreditkartenrückbuchung („Chargeback") – gilt Folgendes:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AeManie GmbH betrachtet dies als Verletzung Ihrer Zahlungsverpflichtungen und ist berechtigt, sämtliche rechtlichen Schritte einzuleiten</li>
                <li>Nach einer Chargeback wird die Möglichkeit, Services per Kreditkarte zu bezahlen, gesperrt</li>
                <li>Ihr Account kann blockiert werden und sämtliche Daten können unwiederbringlich gelöscht werden</li>
                <li>Erst nach Nachweis des legitimen Zahlungsmittels kann die Nutzung des Accounts ggf. wieder aktiviert werden</li>
                <li>Im Falle von betrügerischen Rückbuchungen erfolgt eine <strong>dauerhafte Sperrung des Accounts</strong> ohne Möglichkeit der Reaktivierung</li>
              </ul>
              
              <div className="bg-red-800/30 p-4 mt-4 border border-red-600">
                <p className="font-semibold text-red-200">
                  <strong>Hinweis:</strong> Vor Einleitung einer Rückbuchung empfehlen wir, zuerst unseren Kundensupport zu kontaktieren. So lassen sich vermeidbare Account-Sperren und unerwünschte Gebühren klären.
                </p>
              </div>
            </div>
          </div>

          {/* Kontakt */}
          <div className="bg-gray-800 p-6 border-l-4 border-gray-400">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Kontakt für Rückerstattungsanträge
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Für alle Rückerstattungsanträge und Fragen zum Widerrufsrecht wenden Sie sich bitte an:
              </p>
              <div className="bg-gray-700 p-4 border border-gray-600">
                <p className="text-white"><strong>AeManie GmbH</strong></p>
                <p className="text-white">E-Mail: <a href="mailto:info@webwelle.com" className="text-blue-400 hover:underline">info@webwelle.com</a></p>
                <p className="text-white">Website: <a href="https://webwelle.com" className="text-blue-400 hover:underline">https://webwelle.com</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Zurück Button */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-lg"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}