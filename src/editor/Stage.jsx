import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import CanvasPage, { boxStyle, textStyle, PAGE_W, PAGE_H } from '../canvas/CanvasPage.jsx'
import { DND_TYPE } from './SidePanel.jsx'

const RATIO = PAGE_W / PAGE_H
const SNAP_DIRS = { top: true, left: true, bottom: true, right: true, center: true, middle: true }

/**
 * Vùng sửa trang (giống Canva):
 * - bấm để chọn, Shift+bấm để chọn thêm, kéo chuột trên vùng trống để quét chọn nhiều
 * - nhấn giữ một phần tử rồi kéo là di chuyển luôn; kéo góc để đổi cỡ, núm tròn để xoay
 * - nhấp đúp vào chữ để sửa; thả ảnh từ máy tính hoặc từ cột trái vào trang
 * Trong lúc kéo, Moveable sửa thẳng style (mượt); thả tay mới ghi vào dữ liệu (onCommit) = một bước undo.
 */
export default function Stage({ page, zoom, selectedIds, editingId, readOnly, onSelect, onCommit, onStartEdit, onEndEdit, onDropData, onDropFiles, onOpenVideo, onEnterGroup }) {
  const wrapRef = useRef(null)
  const pageRef = useRef(null)
  const moveableRef = useRef(null)
  const gesture = useRef(new Map()) // id → { x, y, w, h, rot } trong lúc kéo
  const pendingDrag = useRef(null) // sự kiện mousedown chờ Moveable sẵn sàng để kéo luôn
  const justSelected = useRef(null) // id vừa chọn ở pointerdown — kéo luôn khi tới mousedown
  const [avail, setAvail] = useState({ w: 800, h: 600 })
  const [targets, setTargets] = useState([])
  const [others, setOthers] = useState([])
  const [shift, setShift] = useState(false)
  const [marquee, setMarquee] = useState(null)
  const [dropOver, setDropOver] = useState(false)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setAvail({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(wrapRef.current)
    const down = (e) => e.key === 'Shift' && setShift(true)
    const up = (e) => e.key === 'Shift' && setShift(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      ro.disconnect()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const fitW = Math.max(200, Math.min(avail.w - 80, (avail.h - 60) * RATIO))
  const pw = Math.round(fitW * zoom)
  const ph = Math.round(pw / RATIO)
  const unit = pw / PAGE_W // px cho 1pt
  const byId = new Map((page?.elements || []).map((e) => [e.id, e]))
  const single = selectedIds.length === 1 ? byId.get(selectedIds[0]) : null
  const selKey = selectedIds.join()

  // phần tử đang chọn → Moveable (+ các phần tử còn lại để hiện đường gióng)
  useLayoutEffect(() => {
    if (readOnly) {
      setTargets([])
      return
    }
    const root = pageRef.current
    const nodes = selKey
      .split(',')
      .filter((id) => id && id !== editingId)
      .map((id) => root?.querySelector(`.cv-page > [data-id="${CSS.escape(id)}"]`))
      .filter(Boolean)
    setTargets(nodes)
    setOthers(nodes.length ? [...root.querySelectorAll('.cv-page > .cv-el')].filter((n) => !nodes.includes(n)) : [])
  }, [selKey, editingId, readOnly, page])

  useLayoutEffect(() => {
    moveableRef.current?.updateRect()
    // vừa chọn bằng cách nhấn giữ → bắt đầu kéo luôn, không cần nhả chuột rồi kéo lại
    if (pendingDrag.current && targets.length && moveableRef.current) {
      moveableRef.current.dragStart(pendingDrag.current)
      pendingDrag.current = null
    }
  }, [targets, page, pw])

  const toPage = (cx, cy) => {
    const r = pageRef.current.getBoundingClientRect()
    return { x: (cx - r.left) / unit, y: (cy - r.top) / unit }
  }

  // Nhấn giữ vào phần tử chưa chọn → chọn rồi kéo luôn (như Canva).
  // Phải đưa Moveable sự kiện *mousedown*, không phải pointerdown: Moveable (gesto) gọi preventDefault()
  // lên sự kiện bắt đầu, mà chặn pointerdown thì trình duyệt bỏ luôn mousemove/mouseup của lần nhấn đó
  // → Moveable không biết đã nhả chuột, phần tử dính theo con trỏ cho tới cú bấm sau.
  const onMouseDown = (e) => {
    if (!justSelected.current || e.button !== 0) return
    justSelected.current = null
    const ev = e.nativeEvent
    if (targets.length && moveableRef.current) return moveableRef.current.dragStart(ev)
    pendingDrag.current = ev // Moveable chưa gắn xong → để effect bên trên gọi
    const release = () => {
      if (pendingDrag.current === ev) pendingDrag.current = null // nhả trước khi kịp kéo → bỏ
      window.removeEventListener('mouseup', release, true)
    }
    window.addEventListener('mouseup', release, true)
  }

  // ── bấm / quét chọn
  const onPointerDown = (e) => {
    justSelected.current = null
    if (readOnly || e.button !== 0) return
    if (e.target.closest('.moveable-control-box, .ed-editing')) return
    const node = e.target.closest('.cv-page > .cv-el')
    if (node) {
      const id = node.dataset.id
      if (e.shiftKey) {
        onSelect(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
      } else if (!selectedIds.includes(id)) {
        onSelect([id])
        justSelected.current = id // kéo bắt đầu ở onMouseDown, xem dưới
      }
      return
    }
    // vùng trống → quét chọn
    const start = { x: e.clientX, y: e.clientY }
    const base = e.shiftKey ? selectedIds : []
    let moved = false
    const move = (ev) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return
      moved = true
      setMarquee({ x1: start.x, y1: start.y, x2: ev.clientX, y2: ev.clientY })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setMarquee(null)
      if (!moved) {
        if (!e.shiftKey) onSelect([])
        return
      }
      const box = { l: Math.min(start.x, ev.clientX), r: Math.max(start.x, ev.clientX), t: Math.min(start.y, ev.clientY), b: Math.max(start.y, ev.clientY) }
      const hit = [...pageRef.current.querySelectorAll('.cv-page > .cv-el')]
        .filter((n) => {
          const r = n.getBoundingClientRect()
          return r.left < box.r && r.right > box.l && r.top < box.b && r.bottom > box.t
        })
        .map((n) => n.dataset.id)
      onSelect([...new Set([...base, ...hit])])
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onDoubleClick = (e) => {
    const node = e.target.closest('.cv-page > .cv-el')
    const el = node && byId.get(node.dataset.id)
    if (el?.type === 'video' && el.src) return onOpenVideo(el.id) // xem được cả khi trang đang bị khoá
    if (readOnly) return
    if (el?.type === 'group') {
      // như Canva: nhấp đúp vào nhóm → vào trong, chọn đúng phần vừa bấm (ở đây: rã nhóm rồi chọn phần đó)
      let child = e.target.closest('.cv-el')
      while (child && child !== node && child.parentElement?.closest('.cv-el') !== node) child = child.parentElement.closest('.cv-el')
      return onEnterGroup(el.id, child && child !== node ? child.dataset.id : null)
    }
    if (el?.type === 'text') onStartEdit(el.id)
  }

  // ── kéo / đổi cỡ / xoay
  const begin = (ids) => {
    gesture.current = new Map(ids.map((id) => [id, { ...pick(byId.get(id)) }]))
  }
  const finish = (e) => {
    if (!e.isDrag || !gesture.current.size) return
    const patches = {}
    for (const [id, g] of gesture.current) {
      patches[id] = { x: r1(g.x), y: r1(g.y), w: r1(Math.max(2, g.w)), h: r1(Math.max(2, g.h)), rot: Math.round(((g.rot % 360) + 360) % 360) }
    }
    gesture.current = new Map()
    onCommit(patches)
  }
  const applyDrag = (ev) => {
    const g = gesture.current.get(ev.target.dataset.id)
    if (!g) return
    g.x = ev.left / unit
    g.y = ev.top / unit
    // ghi bằng em (1em = 1pt của trang) như CanvasPage: chiều nào không đổi thì React không ghi lại,
    // để px ở đó thì đổi zoom xong phần tử lệch chỗ
    ev.target.style.left = `${g.x}em`
    ev.target.style.top = `${g.y}em`
  }
  const applyResize = (ev) => {
    const id = ev.target.dataset.id
    const g = gesture.current.get(id)
    if (!g) return
    const s = ev.target.style
    Object.assign(g, { w: ev.width / unit, h: ev.height / unit, x: ev.drag.left / unit, y: ev.drag.top / unit })
    s.width = `${g.w}em`
    s.height = `${g.h}em`
    s.left = `${g.x}em`
    s.top = `${g.y}em`
    const el = byId.get(id)
    if (el?.type === 'group') {
      const inner = ev.target.querySelector(':scope > .cv-group')
      if (inner) inner.style.transform = `scale(${g.w / el.bw}, ${g.h / el.bh})`
    }
  }

  // ── thả ảnh / mục từ cột trái
  const onDragOver = (e) => {
    if (readOnly) return
    const types = e.dataTransfer.types
    if (types.includes(DND_TYPE) || types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDropOver(true)
    }
  }
  const onDrop = (e) => {
    setDropOver(false)
    if (readOnly) return
    e.preventDefault()
    const at = toPage(e.clientX, e.clientY)
    const under = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((n) => n.closest?.('.cv-page > .cv-el'))
      .find(Boolean)
    const target = under && byId.get(under.dataset.id)
    const raw = e.dataTransfer.getData(DND_TYPE)
    if (raw) onDropData(JSON.parse(raw), at, target)
    else if (e.dataTransfer.files.length) onDropFiles([...e.dataTransfer.files], at, target)
  }

  return (
    <div className="ed-stage" ref={wrapRef} onPointerDown={onPointerDown} onMouseDown={onMouseDown} onDragOver={onDragOver} onDragLeave={() => setDropOver(false)} onDrop={onDrop}>
      <div className="ed-stage__scroll">
        <div
          ref={pageRef}
          className={`ed-page ${readOnly ? 'is-readonly' : ''} ${dropOver ? 'is-dropover' : ''}`}
          style={{ width: pw, height: ph, '--pw': pw }}
          onDoubleClick={onDoubleClick}
        >
          {page && (
            <CanvasPage
              page={page}
              mode="edit"
              renderEl={(el, node) => (el.id === editingId ? <EditableText key={el.id} el={el} onDone={(text) => onEndEdit(el.id, text)} /> : node)}
            />
          )}
          {targets.length > 0 && (
            <Moveable
              ref={moveableRef}
              target={targets.length === 1 ? targets[0] : targets}
              draggable
              resizable
              rotatable={targets.length === 1}
              keepRatio={shift || single?.type === 'group'}
              throttleRotate={shift ? 15 : 0}
              origin={false}
              snappable
              snapThreshold={6}
              isDisplaySnapDigit={false}
              elementGuidelines={others}
              verticalGuidelines={[0, pw / 2, pw]}
              horizontalGuidelines={[0, ph / 2, ph]}
              snapDirections={SNAP_DIRS}
              elementSnapDirections={SNAP_DIRS}
              onDragStart={(e) => begin([e.target.dataset.id])}
              onDrag={applyDrag}
              onDragEnd={finish}
              onResizeStart={(e) => begin([e.target.dataset.id])}
              onResize={applyResize}
              onResizeEnd={finish}
              onRotateStart={(e) => begin([e.target.dataset.id])}
              onRotate={(e) => {
                e.target.style.transform = `rotate(${e.rotation}deg)`
                gesture.current.get(e.target.dataset.id).rot = e.rotation
              }}
              onRotateEnd={finish}
              onDragGroupStart={(e) => begin(e.targets.map((t) => t.dataset.id))}
              onDragGroup={(e) => e.events.forEach(applyDrag)}
              onDragGroupEnd={finish}
              onResizeGroupStart={(e) => begin(e.targets.map((t) => t.dataset.id))}
              onResizeGroup={(e) => e.events.forEach(applyResize)}
              onResizeGroupEnd={finish}
            />
          )}
        </div>
      </div>
      {marquee && (
        <div
          className="ed-marquee"
          style={{
            left: Math.min(marquee.x1, marquee.x2),
            top: Math.min(marquee.y1, marquee.y2),
            width: Math.abs(marquee.x2 - marquee.x1),
            height: Math.abs(marquee.y2 - marquee.y1),
          }}
        />
      )}
    </div>
  )
}

const pick = (el) => ({ x: el.x, y: el.y, w: el.w, h: el.h, rot: el.rot || 0 })
const r1 = (v) => Math.round(v * 10) / 10

/** Sửa chữ ngay trên trang (nhấp đúp). Enter = xuống dòng, Esc/bấm ra ngoài = xong. */
function EditableText({ el, onDone }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const node = ref.current
    node.innerText = el.text || ''
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    // chỉ khởi tạo một lần — sau đó nội dung do người dùng gõ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="cv-el ed-editing" style={boxStyle(el)}>
      <div
        ref={ref}
        className={`cv-text ${el.vertical ? 'is-vertical' : ''}`}
        style={textStyle(el)}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => onDone(e.currentTarget.innerText.replace(/\n$/, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
          e.stopPropagation()
        }}
      />
    </div>
  )
}
