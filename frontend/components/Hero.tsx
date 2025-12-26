
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
            <img 
              src="https://picsum.photos/seed/nv1/800/600" 
              alt="App screenshot" 
              width="2432" 
              height="1442" 
              className="w-[76rem] rounded-3xl bg-white/5 shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
