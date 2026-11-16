import { useState } from 'react';
import { StoreProvider } from './hooks/useStore';
import { FeedbackProvider } from './components/Feedback';
import { useNow } from './hooks/useNow';
import { resolveMode, type ModeOverride } from './lib/identity';
import { Hero } from './components/Hero';
import { LaunchPad, MainQuest } from './components/MainQuest';
import { CharacterDev } from './components/CharacterDev';
import { SideQuests } from './components/SideQuests';
import { TrophyRoom } from './components/TrophyRoom';
import { LifeAdmin } from './components/LifeAdmin';
import { DataPanel, StorageBanners } from './components/DataPanel';

function Dashboard() {
  const now = useNow();
  const [override, setOverride] = useState<ModeOverride>('auto');
  const mode = resolveMode(override, now);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Hero now={now} override={override} onOverride={setOverride} />
      <main id="main" className="page">
        <StorageBanners />
        <div className="grid">
          <div className="span-8">
            <MainQuest />
          </div>
          <div className="span-4">
            <LaunchPad now={now} mode={mode} />
          </div>
          <div className="span-12">
            <CharacterDev />
          </div>
          <div className="span-5">
            <SideQuests />
          </div>
          <div className="span-7">
            <TrophyRoom />
          </div>
          <div className="span-7">
            <LifeAdmin />
          </div>
          <div className="span-5">
            <DataPanel />
          </div>
        </div>
        <footer className="footer">
          <p>
            Personal HQ · Create, don’t merely consume. But rest is a valid deliberate choice. · Saved in this browser only. Export to keep a copy or move devices.
          </p>
        </footer>
      </main>
    </>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <StoreProvider>
        <Dashboard />
      </StoreProvider>
    </FeedbackProvider>
  );
}
