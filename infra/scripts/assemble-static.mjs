// Canon: SinopticsAI/pharma_ui. Assembles out/ like serve-demo.mjs on :4173:

// кабинет pharma_cert в корне, /cn, /ru и лаунчер «рядом» на /split.
// Отсутствие сборки не ошибка — домен поднимается с заглушкой.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..', '..')
const demoRoot = join(repoRoot, 'portal', 'demo')
const outDir = join(repoRoot, 'out')
const stubLauncher = join(repoRoot, 'infra', 'static', 'index.html')
const portalDist = join(demoRoot, 'apps', 'web-portal', 'dist')
const splitDir = join(demoRoot, 'launcher')

const contours = [
  { name: 'cn', dist: join(demoRoot, 'apps', 'web-cn', 'dist') },
  { name: 'ru', dist: join(demoRoot, 'apps', 'web-ru', 'dist') },
]

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

if (existsSync(join(portalDist, 'index.html'))) {
  cpSync(portalDist, outDir, { recursive: true })
  console.log(`copied / from ${portalDist}`)
} else {
  cpSync(stubLauncher, join(outDir, 'index.html'))
  console.log('skip /: web-portal dist missing, using infra/static stub')
}

const present = []
for (const { name, dist } of contours) {
  if (!existsSync(join(dist, 'index.html'))) {
    console.log(`skip /${name}: ${dist} has no index.html`)
    continue
  }
  cpSync(dist, join(outDir, name), { recursive: true })
  present.push(name)
  console.log(`copied /${name} from ${dist}`)
}

if (existsSync(join(splitDir, 'index.html'))) {
  cpSync(splitDir, join(outDir, 'split'), { recursive: true })
  present.push('split')
  console.log(`copied /split from ${splitDir}`)
}

console.log(`assembled ${outDir}, mounts: ${present.length ? ['/', ...present].join(', ') : '/'}`)
