// Mesmos ids de ReligionFilter.SELECTABLE no backend.
export const RELIGIONS = ['christianity', 'judaism', 'islam', 'buddhism'] as const;
export type Religion = (typeof RELIGIONS)[number];

export function parseReligion(raw: string | null | undefined): Religion | null {
  const value = raw?.trim().toLowerCase();
  return (RELIGIONS as readonly string[]).includes(value ?? '') ? (value as Religion) : null;
}
