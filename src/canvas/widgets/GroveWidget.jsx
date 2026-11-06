import { useEffect, useState } from 'react'

/**
 * Lũy tre lớn dần (cặp trang "Lưu ý về nội dung", anh Hải 05/11: "trái phải hơi trống … làm chuỗi hiệu ứng liên quan
 * đến cây tre lớn dần các thứ, chưa thấy làm chỗ nào, toàn dựng hình ảnh đứng dậy thôi").
 * Nét mảnh cùng kiểu hình vẽ của sách (deco/bamboo.svg, tre-mang.svg), vẽ bằng SVG để từng nét chạy được:
 *  - trang phải ("right"): 16 vòng tròn đồng tâm vẽ dần (concept 16 vòng tre) → mặt đất → măng nhú → thân tre mọc từng
 *    đốt, lá xòe ở các đốt trên → dưới gốc tre một chiếc nón "được làm": 8 gọng khuôn, 16 vòng từ vành lên chóp, lợp lá,
 *    buộc quai đỏ; chồng nón xếp dần cạnh đó → tre đứng yên (anh Hải chê lá rơi "như shit"; đung đưa mãi làm trang lag → bỏ cả hai);
 *  - trang trái ("left"): dải dưới trang — mặt đất vẽ từ mép trái sang gáy sách (nối sang trang phải), măng non + một
 *    cây tre non ("tre già măng mọc").
 * Chạy lại mỗi lần trang được lật tới (visible); chưa tới thì ẩn hết (không hiện trước rồi mới chạy — lỗi cũ ở trang mở
 * chương). Ảnh thu nhỏ / editor / giảm chuyển động: hình tĩnh trọn vẹn.
 * el.variant = 'left' | 'right'; toạ độ vẽ = pt của khung phần tử (viewBox = el.w × el.h).
 */
const INK = '#8a6a3c'
const LEAF = '#d3dfc3'
const RING = '#c9b48f'
const HAT = '#efe3c4'
const RIM = '#8b4a2b'
const QUAI = '#a8382b'

// điểm + tiếp tuyến trên đường cong bậc hai
const qp = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]
const f1 = (n) => Math.round(n * 10) / 10

// nét vẽ dần: pathLength = 1 → dash 1, chạy offset 1 → 0
const draw = (t, d, extra = {}) => ({
  pathLength: 1,
  className: 'cvg-draw',
  style: { '--t': `${f1(t)}s`, '--d': `${d}s`, ...extra },
})
const pop = (t, d, ox, oy, cls = 'cvg-pop') => ({
  className: cls,
  style: {
    '--t': `${f1(t)}s`,
    '--d': `${d}s`,
    transformOrigin: `${f1(ox)}px ${f1(oy)}px`,
  },
})

function Leaf({ x, y, a, L, W, t }) {
  const d = `M0 0 C ${f1(L * 0.25)} ${f1(-W)} ${f1(L * 0.65)} ${f1(-W * 0.8)} ${f1(L)} 0 C ${f1(L * 0.65)} ${f1(W * 0.5)} ${f1(L * 0.25)} ${f1(W * 0.6)} 0 0 Z`
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})`}>
      <g {...pop(t, 0.7, 0, 0, 'cvg-leaf')}>
        <path d={d} fill={LEAF} stroke={INK} strokeWidth="1" />
        <path d={`M2 0 Q ${f1(L * 0.5)} ${f1(-W * 0.15)} ${f1(L * 0.9)} 0`} stroke={INK} strokeWidth="0.5" opacity="0.6" />
      </g>
    </g>
  )
}

/**
 * một cây tre: gốc (x, G), cao h, ngọn vồng sang ngang lean; mọc từ t0 trong dur giây.
 * Dáng lũy tre Bắc Bộ (soát vòng 7: bản đầu thân thẳng đứng, lá xòe đều từng đốt → giống tranh trúc): thân lên gần thẳng
 * rồi ngọn cong vồng xuống một bên, lá dồn ở nửa trên và chùm ở ngọn
 */
function Culm({ x, G, h, lean, w, t0, dur, nodes = 8, leafFrom = 0.55, side = 1 }) {
  const a = [x, G]
  const b = [x + lean, G - h * 0.9]
  const c = [x + lean * 0.06, G - h * 0.82]
  const a2 = [x + w, G]
  const b2 = [x + lean + w * 0.3, G - h * 0.9]
  const c2 = [x + lean * 0.06 + w * 0.75, G - h * 0.82]
  const ts = Array.from({ length: nodes }, (_, k) => (k + 1) / (nodes + 0.6))
  const leaves = []
  ts.forEach((t, k) => {
    if (t < leafFrom) return
    const [px, py] = qp(a, c, b, t)
    const s = (k % 2 ? -1 : 1) * side
    const tl = t0 + dur * t + 0.1
    const tw = 12 + (k % 3) * 5
    const ex = px + w / 2 + s * tw
    const ey = py - tw * 0.45
    leaves.push(
      <path key={`b${k}`} d={`M${f1(px + w / 2)} ${f1(py)} Q ${f1(px + w / 2 + s * tw * 0.5)} ${f1(py - tw * 0.4)} ${f1(ex)} ${f1(ey)}`} stroke={INK} strokeWidth="0.9" {...draw(tl, 0.35)} />,
    )
    const fan = s > 0 ? [10, 44] : [170, 136] // lá tre rủ xuống (2 lá một cành: đỡ nặng lúc mọc)
    fan.forEach((ang, j) => leaves.push(<Leaf key={`l${k}${j}`} x={ex} y={ey} a={ang + (k % 2) * 6} L={34 + ((k + j) % 3) * 6} W={4.2 + (j % 2) * 0.8} t={tl + 0.2 + j * 0.09} />))
  })
  // ngọn: chùm ba lá rủ theo hướng ngọn vồng
  const tt = t0 + dur + 0.05
  const dir = lean >= 0 ? 0 : 180
  ;[20, 55, 90].forEach((ang, j) => leaves.push(<Leaf key={`tip${j}`} x={b[0]} y={b[1] + 1} a={lean >= 0 ? dir + ang : dir - ang} L={30 - j * 3} W={4.3 - j * 0.3} t={tt + j * 0.1} />))
  return (
    <g>
      <path d={`M${f1(a[0])} ${f1(a[1])} Q ${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}`} stroke={INK} strokeWidth="1.3" {...draw(t0, dur, { animationTimingFunction: 'linear' })} />
      <path
        d={`M${f1(a2[0])} ${f1(a2[1])} Q ${f1(c2[0])} ${f1(c2[1])} ${f1(b2[0])} ${f1(b2[1])}`}
        stroke={INK}
        strokeWidth="1.1"
        opacity="0.55"
        {...draw(t0 + 0.05, dur, { animationTimingFunction: 'linear' })}
      />
      {ts.map((t, k) => {
        const [px, py] = qp(a, c, b, t)
        const ww = w * (1 - t * 0.6)
        return <path key={k} d={`M${f1(px - 1.5)} ${f1(py)} h${f1(ww + 3)}`} stroke={INK} strokeWidth="1.2" opacity="0.85" {...pop(t0 + dur * t, 0.25, px + ww / 2, py, 'cvg-node')} />
      })}
      {leaves}
    </g>
  )
}

function Shoot({ x, G, h, t }) {
  return (
    <g {...pop(t, 0.6, x, G, 'cvg-rise')}>
      {/* măng nhọn, bẹ xếp chéo, ngả xanh (soát vòng 7: măng tròn trông như nón tí hon) */}
      <path
        d={`M${f1(x - h * 0.13)} ${G} C ${f1(x - h * 0.12)} ${f1(G - h * 0.5)}, ${f1(x - h * 0.03)} ${f1(G - h * 0.85)}, ${f1(x + h * 0.04)} ${f1(G - h)} C ${f1(x + h * 0.06)} ${f1(G - h * 0.7)}, ${f1(x + h * 0.12)} ${f1(G - h * 0.4)}, ${f1(x + h * 0.13)} ${G} Z`}
        fill="#dfe4c4"
        stroke={INK}
        strokeWidth="1"
      />
      <path
        d={`M${f1(x - h * 0.12)} ${f1(G - h * 0.12)} L ${f1(x + h * 0.1)} ${f1(G - h * 0.36)} M${f1(x + h * 0.11)} ${f1(G - h * 0.2)} L ${f1(x - h * 0.07)} ${f1(G - h * 0.55)} M${f1(x - h * 0.06)} ${f1(G - h * 0.48)} L ${f1(x + h * 0.06)} ${f1(G - h * 0.74)}`}
        stroke={INK}
        strokeWidth="0.7"
        opacity="0.75"
      />
    </g>
  )
}

/** nón đứng trên vành, đỉnh lên trời: gọng khuôn → 16 vòng (vành lên chóp) → lợp lá → vành cạp → quai → núm chóp */
function Hat({ cx, by, R, t0, rings = 16, ribs = true, quai = true, fast = 1 }) {
  const H = R * 0.66 // dáng nón Chuông: cao ≤ 0,68 × bán kính vành
  const RY = R * 0.2
  const top = by - H
  const ring = (t) => {
    const rx = R * t
    const ry = RY * t
    const cy = by - H * (1 - t)
    return `M${f1(cx - rx)} ${f1(cy)} A ${f1(rx)} ${f1(ry)} 0 0 0 ${f1(cx + rx)} ${f1(cy)}`
  }
  const cone = `M${f1(cx - R)} ${f1(by)} L ${f1(cx)} ${f1(top)} L ${f1(cx + R)} ${f1(by)} A ${f1(R)} ${f1(RY)} 0 0 1 ${f1(cx - R)} ${f1(by)} Z`
  const tR = t0 + (ribs ? 0.55 : 0) * fast
  const tF = tR + rings * 0.07 * fast + 0.3
  return (
    <g>
      {/* review lần 2: vẽ cả vòng elip thì nửa sau của vành lộ ra hai bên thân nón (nón trông trong suốt) → chỉ nửa trước */}
      <path d={ring(1)} stroke={INK} strokeWidth="1" opacity="0.6" {...draw(t0, 0.6 * fast)} />
      <path d={cone} fill={HAT} stroke="none" {...pop(tF, 0.7, cx, by, 'cvg-fade')} />
      {ribs &&
        Array.from({ length: 9 }, (_, k) => {
          const th = (k * Math.PI) / 8
          return (
            <path
              key={k}
              d={`M${f1(cx)} ${f1(top)} L ${f1(cx + R * Math.cos(th))} ${f1(by + RY * Math.sin(th))}`}
              stroke={INK}
              strokeWidth="0.7"
              {...draw(t0 + k * 0.04, 0.45, {
                '--to': 0.22,
                '--tt': `${f1(tF + 0.4)}s`,
              })}
            />
          )
        })}
      {Array.from({ length: rings }, (_, i) => {
        const t = 1 - i / rings // vành trước, chóp sau
        return <path key={i} d={ring(t)} stroke={INK} strokeWidth={i === 0 ? 0 : 0.7} opacity="0.75" {...draw(tR + i * 0.07 * fast, 0.3)} />
      })}
      <path d={`M${f1(cx - R)} ${f1(by)} L ${f1(cx)} ${f1(top)} L ${f1(cx + R)} ${f1(by)}`} stroke={INK} strokeWidth="1.2" {...draw(tF, 0.6)} />
      <path d={ring(1)} stroke={RIM} strokeWidth="2.2" {...draw(tF + 0.2, 0.6)} />
      {/* quai buộc vào hai mảng nhôi TRONG lòng nón: nón úp vành xuống đất thì chỉ thấy đoạn quai thò ra dưới vành trước, võng
          trên mặt đất (anh Hải 06/11: trước vẽ chữ U đè ngoài thân nón — "dây nói ngoài nón") */}
      {quai && (
        <path
          d={`M${f1(cx - R * 0.34)} ${f1(by + RY * 0.94)} C ${f1(cx - R * 0.3)} ${f1(by + RY * 1.4)}, ${f1(cx + R * 0.3)} ${f1(by + RY * 1.4)}, ${f1(cx + R * 0.34)} ${f1(by + RY * 0.94)}`}
          stroke={QUAI}
          strokeWidth="1.5"
          {...draw(tF + 0.7, 0.6)}
        />
      )}
      <circle cx={cx} cy={top + 1} r={Math.max(2.5, R * 0.05)} fill={HAT} stroke={INK} strokeWidth="1" {...pop(tF + 0.8, 0.4, cx, top + 1)} />
    </g>
  )
}

/**
 * chồng nón như ngoài chợ Chuông: những chiếc nón nguyên hình lồng lên nhau, mỗi chiếc cao hơn chiếc dưới một chút
 * (thấy vành nâu đỏ từng chiếc xếp tầng, chóp chiếc trên cùng); rơi xuống chồng lên lần lượt.
 * (anh Hải 05/11: bản đầu vẽ các vành dẹt chồng lên nhau — "như mấy cái đĩa")
 */
function Stack({ cx, by, R, n, t0 }) {
  const H = R * 0.66
  const RY = R * 0.2
  const step = 9
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const b = by - i * step
        const top = b - H
        const cone = `M${f1(cx - R)} ${f1(b)} L ${f1(cx)} ${f1(top)} L ${f1(cx + R)} ${f1(b)} A ${f1(R)} ${f1(RY)} 0 0 1 ${f1(cx - R)} ${f1(b)} Z`
        const ring = (t) => `M${f1(cx - R * t)} ${f1(b - H * (1 - t))} A ${f1(R * t)} ${f1(RY * t)} 0 0 0 ${f1(cx + R * t)} ${f1(b - H * (1 - t))}`
        return (
          <g key={i} {...pop(t0 + i * 0.28, 0.5, cx, b + RY, 'cvg-drop')}>
            <path d={cone} fill={HAT} stroke={INK} strokeWidth="1" />
            {[0.3, 0.5, 0.7, 0.88].map((t) => (
              <path key={t} d={ring(t)} stroke={INK} strokeWidth="0.6" opacity="0.55" />
            ))}
            <path d={ring(1)} stroke={RIM} strokeWidth="2" />
            {i === n - 1 && <circle cx={cx} cy={top + 1} r={Math.max(2.5, R * 0.05)} fill={HAT} stroke={INK} strokeWidth="1" />}
          </g>
        )
      })}
    </g>
  )
}

function Grass({ x, G, t, s = 1 }) {
  return (
    <path d={`M${x} ${G} q ${-3 * s} -9 ${-7 * s} -13 M${x + 2} ${G} q 1 -11 ${3 * s} -16 M${x + 4} ${G} q ${4 * s} -7 ${9 * s} -10`} stroke={INK} strokeWidth="0.8" opacity="0.7" {...draw(t, 0.4)} />
  )
}

function Right({ w, h }) {
  const G = h - 10
  const cx0 = w / 2 + 6
  const cy0 = Math.min(270, G - 360)
  const cp = { G }
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={cx0} cy={cy0} r={14 + i * 12.6} stroke={RING} strokeWidth={i === 15 ? 1.1 : 0.8} opacity={0.75} transform={`rotate(-90 ${cx0} ${cy0})`} {...draw(0.1 + i * 0.07, 0.9)} />
      ))}
      <path d={`M0 ${G} Q ${w * 0.25} ${G - 3} ${w * 0.5} ${G} T ${w} ${G}`} stroke={INK} strokeWidth="1" {...draw(0.9, 1.1, { animationTimingFunction: 'linear' })} />
      {[40, 150, 262, 410, 560].map((x, i) => (
        <Grass key={x} x={x} G={G} t={1.2 + i * 0.15} s={i % 2 ? -1 : 1} />
      ))}
      {[
        [64, 22, 1.4],
        [118, 30, 1.5],
        [452, 26, 1.55],
        [540, 34, 1.65],
      ].map(([x, hh, t]) => (
        <Shoot key={x} x={x} G={G} h={hh} t={t} />
      ))}
      <Stack cx={196} by={G - 62 * 0.2 - 1} R={62} n={5} t0={5.7} />
      <Hat cx={338} by={G - 98 * 0.2 - 1} R={98} t0={3.1} />
      {/* khóm trái ngả vào giữa trang, khóm phải ngả ngược lại: hai bụi tre ôm lấy vòng tròn và chiếc nón */}
      <Culm x={72} {...cp} h={480} lean={60} w={7} t0={1.7} dur={2.1} nodes={8} side={1} />
      <Culm x={84} {...cp} h={410} lean={88} w={5} t0={1.95} dur={1.9} nodes={7} side={-1} />
      <Culm x={98} {...cp} h={330} lean={104} w={4.5} t0={2.2} dur={1.7} nodes={6} side={1} leafFrom={0.6} />
      <Culm x={62} {...cp} h={300} lean={30} w={4.5} t0={2.35} dur={1.6} nodes={5} side={-1} leafFrom={0.6} />
      <Culm x={494} {...cp} h={570} lean={-72} w={8} t0={1.85} dur={2.3} nodes={9} side={-1} />
      <Culm x={478} {...cp} h={460} lean={-100} w={5.5} t0={2.1} dur={2.0} nodes={7} side={1} />
      <Culm x={510} {...cp} h={420} lean={-40} w={5} t0={2.4} dur={1.8} nodes={6} side={-1} leafFrom={0.6} />
      <Culm x={524} {...cp} h={320} lean={-28} w={4.5} t0={2.6} dur={1.6} nodes={5} side={1} leafFrom={0.6} />
    </>
  )
}

function Left({ w, h }) {
  const G = h - 10
  return (
    <>
      <path d={`M0 ${G} Q ${w * 0.4} ${G - 3} ${w * 0.7} ${G} T ${w} ${G}`} stroke={INK} strokeWidth="1" {...draw(0.2, 0.75, { animationTimingFunction: 'linear' })} />
      {[52, 196, 300, 430, 520].map((x, i) => (
        <Grass key={x} x={x} G={G} t={0.4 + i * 0.12} s={i % 2 ? 1 : -1} />
      ))}
      {[
        [86, 18, 0.7],
        [128, 26, 0.85],
        [236, 14, 1.0],
        [362, 22, 1.15],
        [470, 16, 1.3],
      ].map(([x, hh, t]) => (
        <Shoot key={x} x={x} G={G} h={hh} t={t} />
      ))}
      <Culm x={156} G={G} h={Math.min(h - 14, 82)} lean={18} w={4} t0={1.3} dur={1.2} nodes={3} leafFrom={0.6} side={1} />
    </>
  )
}

export default function GroveWidget({ el, interactive, visible }) {
  const live = interactive && !matchMedia?.('(prefers-reduced-motion: reduce)').matches
  // mỗi lần lật tới: đếm lần chạy (key mới → chạy lại từ đầu); rời trang → về trạng thái chờ (ẩn)
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (live) setRun((r) => (visible ? r + 1 : 0))
  }, [live, visible])
  const w = el.w || 595
  const h = el.h || 700
  const state = !live ? 'is-static' : run ? 'is-run' : 'is-wait'
  return (
    <svg key={run} className={`cvw cvw-grove ${state}`} viewBox={`0 0 ${w} ${h}`} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {el.variant === 'left' ? <Left w={w} h={h} /> : <Right w={w} h={h} />}
    </svg>
  )
}
