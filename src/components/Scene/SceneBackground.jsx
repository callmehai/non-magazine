import { useEffect, useRef } from 'react'

/**
 * Canvas three.js cố định phía sau mọi thứ. Tải three.js bất đồng bộ;
 * nếu máy không hỗ trợ WebGL thì chỉ còn nền gradient (vẫn đẹp, không lỗi).
 */
export default function SceneBackground({ mode, reducedMotion, enabled = true, onReady, onIntroDone, onFail }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cbs = useRef({ onReady, onIntroDone, onFail })
  useEffect(() => {
    cbs.current = { onReady, onIntroDone, onFail }
  })

  useEffect(() => {
    if (!enabled) {
      cbs.current.onFail?.()
      return
    }
    let disposed = false
    let scene
    import('../../three/HeroScene.js')
      .then(({ HeroScene }) => {
        if (disposed) return
        scene = new HeroScene(canvasRef.current, {
          reducedMotion,
          onIntroDone: () => cbs.current.onIntroDone?.(),
        })
        sceneRef.current = scene
        cbs.current.onReady?.()
      })
      .catch((err) => {
        console.warn('[scene] Không khởi tạo được WebGL:', err?.message || err)
        cbs.current.onFail?.()
      })
    return () => {
      disposed = true
      sceneRef.current = null
      scene?.dispose()
    }
  }, [enabled, reducedMotion])

  useEffect(() => {
    sceneRef.current?.setMode(mode)
  })

  useEffect(() => {
    if (reducedMotion) return
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      sceneRef.current?.setPointer(x, y)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion])

  return (
    <div className="scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
