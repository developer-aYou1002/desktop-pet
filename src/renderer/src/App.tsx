import { useEffect, useMemo, useState } from 'react';

type PetMood = 'idle' | 'happy' | 'sleepy';

const moodLabels: Record<PetMood, string> = {
  idle: '待机',
  happy: '开心',
  sleepy: '困困'
};

const moodFaces: Record<PetMood, string> = {
  idle: '•ᴗ•',
  happy: 'ᵔᴗᵔ',
  sleepy: '－_－ zZ'
};

const App = () => {
  const [mood, setMood] = useState<PetMood>('idle');
  const [appVersion, setAppVersion] = useState('');

  const statusText = useMemo(() => {
    return `当前状态：${moodLabels[mood]}`;
  }, [mood]);

  useEffect(() => {
    window.desktopPet.getAppVersion().then(setAppVersion).catch(() => {
      setAppVersion('dev');
    });
  }, []);

  const handleMoodChange = () => {
    setMood((currentMood) => {
      if (currentMood === 'idle') {
        return 'happy';
      }

      if (currentMood === 'happy') {
        return 'sleepy';
      }

      return 'idle';
    });
  };

  return (
    <main className="pet-shell">
      <section className="pet-stage" aria-label="桌面宠物">
        <button
          className="pet-avatar"
          type="button"
          onClick={handleMoodChange}
          aria-label="切换宠物状态"
        >
          <span className="pet-ear pet-ear-left" />
          <span className="pet-ear pet-ear-right" />
          <span className="pet-face">{moodFaces[mood]}</span>
        </button>

        <div className="pet-panel">
          <p className="pet-name">小桌宠</p>
          <p className="pet-status">{statusText}</p>
          <p className="pet-version">v{appVersion || '...'}</p>
        </div>
      </section>
    </main>
  );
};

export default App;
