// One sack of pellets; entries are stored in kg and sacks are only an input/display unit
export const SACK_KG = 16;

export type Unit = 'sacks' | 'kg';

export const sacksToKg = (sacks: number) => sacks * SACK_KG;

export const kgToSacks = (kg: number) => kg / SACK_KG;

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  value.toLocaleString('sv-SE', { maximumFractionDigits });

export const formatKg = (kg: number, maximumFractionDigits = 1) =>
  `${formatNumber(kg, maximumFractionDigits)} kg`;

/**
 * Formats kg as an approximate number of sacks, e.g. "≈ 2,5 säckar"
 */
export const formatAsSacks = (kg: number) => {
  const sacks = kgToSacks(kg);
  const exact = Number.isInteger(sacks);
  const label = sacks === 1 ? 'säck' : 'säckar';
  return `${exact ? '' : '≈ '}${formatNumber(sacks)} ${label}`;
};
