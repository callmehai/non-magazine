import { useContext, useEffect, useRef, useState } from 'react'
import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText from '../common/RichText.jsx'
import Icon from '../common/Icon.jsx'
import { MagazineContext } from '../../lib/context.js'
import { textAnim, delay } from '../../lib/anim.js'

const webglOK = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

/** Trang có mô hình nón lá 3D xoay được. Chỉ chạy WebGL khi trang đang mở. */
export default function Model3DPage(props) {
  const { page, visible, variant, load } = props
  const a = textAnim(page)
  const { reducedMotion } = useContext(MagazineContext)
  const canvasRef = useRef(null)
  const [live, setLive] = useState(false)
  const run = visible && variant !== 'thumb' && webglOK

  useEffect(() => {
    if (!run) return
    let viewer
    let cancelled = false
    import('../../three/HatViewer.js').then(({ HatViewer }) => {
      if (cancelled || !canvasRef.current) return
      viewer = new HatViewer(canvasRef.current, { reducedMotion })
      setLive(true)
    })
    return () => {
      cancelled = true
      viewer?.dispose()
      setLive(false)
    }
  }, [run, reducedMotion])

  return (
    <PageFrame {...props} className="model-page">
      <div className="model-page__inner">
        {page.kicker && (
          <p className="kicker" data-anim={a}>
            {page.kicker}
          </p>
        )}
        <h2 className="article__title" data-anim={a} style={delay(0.06)}>
          {page.title}
        </h2>
        <RichText text={page.text} anim={a} delay={0.14} />
        <div className={`model-page__stage ${live ? 'is-live' : ''}`} data-anim="fade-in" style={delay(0.2)}>
          <SmartImage className="model-page__fallback" src={page.image} alt={page.imageAlt} fit="contain" load={load} />
          {run && <canvas ref={canvasRef} data-no-flip aria-label="Mô hình 3D nón lá — kéo để xoay" role="img" />}
          {page.caption && (
            <span className="model-page__hint" aria-hidden="true">
              <Icon name="rotate" size={14} /> {page.caption}
            </span>
          )}
        </div>
        {page.words && (
          <p className="model-page__words" data-anim={a} style={delay(0.4)}>
            {page.words.map((w, i) => (
              <span key={w}>
                {i > 0 && <i aria-hidden="true">—</i>}
                {w}
              </span>
            ))}
          </p>
        )}
      </div>
    </PageFrame>
  )
}
