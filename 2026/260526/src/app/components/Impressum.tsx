export default function Impressum() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Impressum
        </h1>
        <p className="text-center text-gray-300 mb-12">
          Angaben gemäß § 5 TMG
        </p>

        <div className="space-y-8">
          {/* Firmeninformationen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Firmeninformationen
            </h2>
            <div className="space-y-4 text-white">
              <div className="bg-gray-800 p-6 border-l-4 border-gray-400">
                <h3 className="text-xl font-bold mb-4 text-white">AeManie GmbH</h3>
                <p className="text-lg font-semibold mb-2 text-white">Web & Design – Ihre WebWelle</p>
                <div className="space-y-2 text-white">
                  <p><strong>Adresse:</strong></p>
                  <p>Uhlandstraße 16</p>
                  <p>87437 Kempten (Allgäu)</p>
                  <p>Deutschland</p>
                </div>
              </div>
            </div>
          </div>

          {/* Geschäftsführung */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Geschäftsführung
            </h2>
            <div className="space-y-4 text-white">
              <p>
                <strong>Vertreten durch:</strong>
              </p>
              <p>
                Geschäftsführer / Inhaber: <strong>Herr Arasch Ebrahimi Manie</strong>
              </p>
            </div>
          </div>

          {/* Kontakt */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Kontakt
            </h2>
            <div className="space-y-4 text-white">
              <div className="space-y-3">
                <p>
                  <span className="font-semibold">Telefon:</span> 0172 9525182
                </p>
                <p>
                  <span className="font-semibold">E-Mail:</span> 
                  <a href="mailto:info@webwelle.com" className="text-blue-400 hover:underline ml-2">
                    info@webwelle.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Website:</span> 
                  <a href="https://www.webwelle.com" className="text-blue-400 hover:underline ml-2">
                    https://www.webwelle.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Registereintrag */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Registereintrag
            </h2>
            <div className="space-y-4 text-white">
              <p>
                <strong>Eintragung im Handelsregister</strong>
              </p>
              <p>
                <span className="font-semibold">Registergericht:</span> Kempten 
              </p>
              <p>
                <span className="font-semibold">Handelsregisternummer:</span> HRB 17503
              </p>
            </div>
          </div>

          {/* Umsatzsteuer-ID */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Umsatzsteuer-ID
            </h2>
            <div className="space-y-4 text-white">
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: 
                <span className="text-gray-300 font-semibold ml-2">
                  [wird ergänzt, sobald vorhanden]
                </span>
              </p>
            </div>
          </div>

          {/* Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="space-y-4 text-white">
              <div className="bg-gray-800 p-4 border border-gray-600">
                <p className="text-white"><strong>AeManie GmbH</strong></p>
                <p className="text-white">Uhlandstraße 16</p>
                <p className="text-white">87437 Kempten (Allgäu)</p>
              </div>
            </div>
          </div>

          {/* Haftungsausschluss */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Haftungsausschluss
            </h2>
            <div className="space-y-6 text-white">
              
              {/* Haftung für Inhalte */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Haftung für Inhalte</h3>
                <p>
                  Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                  Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr.
                </p>
              </div>

              {/* Haftung für Links */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Haftung für Links</h3>
                <p>
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
                  Einfluss haben. Daher können wir für diese fremden Inhalte keine Gewähr übernehmen. 
                  Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                  verantwortlich.
                </p>
              </div>

              {/* Urheberrecht */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Urheberrecht</h3>
                <p>
                  Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                  dem deutschen Urheberrecht. Eine Vervielfältigung, Bearbeitung, Verbreitung oder jede 
                  Art der Verwertung außerhalb der Grenzen des Urheberrechts bedarf der schriftlichen 
                  Zustimmung der AeManie GmbH. Downloads und Kopien dieser Seite sind nur für den 
                  privaten, nicht kommerziellen Gebrauch gestattet.
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