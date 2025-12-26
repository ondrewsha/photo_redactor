const gradientPalette = [
  'linear-gradient(135deg, #a855f7, #4f46e5)',
  'linear-gradient(135deg, #f97316, #f43f5e)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #22d3ee, #2563eb)',
  'linear-gradient(135deg, #ec4899, #c026d3)',
  'linear-gradient(135deg, #facc15, #f97316)',
  'linear-gradient(135deg, #10b981, #047857)',
];

export const gradientForStyle = (id: string): string => {
  if (!id) return gradientPalette[0];
  const sum = id.split('').reduce((acc, chr) => acc + chr.charCodeAt(0), 0);
  return gradientPalette[sum % gradientPalette.length];
};
