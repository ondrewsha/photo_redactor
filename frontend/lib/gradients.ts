import type { CSSProperties } from 'react';

const gradientPalette = [
  'linear-gradient(135deg, #a855f7, #4f46e5)',
  'linear-gradient(135deg, #f97316, #f43f5e)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #22d3ee, #2563eb)',
  'linear-gradient(135deg, #ec4899, #c026d3)',
  'linear-gradient(135deg, #facc15, #f97316)',
  'linear-gradient(135deg, #10b981, #047857)',
];

const STYLE_IMAGE_IDS = new Set([
  'aged_paper','anime','art_deco','birthday','charcoal','christmas','cinematic','clay','coloring',
  'comic','constructivism','cozy','cyberpunk','dramatic_light','easter','embroidery','eighties','fantasy',
  'film_photo','flat_illustration','fog','gouache','graduation','graffiti','halloween','icons','ink',
  'instant_photo','isometric','line_art','macro','market_comparison','market_details','market_dimensions',
  'market_env','market_infographics','market_lifestyle','market_pastel','market_premium','market_sale','market_set',
  'market_white','minimal','mosaic','mountains','nature_autumn','nature_spring','nature_summer','nature_winter',
  'neon_sign','new_year','new_year_ussr','newspaper','nineties','noir','ocean','oil_paint','origami','paper_cut',
  'pastel','pencil_sketch','photoreal','pixel_art','portrait','postapocalypse','poster','product','retro_poster',
  'robots','soviet_poster','space','stained_glass','steampunk','sticker','storybook','studio_light','sunset','underwater',
  'ussr_postcard','valentine','vhs_video','victory_day','watercolor','wedding','womens_day'
]);

const overlayGradient = 'linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45))';

const fallbackGradient = (id: string): string => {
  if (!id) return gradientPalette[0];
  const sum = id.split('').reduce((acc, chr) => acc + chr.charCodeAt(0), 0);
  return gradientPalette[sum % gradientPalette.length];
};

const STYLE_IMAGE_BASE = '/styles_media';

export const styleBackgroundForStyle = (id: string): CSSProperties => {
  const hasImage = id && STYLE_IMAGE_IDS.has(id);
  if (hasImage) {
    return {
      backgroundImage: `${overlayGradient}, url('${STYLE_IMAGE_BASE}/${id}.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {
    backgroundImage: `${overlayGradient}, ${fallbackGradient(id)}`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
};
