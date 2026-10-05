import Icon from '../common/Icon.jsx'

/** links: [{ label: 'Đọc thêm', href: 'https://…' }] */
export default function Links({ links, anim }) {
  if (!links?.length) return null
  return (
    <ul className="page-links" data-anim={anim} style={{ '--d': '0.6s' }}>
      {links.map((l, i) => (
        <li key={i}>
          <a href={l.href} target={l.href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">
            {l.label}
            <Icon name="arrowUpRight" size={14} />
          </a>
        </li>
      ))}
    </ul>
  )
}
