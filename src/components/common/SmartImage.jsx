import { memo, useState } from 'react'
import { asset } from '../../lib/assets.js'

/**
 * Ảnh có lazy load + placeholder đẹp khi chưa có/không tải được ảnh.
 * `load` = false: chưa gán src (trang còn xa) — tránh tải mọi ảnh cùng lúc.
 */
function SmartImage({ src, alt = '', fit = 'cover', position = 'center', load = true, className = '', style, parallax, ...rest }) {
  const [status, setStatus] = useState('loading')
  const [wasLoaded, setWasLoaded] = useState(load)
  if (load && !wasLoaded) setWasLoaded(true)
  const shouldLoad = load || wasLoaded

  if (!src || status === 'error') {
    return (
      <div className={`img-placeholder ${className}`} role="img" aria-label={alt || 'Ảnh minh hoạ'} style={style}>
        <svg viewBox="0 0 120 80" aria-hidden="true">
          <path d="M28 58 L60 22 L92 58 Z" />
          <ellipse cx="60" cy="58" rx="32" ry="7" />
        </svg>
        <span>{alt || 'Ảnh đang được cập nhật'}</span>
      </div>
    )
  }

  return (
    <div className={`smart-img ${status === 'loaded' ? 'is-loaded' : ''} ${className}`} style={style}>
      {shouldLoad && (
        <img
          src={asset(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable="false"
          data-parallax={parallax ? '' : undefined}
          style={{ objectFit: fit, objectPosition: position }}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          {...rest}
        />
      )}
    </div>
  )
}

export default memo(SmartImage)
