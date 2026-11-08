/**
 * Nhãn mời bấm dùng chung cho mọi phần tử tương tác (anh Hải 08/11: "lướt qua ko biết là có mini game đó, m làm cho mọi
 * thứ gây chú ý hơn đc ko"): viên son (điểm nhấn đỏ duy nhất của trang), bàn tay chỉ, vòng sáng lan quanh viên khi
 * người đọc chưa chạm tới (live). tag = chữ nhỏ đứng trước ("TRÒ CHƠI") cho các trò chơi.
 */
export const HAND = (
  <svg className="cvw-cta__ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 9.5V4a2 2 0 0 0-4 0v10" />
    <path d="M14 10V9a2 2 0 0 0-4 0v1" />
    <path d="M18 11v-1a2 2 0 0 0-4 0" />
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
)

export default function Cta({ tag, children, live = true, className = '', style }) {
  return (
    <span className={`cvw-cta ${live ? 'is-live' : ''} ${className}`} style={style}>
      {HAND}
      {tag && <b className="cvw-cta__tag">{tag}</b>}
      <span className="cvw-cta__txt">{children}</span>
    </span>
  )
}
