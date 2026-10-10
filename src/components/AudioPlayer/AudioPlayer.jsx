import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

function Bars({ playing }) {
  return (
    <span className={`eq ${playing ? 'is-playing' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Volume({ audio, label }) {
  return (
    <span className="vol">
      <button
        type="button"
        className="ctrl ctrl--sm"
        onClick={() => audio.setMuted(!audio.muted)}
        aria-label={audio.muted ? t('unmute', { label }) : t('mute', { label })}
        aria-pressed={audio.muted}
      >
        <Icon name={audio.muted || audio.volume === 0 ? 'soundOff' : 'soundOn'} size={16} />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={audio.muted ? 0 : audio.volume}
        onChange={(e) => {
          audio.setVolume(Number(e.target.value))
          if (audio.muted) audio.setMuted(false)
        }}
        aria-label={t('volume', { label })}
        style={{ '--v': audio.muted ? 0 : audio.volume }}
      />
    </span>
  )
}

/**
 * Nhạc nền: nút phát/dừng + chỉ báo đang phát, mở rộng ra thanh âm lượng.
 * Nếu trình duyệt chặn tự phát → hiện lời mời bấm để bật âm thanh.
 */
export default function AudioPlayer({ audio, soundOn, needsGesture, onEnable, hidden }) {
  if (!audio.available) return null
  const playing = audio.playing && soundOn
  return (
    <div className={`music ${hidden ? 'is-hidden' : ''} ${playing ? 'is-playing' : ''}`} role="group" aria-label={t('music')}>
      {needsGesture ? (
        <button type="button" className="music__invite" onClick={onEnable}>
          <Icon name="music" size={16} />
          {t('tapForSound')}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="ctrl music__toggle"
            onClick={() => (playing ? audio.pause() : onEnable())}
            aria-label={playing ? t('pauseMusic') : t('playMusic')}
            aria-pressed={playing}
          >
            <Icon name={playing ? 'pause' : 'play'} size={16} />
          </button>
          <span className="music__meta">
            <Bars playing={playing} />
            <span className="music__title">{audio.title}</span>
          </span>
          <Volume audio={audio} label={t('musicLower')} />
        </>
      )}
    </div>
  )
}

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Trình phát dùng trong trang "audio". */
export function InlineAudioPlayer({ audio, title, exists }) {
  if (!exists) {
    return (
      <div className="inline-audio is-empty">
        <Icon name="music" size={18} />
        <span>{t('audioPending')}</span>
      </div>
    )
  }
  const { current, duration } = audio.time
  const pct = duration ? (current / duration) * 100 : 0
  return (
    <div className={`inline-audio ${audio.playing ? 'is-playing' : ''}`}>
      <button type="button" className="inline-audio__play" onClick={audio.toggle} aria-label={audio.playing ? t('pause', { title }) : t('play', { title })}>
        <Icon name={audio.playing ? 'pause' : 'play'} size={18} />
      </button>
      <div className="inline-audio__main">
        <span className="inline-audio__title">
          <Bars playing={audio.playing} /> {title}
        </span>
        <input
          type="range"
          className="inline-audio__seek"
          min="0"
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={(e) => audio.seek(Number(e.target.value))}
          aria-label={t('seek')}
          style={{ '--v': pct / 100 }}
        />
        <span className="inline-audio__time">
          {fmt(current)} / {fmt(duration)}
        </span>
      </div>
      <Volume audio={audio} label={title} />
      {audio.error && <span className="inline-audio__err">{audio.error}</span>}
    </div>
  )
}
