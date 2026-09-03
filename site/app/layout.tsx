import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* `suppressHydrationWarning` : le script plus bas ajoute une classe à
       <html> avant l'hydratation, ce que React signalerait sinon comme une
       divergence serveur / client. */
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Marque la page comme animable seulement si JS tourne : sans cela, un
            échec de script laisserait tout le contenu invisible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`
          }}
        />
        {/* Note la plateforme avant le rendu : le CSS peut alors masquer le
            binaire qui ne concerne pas le visiteur, sans qu'il apparaisse une
            fraction de seconde. Un iPad se déclare « MacIntel » : on le
            distingue par le tactile, sinon on proposerait un .dmg à quelqu'un
            qui ne peut rien en faire. Plateforme inconnue : les deux boutons
            restent affichés. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var ua = navigator.userAgent || '';
  var pf = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var tactile = navigator.maxTouchPoints > 1;
  var os = '';
  if (/win/i.test(pf) || /Windows/.test(ua)) os = 'win';
  else if ((/mac/i.test(pf) || /Mac OS X/.test(ua)) && !tactile) os = 'mac';
  if (os) document.documentElement.dataset.os = os;
} catch (e) {}`
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
