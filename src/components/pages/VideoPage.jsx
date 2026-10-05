import { useEffect, useRef, useState } from 'react'
import PageFrame from '../common/PageFrame.jsx'
import Icon from '../common/Icon.jsx'
import { asset, hasAsset } from '../../lib/assets.js'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

/**
 * Trang video. Không tải trước (preload="none"); tự dừng khi lật sang trang khác.
 * Chưa có file → hiện placeholder chứ không hiện trình phát lỗi.
 */
export default function VideoPage(props) {
  const { page, visible, variant } = props
  const a = textAnim(page)
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const exists = hasAsset(page.video) && !failed
  const isThumb = variant === 'thumb'

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!visible) v.pause()
    else if (page.autoplay) {
      v.muted = page.muted ?? true
      v.play().catch(() => {})
    }
  }, [visible, page.autoplay, page.muted])

  return (
    <PageFrame {...props} className="video-page">
      <div className="video-page__inner">
        {page.kicker && (
          <p className="kicker" data-anim={a}>
            {page.kicker}
          </p>
        )}
        <h2 className="article__title" data-anim={a} style={delay(0.06)}>
          {page.title}
        </h2>
        <div className="video-page__screen" data-anim={imageAnim(page)} style={delay(0.15)}>
          {exists && !isThumb ? (
            <video
              ref={videoRef}
              src={asset(page.video)}
              poster={page.poster ? asset(page.poster) : undefined}
              preload="none"
              playsInline
              muted={page.muted ?? true}
              loop={!!page.loop}
              controls={page.controls ?? true}
              aria-label={page.title}
              onError={() => setFailed(true)}
            />
          ) : (
            <VideoPlaceholder page={page} exists={exists} />
          )}
        </div>
        {page.caption && (
          <p className="video-page__caption" data-anim={a} style={delay(0.3)}>
            {page.caption}
          </p>
        )}
      </div>
    </PageFrame>
  )
}

function VideoPlaceholder({ page, exists }) {
  return (
    <div className="video-ph" role="img" aria-label={exists ? page.title : 'Video đang được cập nhật'}>
      {page.poster && <img className="video-ph__poster" src={asset(page.poster)} alt="" loading="lazy" draggable="false" />}
      <div className="video-ph__grain" aria-hidden="true" />
      <div className="video-ph__bars" aria-hidden="true" />
      <div className="video-ph__center">
        {/* chỉ hiện nút play ở hình thu nhỏ của video có thật — khung chờ thì không giả vờ bấm được */}
        {exists ? (
          <span className="video-ph__play" aria-hidden="true">
            <Icon name="play" size={22} />
          </span>
        ) : (
          <span className="video-ph__label">Thước phim đang được hoàn thiện</span>
        )}
      </div>
      <span className="video-ph__tc" aria-hidden="true">
        REC ● 00:00:00
      </span>
    </div>
  )
}
