
import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider, useTranslation } from './context/I18nContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AuthModal } from './components/AuthModal';
import { Generator } from './components/Generator';
import { ProfileModal } from './components/ProfileModal';
import { Button } from './components/ui/Button';
import { cn } from './lib/cn';
import { useTheme } from './context/ThemeContext';
import { SupportModal } from './components/SupportModal';
import { AdminPanel } from './components/admin/AdminPanel';

const PromoCTA: React.FC<{ onAuthClick: (tab: 'login' | 'register') => void }> = ({ onAuthClick }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  return (
    <section id="cta-promo" className="py-24 px-6">
      <div
        className={cn(
          "mx-auto max-w-5xl overflow-hidden rounded-[3rem] relative transition-colors duration-300",
          theme === 'dark'
            ? 'bg-zinc-900 text-white shadow-2xl'
            : 'bg-white text-zinc-900 shadow-[0_40px_80px_rgba(15,23,42,0.12)]'
        )}
      >
        {/* Декоративные градиенты */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl"></div>
        
        <div className="relative px-8 py-16 sm:px-16 sm:py-24 flex flex-col items-center text-center space-y-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl">
             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <h2
              className={cn(
                "text-3xl font-black tracking-tighter sm:text-5xl uppercase transition-colors",
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              )}
            >
              {t.generator.readyTitle}
            </h2>
            <p className={cn("text-lg font-medium transition-colors", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
              {t.auth.registerSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button 
              size="lg" 
              className="px-12 rounded-2xl shadow-xl shadow-indigo-500/20"
              onClick={() => onAuthClick('register')}
            >
              {t.common.register}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className={cn(
                "px-12 rounded-2xl transition-colors",
                theme === 'dark'
                  ? 'border-zinc-200 text-white hover:bg-zinc-800'
                  : 'border-zinc-300 text-zinc-900 hover:bg-zinc-100'
              )}
              onClick={() => onAuthClick('login')}
            >
              {t.common.login}
            </Button>
          </div>

          <p className="text-sm text-zinc-500 uppercase tracking-tight">
            {t.promo.subtext}
          </p>

        </div>
      </div>
    </section>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const featuresTitleTone = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const featuresDescTone = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({
    open: false,
    tab: 'login'
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const scrollToTarget = () => {
    const targetId = user ? 'generator' : 'cta-promo';
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuth = (tab: 'login' | 'register') => {
    setAuthModal({ open: true, tab });
  };

  const footerLinks = [
    { label: t.footer.privacy, href: '/privacy.html' },
    { label: t.footer.terms, href: '/terms.html' },
  ];
  const adminFeatureEnabled = Boolean(
    user && user.role === 'admin' && import.meta.env.VITE_FEATURE_ADMIN_UI === 'true'
  );

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300 flex flex-col",
        theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      <Header 
        onAuthClick={handleAuth} 
        onProfileClick={() => setProfileModalOpen(true)}
        onAdminClick={adminFeatureEnabled ? () => setAdminPanelOpen(true) : undefined}
        showAdminButton={adminFeatureEnabled}
      />
      
      <main className="flex-1">
        {!user && !loading && (
          <>
            <Hero onCtaClick={scrollToTarget} />
            <section id="features" className="py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center space-y-4">
                  <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em]">{t.features.tag}</h2>
                  <p className={cn("text-4xl font-black tracking-tighter sm:text-5xl transition-colors", featuresTitleTone)}>{t.features.title}</p>
                  <p className={cn("text-lg leading-relaxed max-w-xl mx-auto transition-colors", featuresDescTone)}>{t.features.description}</p>
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      title: t.features.step1Title,
                      desc: t.features.step1Desc,
                      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
                      color: "bg-blue-500"
                    },
                    {
                      title: t.features.step2Title,
                      desc: t.features.step2Desc,
                      icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
                      color: "bg-indigo-500"
                    },
                    {
                      title: t.features.step3Title,
                      desc: t.features.step3Desc,
                      icon: "M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
                      color: "bg-purple-500"
                    }
                  ].map((feat, i) => (
                    <div
                      key={i}
                      className={cn(
                        "group p-10 rounded-[2.5rem] border transition-all hover:-translate-y-2 shadow-xl",
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-800 text-white'
                          : 'bg-white border-zinc-100 text-zinc-900 shadow-[0_25px_60px_rgba(15,23,42,0.08)]'
                      )}
                    >
                      <div className={`h-14 w-14 rounded-2xl ${feat.color} text-white flex items-center justify-center mb-6 shadow-lg`}>
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={feat.icon} /></svg>
                      </div>
                      <h3 className={cn("text-xl font-black uppercase tracking-tighter mb-2", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{feat.title}</h3>
                      <p className={cn("text-sm transition-colors", featuresDescTone)}>{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            <PromoCTA onAuthClick={handleAuth} />
          </>
        )}

        {user && (
          <section id="generator" className="pt-12 pb-24 animate-in fade-in duration-700">
            <Generator />
          </section>
        )}
      </main>

      <footer
        className={cn(
          "border-t py-20 backdrop-blur-sm transition-colors",
          theme === 'dark'
            ? 'border-zinc-800/50 bg-zinc-950/50 text-white'
            : 'border-zinc-200/70 bg-white/70 text-zinc-900'
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">NV</div>
             <span className={cn("font-black uppercase tracking-tighter", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{t.footer.brand}</span>
          </div>
          <div className="flex gap-10 items-center">
            {footerLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors",
                  theme === 'dark' ? 'text-zinc-400 hover:text-indigo-400' : 'text-zinc-500 hover:text-indigo-600'
                )}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => setSupportModalOpen(true)}
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                theme === 'dark' ? 'text-zinc-400 hover:text-indigo-400' : 'text-zinc-500 hover:text-indigo-600'
              )}
            >
              {t.footer.support}
            </button>
          </div>
          <div
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em]",
              theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            © 2025 Laboratory of Visualization
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={authModal.open} 
        onClose={() => setAuthModal({ ...authModal, open: false })}
        initialTab={authModal.tab}
      />

      <ProfileModal 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <SupportModal 
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
      <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
