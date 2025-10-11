export default function AGB() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-center text-gray-300 mb-12">
          der AeManie GmbH
        </p>

        <div className="space-y-8">
          {/* 1. Überblick */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. Überblick
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Diese Hosting-Vereinbarung („Vereinbarung") wird geschlossen zwischen der <strong>AeManie GmbH</strong>, Uhlandstraße 16, 87437 Kempten (Allgäu) („AeManie", „wir", „uns") und dem Kunden („Sie", „Ihr", „Nutzer"), und tritt mit Ihrer elektronischen Zustimmung in Kraft.
              </p>
              <p>
                Diese Vereinbarung regelt die Bedingungen Ihrer Nutzung unserer Hosting-Dienstleistungen („Leistungen") und stellt die vollständige Vereinbarung zwischen Ihnen und AeManie hinsichtlich der hierin geregelten Themen dar.
              </p>
              <p>
                Mit Ihrer elektronischen Zustimmung erkennen Sie an, dass Sie diese Vereinbarung sowie die universellen Nutzungsbedingungen auf <strong>webwelle.com</strong>, die hiermit durch Bezugnahme Bestandteil dieser Vereinbarung sind, gelesen und akzeptiert haben.
              </p>
              <div className="bg-gray-800 p-4 border-l-4 border-gray-400">
                <p className="text-white">
                  <strong>Wichtiger Hinweis:</strong> AeManie GmbH behält sich das Recht vor, diese Vereinbarung, die zugehörigen Richtlinien oder Konditionen sowie etwaige Grenzen oder Einschränkungen der Leistungen nach eigenem Ermessen jederzeit zu ändern oder anzupassen. Solche Änderungen treten unmittelbar nach Veröffentlichung auf der Website in Kraft.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Beschreibung der Leistungen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. Beschreibung der Leistungen
            </h2>
            <div className="space-y-4 text-white">
              <p>Wir bieten verschiedene Hosting-Pakete an:</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Webhosting</h3>
                  <p>
                    Beim Erwerb von Webhosting wird Ihre Website auf einen oder mehrere Server platziert, deren Ressourcen mit anderen Kunden geteilt werden. Ihre Seite erhält jedoch eine eindeutige Adresse (DNS).
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Virtuelle Private Server („VPS")</h3>
                  <p>
                    Beim Erwerb eines VPS teilen Sie sich den physischen Server mit anderen Kunden, verfügen aber über volle Kontrolle über Ihren eigenen Serverbereich sowie die vollständige Konfiguration Ihrer Instanz. Sie erhalten Administrator-/Root-Zugriff und eine eigene, dedizierte IP-Adresse.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Einschränkungen; Kündigung des Kontos */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. Einschränkungen; Kündigung des Kontos
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Migration von Servern:</h3>
                  <p>
                    Sie erkennen an und stimmen zu, dass es im normalen Geschäftsbetrieb notwendig sein kann, Server zu migrieren. Daher kann ungeachtet einer dedizierten IP-Adresse eine andere IP vergeben werden. Es besteht keine Garantie auf dauerhaften Erhalt einmal vergebener IP-Adressen.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Beendigung der Leistungen:</h3>
                  <p>
                    Mit Ablauf oder Kündigung Ihrer gebuchten Leistungen sind Sie verpflichtet, die Nutzung der Dienste einzustellen und alle im Zusammenhang mit den Diensten zugewiesenen IP-Adressen oder Server-Namen freizugeben. Insbesondere müssen Sie die Domains (DNS) von unseren Servern wegführen.
                  </p>
                  <p className="mt-2 font-semibold text-yellow-300">
                    Wichtig: Vor Beendigung der Dienste liegt es in Ihrer Verantwortung, sämtliche Webseiten‑, Datenbank‑ oder Serverinhalte von unseren Systemen zu sichern und zu übertragen.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Kostenlose Produkt-Gutschriften:</h3>
                  <p>
                    Mit Beendigung aller Leistungen verfallen sämtliche im Rahmen der Leistungen bereitgestellten kostenlosen Produktgutschriften oder Zugänge.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Ihre Pflichten */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Ihre Pflichten
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Missbräuchliche Aktivitäten:</h3>
                  <p>
                    Sie verpflichten sich, unsere Server und Ihre Website nicht als Quelle, Zwischensystem, Antwortadresse oder Zieladresse für sogenannte Mailbomben, Internetangriffe (wie Paketflutung, Paketbeschädigung, Denial-of-Service) oder andere missbräuchliche Aktivitäten zu verwenden.
                  </p>
                  <p className="mt-2">
                    Zusätzlich zu den Verhaltensregeln unserer universellen Nutzungsbedingungen verpflichten Sie sich unter anderem dazu, unsere Dienste nicht zu nutzen, um:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-4 mt-2">
                    <li>Inhalte zu verbreiten, die nach vernünftiger Betrachtung als extrem anstößig, vulgär oder böswillig gelten.</li>
                    <li>Personen über Absender, Herkunft oder Quelle von Nachrichten irrezuführen.</li>
                    <li>Sich unbefugt oder über Ihre Berechtigungsstufe hinaus Zugang zu Computersystemen, Servern, Netzwerken oder Accounts Dritter zu verschaffen oder dessen zu versuchen.</li>
                    <li>Aktivitäten durchzuführen, die nach unserem Ermessen im Widerspruch zum Geist oder Zweck dieser Vereinbarung oder unserer Richtlinien stehen.</li>
                    <li>Ihren Server als "Open Relay" oder für ähnliche Zwecke zu benutzen.</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Speicherung und Sicherheit:</h3>
                  <p>Sie sind allein dafür verantwortlich:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4 mt-2">
                    <li>Maßnahmen zur Vermeidung von Datenverlusten oder ‑schäden zu ergreifen</li>
                    <li>eigenständig Sicherungen (Backups) Ihrer Webseiten- und Serverdaten zu erstellen</li>
                    <li>die Sicherheit und Vertraulichkeit aller über unsere Systeme gespeicherten oder übertragenen Inhalte sicherzustellen</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Datenschutz & Datensicherheit:</h3>
                  <p>
                    Sie sind allein verantwortlich und verpflichtet, sämtliche Anforderungen der Datenschutzgesetze, insbesondere der Datenschutz-Grundverordnung (DSGVO, EU 2016/679), für alle über Ihre Website oder Server verarbeiteten personenbezogenen Daten einzuhalten.
                  </p>
                  <p className="mt-2 font-semibold text-yellow-300">
                    Für diese Daten gelten Sie als Verantwortlicher gemäß DSGVO, jegliche Haftung der AeManie GmbH wird ausdrücklich ausgeschlossen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Besondere Bestimmungen zum Webhosting */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Besondere Bestimmungen zum Webhosting
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Speicher- und Paketgrenzen:</h3>
                  <p>
                    Alle Hosting-Tarife, auch solche mit explizit "unbegrenzten" Ressourcen, unterliegen technischen Grenzen wie: Inode-Anzahl, Datenbankgröße, CPU-Leistung, RAM, gleichzeitige Zugriffe und Prozesse.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Inhaltsbeschränkungen:</h3>
                  <p>Es ist untersagt, folgende Inhalte oder Funktionen auf Ihrer Website bereitzustellen:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Onlinedienste zur anonymen Bild‑ oder Dateiablage für andere Websites</li>
                    <li>Werbebannerdienste für Dritte („Banner Rotation")</li>
                    <li>kommerzielles Audiostreaming (mehr als ein bis zwei Streams gleichzeitig)</li>
                    <li>E-Mail-Serverdienste, die dem Versand von Massen-/Sammelmailings dienen</li>
                    <li>Massen-SMS-Gateways ohne Zuordnung</li>
                    <li>Sicherungen oder Spiegelungen von Inhalten fremder Systeme</li>
                    <li>Bittorrent‑Tracker oder vergleichbare Filesharing-Dienste</li>
                    <li>Scripte, die nachweislich die Performance oder Verfügbarkeit des Servers gefährden</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Unlimitierte Leistungen:</h3>
                  <p>
                    Manche Tarife enthalten unlimitierte Funktionen, d. h. keine festen Begrenzungen für bestimmte Ressourcen. Dennoch gilt stets eine Fair‑Use‑Regel. Unlimitierte Leistungen sind für die typische Nutzung kleiner Unternehmen bestimmt, nicht für den massenhaften Datenverkehr.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Besondere Bestimmungen für VPS-Hosting */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Besondere Bestimmungen für VPS-Hosting
            </h2>
            <div className="space-y-4 text-white">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">cPanel:</h3>
                <p>
                  Falls Sie cPanel zu Ihrem Server hinzufügen, erkennen Sie an, dass die cPanel-Endnutzer-Lizenzbedingungen (EULA) Anwendung finden und Bestandteil dieser Vereinbarung sind.
                </p>
              </div>
            </div>
          </div>

          {/* 7. Service-Verfügbarkeitsgarantie */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              7. Service-Verfügbarkeitsgarantie
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Wir gewähren eine monatliche <strong>Verfügbarkeitsgarantie von 99,9 %</strong> („Service-Uptime-Garantie") für unsere Dienste. Falls diese Verfügbarkeit in einem Kalendermonat nicht erreicht wird, können Sie innerhalb von 30 Tagen nach der Störung eine Gutschrift in Höhe von 5 % Ihres monatlichen Hosting-Preises beantragen.
              </p>
              
              <div className="bg-gray-800 p-4 border-l-4 border-gray-400">
                <h4 className="font-semibold text-white mb-2">Die Service-Uptime-Garantie gilt nicht bei:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
                  <li>planmäßigen Wartungs- oder Reparaturarbeiten</li>
                  <li>von Ihnen verursachten Störungen</li>
                  <li>Ausfällen, die nur FTP- oder E-Mail-Services betreffen</li>
                  <li>Ursachen, die außerhalb unseres Einflussbereichs liegen</li>
                  <li>Verstößen gegen unsere Allgemeinen Geschäftsbedingungen</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 8. Geld-zurück-Garantie */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              8. Geld-zurück-Garantie
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Produkte und Dienstleistungen, die für Rückerstattungen in Frage kommen, sind in unserer „Rückerstattungs-Richtlinie" (Refund Policy) beschrieben.
              </p>
            </div>
          </div>

          {/* 9. Drittanbieter-Software */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              9. Drittanbieter-Software
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Definition:</h3>
                  <p>
                    „Drittanbieter-Software" bezeichnet jede Software oder Anwendung, die von einem Drittanbieter entwickelt und bereitgestellt wird und von AeManie GmbH in Kombination mit den eigenen Diensten verwendet werden kann.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Betrieb und Nutzung:</h3>
                  <p>
                    AeManie GmbH kann jederzeit Drittanbieter-Software ändern, aktualisieren oder deren Bereitstellung einstellen. Sie verpflichten sich, notwendige Maßnahmen zur Installation von Updates oder Änderungen zu unterstützen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 10. Überschriften, selbstständige Klauseln, Salvatorische Klausel */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              10. Überschriften, selbstständige Klauseln, Salvatorische Klausel
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Die Überschriften in diesen AGB dienen nur der Übersicht und Auslegungshilfe und haben keinen Einfluss auf die inhaltliche Auslegung dieser Vereinbarung. Jede Klausel dieser AGB ist als eigenständig und unabhängig auszulegen.
              </p>
              <p>
                Sollte eine Klausel oder ein Teil einer Klausel durch ein zuständiges Gericht für rechtswidrig, ungültig oder nicht durchsetzbar erklärt werden, bleiben die übrigen Bestimmungen unberührt und gelten weiterhin vollumfänglich.
              </p>
            </div>
          </div>

          {/* 11. Definitionen; Vorrang bei Konflikten */}
          <div className="bg-gray-800 p-6 border-l-4 border-gray-400">
            <h2 className="text-2xl font-bold mb-4 text-white">
              11. Definitionen; Vorrang bei Konflikten
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Großgeschriebene Begriffe, die hier nicht ausdrücklich definiert sind, erhalten ihre Bedeutung gemäß der „Universellen Nutzungsbedingungen" (Universal Terms of Service) der AeManie GmbH.
              </p>
              <p>
                Im Falle eines Widerspruchs zwischen den Regelungen dieser Vereinbarung und den universellen Nutzungsbedingungen gelten die Bestimmungen dieser Vereinbarung vorrangig.
              </p>
              <div className="bg-gray-700 p-4 mt-4 border border-gray-600">
                <p className="font-semibold text-white">
                  <strong>Stand:</strong> Januar 2025
                </p>
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