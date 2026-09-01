/**
 * Pseudo Buy Me a Coffee, identique à celui de Hublink : c'est le même compte.
 *
 * Unique endroit à modifier. Tant que la valeur est vide, aucun bouton de don
 * ne s'affiche — mieux vaut rien qu'un lien mort.
 */
export const BMC_USER = 'luthinfinity';

export const SUPPORT_URL = BMC_USER ? `https://buymeacoffee.com/${BMC_USER}` : null;
