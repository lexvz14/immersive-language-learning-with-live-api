import { useState, useEffect } from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { Button } from './components/ui/button'
import { SplashView } from './views/SplashView'
import { MissionsView } from './views/MissionsView'
import { ChatView } from './views/ChatView'
import { SummaryView } from './views/SummaryView'

type ViewState = 'splash' | 'missions' | 'chat' | 'summary';
type Theme = 'light' | 'dark' | 'system';

function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [mission, setMission] = useState<any>(null);
  const [language, setLanguage] = useState<string>('es-ES');
  const [fromLanguage, setFromLanguage] = useState<string>('en-US');
  const [mode, setMode] = useState<string>('teacher');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'system'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="flex justify-end items-center p-4 gap-4 w-full z-10 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <a
          href="https://github.com/ZackAkil/immersive-language-learning-with-live-api"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors font-medium shadow-sm"
        >
          Source
        </a>
        <Button variant="outline" size="icon" onClick={cycleTheme} className="rounded-full shadow-sm">
          <ThemeIcon className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 w-full relative">
        {view === 'splash' && <SplashView onNext={() => setView('missions')} />}
        {view === 'missions' && <MissionsView onSelect={(m, l, fl, mod) => { setMission(m); setLanguage(l); setFromLanguage(fl); setMode(mod); setView('chat'); }} />}
        {view === 'chat' && <ChatView mission={mission} language={language} fromLanguage={fromLanguage} mode={mode} onComplete={(r) => { setResult(r); setView('summary'); }} />}
        {view === 'summary' && <SummaryView result={result} onRestart={() => setView('missions')} />}
      </main>
    </div>
  )
}

export default App
