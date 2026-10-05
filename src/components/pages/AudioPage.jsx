import { useContext, useEffect } from 'react'
import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText from '../common/RichText.jsx'
import { InlineAudioPlayer } from '../AudioPlayer/AudioPlayer.jsx'
import { useAudio } from '../../hooks/useAudio.js'
import { asset, hasAsset } from '../../lib/assets.js'
import { MagazineContext } from '../../lib/context.js'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

/** Trang có âm thanh riêng (phỏng vấn, tiếng hò, podcast…). Tự dừng khi rời trang. */
export default function AudioPage(props) {
  const { page, visible, load, variant } = props
  const a = textAnim(page)
  const exists = hasAsset(page.audio) && variant !== 'thumb'
  const audio = useAudio(exists ? asset(page.audio) : null, { loop: !!page.loop })
  const { onPageAudioPlay } = useContext(MagazineContext)

  const { playing, pause } = audio
  useEffect(() => {
    if (!visible && playing) pause()
  }, [visible, playing, pause])
  useEffect(() => {
    if (playing) onPageAudioPlay?.()
  }, [playing, onPageAudioPlay])

  return (
    <PageFrame {...props} className="audio-page">
      <div className="audio-page__inner">
        {page.image && (
          <div className="audio-page__art" data-anim={imageAnim(page)}>
            <SmartImage src={page.image} alt={page.imageAlt || page.title} load={load} />
          </div>
        )}
        {page.kicker && (
          <p className="kicker" data-anim={a}>
            {page.kicker}
          </p>
        )}
        <h2 className="article__title" data-anim={a} style={delay(0.06)}>
          {page.title}
        </h2>
        <RichText text={page.text} anim={a} delay={0.15} />
        <div data-anim={a} style={delay(0.3)} data-no-flip>
          <InlineAudioPlayer audio={audio} title={page.audioTitle || page.title} exists={exists} />
        </div>
      </div>
    </PageFrame>
  )
}
