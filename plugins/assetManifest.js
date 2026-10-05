import fs from 'node:fs'
import path from 'node:path'

const VIRTUAL_ID = 'virtual:asset-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return []
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full, base)
    return [path.relative(base, full).split(path.sep).join('/')]
  })
}

/**
 * Exposes the list of files in public/assets as `virtual:asset-manifest`.
 * The app uses it to know whether a video/audio file exists, so it can show a
 * placeholder instead of a broken player — without any 404 request.
 */
export default function assetManifest() {
  let publicDir = 'public'

  return {
    name: 'asset-manifest',
    configResolved(config) {
      publicDir = config.publicDir
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const files = walk(path.join(publicDir, 'assets')).map((f) => 'assets/' + f)
      return `export default ${JSON.stringify(files)}`
    },
    configureServer(server) {
      const assetsDir = path.join(publicDir, 'assets')
      server.watcher.add(assetsDir)
      const refresh = (file) => {
        if (!file.startsWith(assetsDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}
