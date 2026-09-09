import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Стоп-лист формулировок из portal/view/05-marketingovoe.md §7.
 * Запрещённая фраза в интерфейсной строке роняет сборку демо так же,
 * как она роняет сборку презентации.
 */
const FORBIDDEN = [
  { pattern: /гарантирова\w*\s+(получени\w*\s+)?РУ/i, why: 'обещание гарантированного регистрационного удостоверения' },
  { pattern: /гарант\w*\s+(регистрац|одобрен|положительн)/i, why: 'обещание гарантированного решения регулятора' },
  { pattern: /сертификат\w*\s+для\s+Росси/i, why: 'подмена регистрации сертификатом' },
  { pattern: /за\s+60\s+дней/i, why: 'срок регулятора выдан за срок проекта' },
  { pattern: /одобрено\s+Минздравом/i, why: 'заявление об одобрении без реестровой записи' },
  { pattern: /напрямую\s+из\s+Кита/i, why: 'подача в обход российского лица' },
  { pattern: /связ\w+\s+в\s+регулятор/i, why: 'обещание влияния на экспертизу' },
  { pattern: /ускор\w+\s+экспертиз\w*\s+через/i, why: 'обещание ускорения экспертизы' },
  { pattern: /guaranteed\s+(registration|approval|marketing\s+authorization)/i, why: 'guaranteed regulatory outcome' },
  { pattern: /certificate\s+for\s+Russia/i, why: 'registration replaced by a certificate' },
  { pattern: /approved\s+by\s+the\s+ministry/i, why: 'approval claim without a registry record' },
  { pattern: /保证.{0,6}(注册证|获批|通过)/, why: '保证获批的承诺' },
  { pattern: /包过/, why: '保证通过的承诺' },
]

const root = fileURLToPath(new URL('..', import.meta.url))
const SCAN_DIRS = ['packages', 'apps', 'launcher']
const SCAN_EXT = new Set(['.ts', '.tsx', '.html', '.css'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vite'])

async function collect(dir, found = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return found
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await collect(join(dir, entry.name), found)
    } else if (SCAN_EXT.has(extname(entry.name))) {
      found.push(join(dir, entry.name))
    }
  }
  return found
}

const files = (await Promise.all(SCAN_DIRS.map((dir) => collect(join(root, dir))))).flat()
const problems = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(line)) {
        problems.push({ file: relative(root, file), line: index + 1, text: line.trim(), why: rule.why })
      }
    }
  })
}

if (problems.length > 0) {
  console.error('Стоп-лист формулировок нарушен:')
  for (const problem of problems) {
    console.error(`  ${problem.file}:${problem.line} — ${problem.why}`)
    console.error(`    ${problem.text}`)
  }
  process.exit(1)
}

console.log(`Стоп-лист пройден: проверено ${files.length} файлов, запрещённых формулировок нет.`)
