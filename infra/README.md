# Yandex Cloud: pharma.sinoptics.ru

Канон статики кабинета. Шлюз `pharma-api-gateway` раздаёт бакет
`pharma-sinoptics-ru`: кабинет в корне, производитель на `/cn/`, оператор на
`/ru/`, режим «рядом» на `/split/`.

API кабинета (`pharma-edge-api-gateway` на `pharma-edge.sinoptics.ru`) живёт в
[`pharma_env`](https://github.com/SinopticsAI/pharma_env) — из этого
репозитория его не обновлять.

Ключ `yandex_key.env` в корне — только bootstrap `yc`. Не коммитить.
Профиль:

```powershell
yc config profile create pharma-ui
yc config set service-account-key yandex_key.env
yc config set cloud-id b1gip1vv7381q4bsoaso
yc config set folder-id b1g07nbj3q7ccru38on0
yc config profile activate pharma-ui
```

Скопировать [account.env.example](account.env.example) → `account.env`
и заполнить id через `discover.ps1`.

| Скрипт | Что делает |
| --- | --- |
| [scripts/discover.ps1](scripts/discover.ps1) | DNS-зона, MANAGED wildcard, свой шлюз |
| [scripts/assemble-static.mjs](scripts/assemble-static.mjs) | `portal/demo` dist → `out/` |
| [scripts/deploy-bucket.ps1](scripts/deploy-bucket.ps1) | бакет, заливка `out/`, удаление устаревших объектов |
| [scripts/deploy-gateway.ps1](scripts/deploy-gateway.ps1) | `pharma-api-gateway` + spec + `add-domain` |
| [scripts/deploy-dns.ps1](scripts/deploy-dns.ps1) | CNAME `pharma.sinoptics.ru.` |

`deploy-bucket.ps1` без аргумента сам собирает `out/`. Нужна сборка:

```powershell
cd portal\demo
corepack enable
pnpm install
pnpm run build
```

Повседневное обновление UI:

```powershell
.\infra\scripts\deploy-bucket.ps1
```

Первый подъём домена:

```powershell
.\infra\scripts\discover.ps1
.\infra\scripts\deploy-bucket.ps1
.\infra\scripts\deploy-gateway.ps1
.\infra\scripts\deploy-dns.ps1
```

Проверка: `https://pharma.sinoptics.ru/`, `/cn/`, `/ru/` — `200` и HTML.

## Если что-то не так

- **403.** SA шлюза не читает бакет: выдать `storage.viewer` на `pharma-sinoptics-ru`.
- **404 на `/cn/` или `/ru/`.** Нет `portal/demo/apps/*/dist` — сначала `pnpm run build`.
- **Домен не отвечает.** CNAME или `add-domain` ещё не делали.
