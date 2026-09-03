import type { Metadata } from 'next';
import Tutoriel from '../../tutoriel';
import { fr } from '../../content';

export const metadata: Metadata = {
  title: `${fr.cle.titre} — Polyglot`,
  description: fr.cle.chapeau,
  alternates: { canonical: '/fr/api-key', languages: { en: '/api-key', fr: '/fr/api-key' } }
};

export default function FrenchKeyPage() {
  return <Tutoriel t={fr} locale="fr" />;
}
