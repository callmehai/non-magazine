/**
 * Khoá theo trang, dựa trên "ai đang ở đâu" (presence) — không lưu khoá trong DB nên
 * không bao giờ bị kẹt khoá khi ai đó tắt máy/mất mạng.
 *
 * Mỗi người báo { pageId, pageSince }. Trên một trang, người vào SỚM NHẤT được sửa;
 * người vào sau chỉ xem, và tự được sửa khi người trước rời trang.
 */
export function lockHolder(presence, pageId) {
  let holder = null
  for (const p of presence) {
    if (p.pageId !== pageId) continue
    if (!holder || p.pageSince < holder.pageSince || (p.pageSince === holder.pageSince && p.key < holder.key)) holder = p
  }
  return holder
}

/** pageId → người đang giữ trang đó (để hiện avatar trên danh sách trang) */
export function holdersByPage(presence) {
  const map = new Map()
  for (const p of presence) {
    if (!p.pageId) continue
    const h = lockHolder(presence, p.pageId)
    if (h) map.set(p.pageId, h)
  }
  return map
}
