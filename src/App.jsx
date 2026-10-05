import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import magazine from './content/magazine.js'
import FlipBook, { visiblePages } from './components/FlipBook/FlipBook.jsx'
import Controls from './components/Controls/Controls.jsx'
import { ZOOM_LEVELS } from './components/Controls/ZoomControls.jsx'
import ThumbnailPanel from './components/ThumbnailPanel/ThumbnailPanel.jsx'
import AudioPlayer from './components/AudioPlayer/AudioPlayer.jsx'
import LoadingIntro from './components/Intro/LoadingIntro.jsx'
import SceneBackground from './components/Scene/SceneBackground.jsx'
import Hint from './components/Hint.jsx'
import Lightbox from './components/Lightbox.jsx'
import Icon from './components/common/Icon.jsx'
import { useFlipBook } from './hooks/useFlipBook.js'
import { useBookLayout } from './hooks/useBookLayout.js'
import { useFullscreen } from './hooks/useFullscreen.js'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation.js'
import { useBackgroundMusic } from './hooks/useAudio.js'
import { useReducedMotion } from './hooks/useReducedMotion.js'
import { useIdle } from './hooks/useIdle.js'
import { MagazineContext } from './lib/context.js'
import { playFlipSound } from './lib/sound.js'
import { asset, hasAsset } from './lib/assets.js'

const INTRO_MS = 3200
const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

export default function App() {
  const { settings, pages } = magazine
  const count = pages.length
  const reducedMotion = useReducedMotion()
  const stageRef = useRef(null)
  const appRef = useRef(null)

  const [panelOpen, setPanelOpen] = useState(false)

  // ───────────── zoom + kích thước sách
  const [zoom, setZoom] = useState(1)
  const layout = useBookLayout(stageRef, settings, zoom)
  const zoomIn = useCallback(() => setZoom((z) => ZOOM_LEVELS.find((l) => l > z + 0.001) ?? z), [])
  const zoomOut = useCallback(() => setZoom((z) => [...ZOOM_LEVELS].reverse().find((l) => l < z - 0.001) ?? z), [])
  const zoomReset = useCallback(() => setZoom(1), [])

  // ───────────── âm thanh
  const [soundOn, setSoundOn] = useState(!!settings.enableSound)
  const soundOnRef = useRef(soundOn)
  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])
  const music = useBackgroundMusic(settings)
  const [needsGesture, setNeedsGesture] = useState(false)
  const flipFile = useMemo(() => (hasAsset(settings.flipSound) ? asset(settings.flipSound) : null), [settings.flipSound])

  const onFlipStart = useCallback(
    (pf) => {
      if (!soundOnRef.current) return
      const cur = pf.getCurrentPageIndex()
      if (flipFile) {
        const a = new Audio(flipFile)
        a.volume = 0.6
        a.play().catch(() => {})
      } else {
        playFlipSound({ hard: cur <= 1 || cur >= count - 2 })
      }
    },
    [flipFile, count]
  )

  // ───────────── sách
  const book = useFlipBook({ pages, settings, layout, zoomed: zoom > 1, onFlipStart })
  const { currentPage } = book
  const visible = useMemo(() => visiblePages(currentPage, layout.orientation, count), [currentPage, layout.orientation, count])
  const lastVisible = visible[visible.length - 1]

  // ───────────── intro: luôn chạy hết hiệu ứng, bấm "Mở tạp chí" mới vào đọc
  const introEnabled = settings.intro !== false
  const [phase, setPhase] = useState(introEnabled ? 'intro' : 'reading') // intro → leaving → reading
  const [sceneStatus, setSceneStatus] = useState(settings.background3D === false && !introEnabled ? 'off' : 'loading')
  const [sceneIntroDone, setSceneIntroDone] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let alive = true
    const done = () => alive && setFontsReady(true)
    if (document.fonts?.ready) document.fonts.ready.then(done)
    else done()
    const t = setTimeout(() => setMinTimePassed(true), 1400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [])

  const sceneDone = sceneIntroDone || sceneStatus === 'failed' || sceneStatus === 'off'
  const introReady = phase === 'intro' && sceneDone && minTimePassed && fontsReady && book.ready

  // thanh tiến trình trong lúc nón đang được đan
  useEffect(() => {
    if (phase !== 'intro' || sceneDone) {
      setProgress(1)
      return
    }
    let raf
    const start = performance.now()
    const loop = (now) => {
      setProgress(Math.min(0.97, (now - start) / INTRO_MS))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, sceneDone, replayKey])

  useEffect(() => {
    if (phase !== 'leaving') return
    const t = setTimeout(() => setPhase('reading'), reducedMotion ? 200 : 1100)
    return () => clearTimeout(t)
  }, [phase, reducedMotion])

  // vào chế độ đọc → thử bật nhạc (trình duyệt thường chặn → mời người dùng bấm)
  const triedMusic = useRef(false)
  useEffect(() => {
    if (phase !== 'reading' || triedMusic.current) return
    triedMusic.current = true
    if (!soundOnRef.current) return
    music.play().then((ok) => setNeedsGesture(!ok))
  }, [phase, music])

  const enableSound = useCallback(() => {
    setSoundOn(true)
    music.play().then((ok) => setNeedsGesture(!ok))
  }, [music])

  const openMagazine = useCallback(() => {
    setPhase((p) => (p === 'intro' ? 'leaving' : p))
    // bấm nút là thao tác của người dùng → trình duyệt cho phép phát nhạc
    if (soundOnRef.current && !triedMusic.current) {
      triedMusic.current = true
      music.play().then((ok) => setNeedsGesture(!ok))
    }
  }, [music])

  const replayIntro = useCallback(() => {
    setPanelOpen(false)
    setZoom(1)
    setSceneIntroDone(false)
    setReplayKey((k) => k + 1)
    setPhase('intro')
  }, [])

  const toggleSound = useCallback(() => {
    if (soundOnRef.current) {
      setSoundOn(false)
      music.pause()
    } else enableSound()
  }, [music, enableSound])

  // ───────────── gợi ý "Click hoặc kéo để lật trang"
  const [hint, setHint] = useState(false)
  useEffect(() => {
    if (phase !== 'reading') return
    setHint(true)
    const t = setTimeout(() => setHint(false), 4800)
    return () => clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (currentPage !== 0) setHint(false)
  }, [currentPage])

  // ───────────── panel, lightbox, fullscreen
  const [lightbox, setLightbox] = useState(null)
  const fullscreen = useFullscreen(appRef)
  const idle = useIdle(3200, panelOpen || phase !== 'reading')
  const [overControls, setOverControls] = useState(false)
  const uiHidden = phase !== 'reading' || (idle && !overControls)

  const selectPage = useCallback(
    (i) => {
      book.flipTo(i)
      if (window.innerWidth < 900) setPanelOpen(false)
    },
    [book]
  )

  useKeyboardNavigation(
    {
      next: book.next,
      prev: book.prev,
      first: () => book.flipTo(0),
      last: () => book.flipTo(count - 1),
      fullscreen: fullscreen.toggle,
      thumbnails: () => setPanelOpen((o) => !o),
      zoomIn,
      zoomOut,
      zoomReset,
      escape: () => {
        if (panelOpen) setPanelOpen(false)
        else fullscreen.exit()
      },
    },
    phase === 'reading' && !lightbox
  )

  // Ctrl + lăn chuột (và pinch trên trackpad) = zoom
  useEffect(() => {
    let acc = 0
    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      acc += e.deltaY
      if (acc < -40) {
        zoomIn()
        acc = 0
      } else if (acc > 40) {
        zoomOut()
        acc = 0
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [zoomIn, zoomOut])

  // khi zoom: cuộn về giữa sách
  useLayoutEffect(() => {
    const s = stageRef.current
    if (!s) return
    s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2
    s.scrollTop = (s.scrollHeight - s.clientHeight) / 2
  }, [zoom])

  // parallax nhẹ cho ảnh có animation "parallax" (biến CSS, không re-render)
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = appRef.current
        if (!el) return
        el.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reducedMotion])

  const pauseMusic = music.pause
  const ctx = useMemo(
    () => ({
      openLightbox: (images, index) => setLightbox({ images, index }),
      reducedMotion,
      onPageAudioPlay: pauseMusic,
    }),
    [reducedMotion, pauseMusic]
  )

  const pageLabel = visible.length === 2 ? `${visible[0] + 1}–${visible[1] + 1}` : `${visible[0] + 1}`
  const entered = phase !== 'intro'

  return (
    <MagazineContext.Provider value={ctx}>
      <div
        ref={appRef}
        className={`app phase-${phase} ${uiHidden ? 'ui-hidden' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
        style={{ '--ratio': `${settings.pageWidth} / ${settings.pageHeight}` }}
      >
        <div className="backdrop" aria-hidden="true" />
        <SceneBackground
          mode={phase === 'intro' ? 'intro' : 'reading'}
          replayKey={replayKey}
          reducedMotion={reducedMotion}
          enabled={sceneStatus !== 'off'}
          onReady={() => setSceneStatus('ready')}
          onIntroDone={() => setSceneIntroDone(true)}
          onFail={() => setSceneStatus('failed')}
        />
        <div className="vignette" aria-hidden="true" />

        <header className="brand" aria-hidden={uiHidden}>
          <span className="brand__mark">{magazine.title}</span>
          <span className="brand__sub">{magazine.subtitle}</span>
          {magazine.issue && <span className="brand__issue">{magazine.issue}</span>}
        </header>

        <button type="button" className="replay" onClick={replayIntro} aria-label="Xem lại màn mở đầu nón lá 3D" tabIndex={phase === 'reading' ? 0 : -1}>
          <Icon name="rotate" size={15} />
          <span>Xem lại nón 3D</span>
        </button>

        <main ref={stageRef} className={`stage ${zoom > 1 ? 'is-zoomed' : ''}`} aria-label={`Tạp chí ${magazine.title}`}>
          <div className="stage__inner" style={{ paddingTop: layout.padTop, paddingBottom: layout.padBottom }}>
            <FlipBook book={book} magazine={magazine} layout={layout} entered={entered} zoomed={zoom > 1} />
          </div>
        </main>

        <button type="button" className="side-arrow is-prev" onClick={book.prev} disabled={currentPage === 0} aria-label="Trang trước">
          <Icon name="prev" size={26} strokeWidth={1.2} />
        </button>
        <button type="button" className="side-arrow is-next" onClick={book.next} disabled={lastVisible >= count - 1} aria-label="Trang sau">
          <Icon name="next" size={26} strokeWidth={1.2} />
        </button>

        <Hint show={hint && phase === 'reading'} touch={isTouch} />

        <div onPointerEnter={() => setOverControls(true)} onPointerLeave={() => setOverControls(false)}>
          <Controls
            pageLabel={pageLabel}
            total={count}
            progress={(lastVisible + 1) / count}
            canPrev={currentPage > 0}
            canNext={lastVisible < count - 1}
            onPrev={book.prev}
            onNext={book.next}
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomReset={zoomReset}
            fullscreen={fullscreen}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((o) => !o)}
            hidden={uiHidden}
          />
          <AudioPlayer audio={music} soundOn={soundOn} needsGesture={needsGesture && soundOn} onEnable={enableSound} hidden={phase !== 'reading'} />
        </div>

        <ThumbnailPanel open={panelOpen} magazine={magazine} visible={visible} onSelect={selectPage} onClose={() => setPanelOpen(false)} />
        <Lightbox state={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />

        {phase !== 'reading' && (
          <LoadingIntro magazine={magazine} progress={progress} ready={introReady || phase === 'leaving'} leaving={phase === 'leaving'} onOpen={openMagazine} />
        )}
      </div>
    </MagazineContext.Provider>
  )
}
