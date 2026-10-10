import { useCallback, useEffect, useRef, useState } from 'react'
import { createAmbient } from '../lib/sound.js'
import { asset, hasAsset } from '../lib/assets.js'
import { t } from '../lib/i18n.js'

/**
 * Điều khiển một file âm thanh (HTMLAudioElement).
 * Không tự phát: nếu trình duyệt chặn, `blocked` = true để UI mời người dùng bấm.
 */
export function useAudio(src, { loop = false, volume: initialVolume = 0.8 } = {}) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(initialVolume)
  const [muted, setMutedState] = useState(false)
  const [time, setTime] = useState({ current: 0, duration: 0 })
  const [error, setError] = useState(null)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!src) return
    const a = new Audio()
    a.preload = 'none'
    a.loop = loop
    a.src = src
    audioRef.current = a
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setTime({ current: a.currentTime, duration: a.duration || 0 })
    const onError = () => {
      setError(t('audioError'))
      setPlaying(false)
    }
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onPause)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onTime)
    a.addEventListener('error', onError)
    return () => {
      a.pause()
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onPause)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onTime)
      a.removeEventListener('error', onError)
      a.removeAttribute('src')
      a.load()
      audioRef.current = null
    }
  }, [src, loop])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = volume
    a.muted = muted
  }, [volume, muted, src])

  const play = useCallback(async () => {
    const a = audioRef.current
    if (!a) return false
    try {
      await a.play()
      setBlocked(false)
      return true
    } catch (e) {
      if (e?.name === 'NotAllowedError') setBlocked(true)
      return false
    }
  }, [])
  const pause = useCallback(() => audioRef.current?.pause(), [])
  const toggle = useCallback(() => (audioRef.current?.paused ? play() : pause()), [play, pause])
  const seek = useCallback((t) => {
    if (audioRef.current) audioRef.current.currentTime = t
  }, [])

  return {
    playing,
    play,
    pause,
    toggle,
    seek,
    volume,
    setVolume: setVolumeState,
    muted,
    setMuted: setMutedState,
    time,
    error,
    blocked,
    available: !!src,
  }
}

/**
 * Nhạc nền: dùng file trong magazine.js nếu có,
 * nếu chưa có file thì phát bản nhạc ngũ cung tổng hợp (Web Audio).
 */
export function useBackgroundMusic(settings) {
  const path = settings.backgroundMusic
  const hasFile = hasAsset(path)
  const file = useAudio(hasFile ? asset(path) : null, { loop: true, volume: settings.musicVolume ?? 0.5 })

  const synthRef = useRef(null)
  const [synthPlaying, setSynthPlaying] = useState(false)
  const [synthVolume, setSynthVolume] = useState(settings.musicVolume ?? 0.5)
  const [synthMuted, setSynthMuted] = useState(false)
  const [synthBlocked, setSynthBlocked] = useState(false)

  useEffect(() => {
    if (hasFile) return
    synthRef.current = createAmbient()
    return () => {
      synthRef.current?.stop()
      synthRef.current = null
    }
  }, [hasFile])

  useEffect(() => {
    synthRef.current?.setVolume(synthMuted ? 0 : synthVolume)
  }, [synthVolume, synthMuted])

  const synthPlay = useCallback(async () => {
    try {
      await synthRef.current?.start()
      synthRef.current?.setVolume(synthMuted ? 0 : synthVolume)
      setSynthPlaying(true)
      setSynthBlocked(false)
      return true
    } catch {
      setSynthBlocked(true)
      return false
    }
  }, [synthMuted, synthVolume])
  const synthPause = useCallback(() => {
    synthRef.current?.stop()
    setSynthPlaying(false)
  }, [])

  if (hasFile) return { ...file, title: settings.backgroundMusicTitle || t('music'), source: 'file' }
  return {
    playing: synthPlaying,
    play: synthPlay,
    pause: synthPause,
    toggle: () => (synthPlaying ? synthPause() : synthPlay()),
    volume: synthVolume,
    setVolume: setSynthVolume,
    muted: synthMuted,
    setMuted: setSynthMuted,
    blocked: synthBlocked,
    available: true,
    title: t('musicSynth'),
    source: 'synth',
  }
}
