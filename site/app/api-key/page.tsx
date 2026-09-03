import type { Metadata } from 'next';
import Tutoriel from '../tutoriel';
import { en } from '../content';

export const metadata: Metadata = {
  title: `${en.cle.titre} — Polyglot`,
  description: en.cle.chapeau,
  alternates: { canonical: '/api-key', languages: { en: '/api-key', fr: '/fr/api-key' } }
};

export default function EnglishKeyPage() {
  return <Tutoriel t={en} locale="en" />;
}
