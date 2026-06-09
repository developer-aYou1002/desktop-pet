import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

type PetMood = 'idle' | 'happy' | 'sleepy';

type DragState = {
  pointerId: number;
  startScreenX: number;
  startScreenY: number;
  hasMoved: boolean;
};

const DRAG_CLICK_THRESHOLD = 4;

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
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const shouldIgnoreClickRef = useRef(false);

  const statusText = useMemo(() => {
    return `当前状态：${moodLabels[mood]}`;
  }, [mood]);

  useEffect(() => {
    window.desktopPet.getAppVersion().then(setAppVersion).catch(() => {
      setAppVersion('dev');
    });
  }, []);

  const handlePetPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startScreenX: event.screenX,
      startScreenY: event.screenY,
      hasMoved: false
    };
    setIsDragging(true);
    window.desktopPet.startWindowDrag({
      screenX: event.screenX,
      screenY: event.screenY
    });
  };

  const handlePetPointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const distanceX = Math.abs(event.screenX - dragState.startScreenX);
    const distanceY = Math.abs(event.screenY - dragState.startScreenY);

    if (distanceX + distanceY > DRAG_CLICK_THRESHOLD) {
      dragState.hasMoved = true;
    }

    window.desktopPet.moveWindowDrag({
      screenX: event.screenX,
      screenY: event.screenY
    });
  };

  const finishPetDrag = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    shouldIgnoreClickRef.current = dragState.hasMoved;
    dragStateRef.current = null;
    setIsDragging(false);
    window.desktopPet.endWindowDrag();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleMoodChange = () => {
    if (shouldIgnoreClickRef.current) {
      shouldIgnoreClickRef.current = false;
      return;
    }

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
      <section
        className={isDragging ? 'pet-stage pet-stage-dragging' : 'pet-stage'}
        aria-label="桌面宠物"
        onPointerDown={handlePetPointerDown}
        onPointerMove={handlePetPointerMove}
        onPointerUp={finishPetDrag}
        onPointerCancel={finishPetDrag}
      >
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
