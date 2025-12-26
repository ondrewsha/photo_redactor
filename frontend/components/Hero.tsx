
import React from 'react';
import { useTranslation } from '../context/I18nContext';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

export const Hero: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const heroTextTone = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const heroSubTone = theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600';
  const heroLinkTone = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const heroIllustration = React.useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3e3bff"/>
          <stop offset="100%" stop-color="#f472b6"/>
        </linearGradient>
        <linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#05264e"/>
        </linearGradient>
      </defs>
      <rect width="960" height="600" rx="48" fill="url(#h)"/>
      <rect x="80" y="60" width="800" height="480" rx="32" fill="url(#g)"/>
      <circle cx="240" cy="200" r="40" fill="#fff" fill-opacity="0.2"/>
      <path d="M220 360c0-40 60-90 120-40s140 30 140-20 70-40 70-40" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="18" stroke-linecap="round"/>
      <rect x="260" y="320" width="220" height="108" rx="22" fill="rgba(255,255,255,0.14)"/>
      <rect x="560" y="320" width="120" height="120" rx="20" fill="rgba(255,255,255,0.18)"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden transition-colors duration-300",
        theme === 'light' ? 'rounded-[3rem] bg-white/80 shadow-[0_30px_60px_rgba(15,23,42,0.08)]' : ''
      )}
    >
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 lg:flex lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
          </div>
          <h1 className={cn("mt-10 text-4xl font-bold tracking-tight sm:text-6xl transition-colors", heroTextTone)}>
            {t.hero.title}
          </h1>
          <p className={cn("mt-6 text-lg leading-8 transition-colors", heroSubTone)}>
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button size="lg" onClick={onCtaClick}>
              {t.hero.cta}
            </Button>
            <a href="#features" className={cn("text-sm font-semibold leading-6 transition-colors", heroLinkTone)}>
              {t.hero.learnMore} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="overflow-hidden rounded-[3rem] bg-white/5 shadow-2xl ring-1 ring-white/10 w-[76rem] h-[45rem]">
              <img
                src={heroIllustration}
                alt="App screenshot"
                width="2432"
                height="1442"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
