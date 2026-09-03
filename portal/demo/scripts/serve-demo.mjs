import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Демо-сервер. Основной кабинет pharma_cert отдаётся с корня.
 * Контуры КНР/РФ и лаунчер инвесторов сохранены на /cn, /ru и /split.
 */

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.env.PORT ?? 4173)

const launcherDir = join(root, 'launcher')
const portalDir = join(root, 'apps', 'web-portal', 'dist')
const mounts = [
  { prefix: '/cn', dir: join(root, 'apps', 'web-cn', 'dist') },
  { prefix: '/ru', dir: join(root, 'apps', 'web-ru', 'dist') },
  { prefix: '/split', dir: launcherDir },
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

for (const mount of [{ prefix: '/', dir: portalDir }, ...mounts]) {
  const index = join(mount.dir, 'index.html')
  if (!existsSync(index)) {
    console.error(`Нет сборки ${mount.prefix}: ожидается ${index}. Сначала выполните npm run build.`)
    process.exit(1)
  }
}

function safeJoin(baseDir, relativePath) {
  const target = resolve(baseDir, `.${relativePath}`)
  return target === baseDir || target.startsWith(baseDir + sep) ? target : null
}

async function send(response, filePath, status = 200) {
  const body = await readFile(filePath)
  response.writeHead(status, {
    'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  response.end(body)
}

async function sendSpa(response, dir, pathname) {
  const relative = pathname === '/' ? '/index.html' : pathname
  const candidate = safeJoin(dir, relative)
  if (candidate && existsSync(candidate) && !candidate.endsWith(sep)) {
    await send(response, candidate)
    return
  }
  await send(response, join(dir, 'index.html'))
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)

    for (const mount of mounts) {
      if (pathname === mount.prefix) {
        response.writeHead(302, { Location: `${mount.prefix}/` })
        response.end()
        return
      }
      if (pathname.startsWith(`${mount.prefix}/`)) {
        const relative = pathname.slice(mount.prefix.length) || '/'
        await sendSpa(response, mount.dir, relative)
        return
      }
    }

    await sendSpa(response, portalDir, pathname)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(`Ошибка демо-сервера: ${error instanceof Error ? error.message : String(error)}`)
  }
})

server.listen(port, () => {
  console.log('Демо-стенд запущен:')
  console.log(`  кабинет pharma_cert        http://localhost:${port}/`)
  console.log(`  кабинет производителя КНР  http://localhost:${port}/cn/`)
  console.log(`  консоль оператора РФ       http://localhost:${port}/ru/`)
  console.log(`  режим «рядом»              http://localhost:${port}/split/`)
})
