# pharma_ui

Веб-интерфейс кабинета MedMost и деплой статики на `https://pharma.sinoptics.ru`.

Этот репозиторий — канон UI и его выкладки. Продуктовые виды остаются в
`pharma_cert`. API кабинета, шлюз Edge и базы сюда не кладут.

- Виды и исследование: [`SinopticsVit/pharma_cert`](https://github.com/SinopticsVit/pharma_cert)
- API: [`SinopticsAI/pharma-edge`](https://github.com/SinopticsAI/pharma-edge)
- Ingress API: [`SinopticsAI/pharma_env`](https://github.com/SinopticsAI/pharma_env) — `pharma-edge.sinoptics.ru`, не этот домен
- PostgreSQL: [`SinopticsAI/pharma-postgracesql`](https://github.com/SinopticsAI/pharma-postgracesql)

**Дата среза:** 3 сентября 2026 года.

Кабинеты работают на живом ядре: вход через Keycloak realm `pharma`, данные и
чат — на `https://pharma-edge.sinoptics.ru`. Мока на боевых экранах нет: пустой
портфель на пустой базе — это ответ ядра, а не поломка вёрстки. Этот
репозиторий по-прежнему только собирает и заливает статику.

## Переменные сборки

Публичные значения: всё, что попадает в `VITE_*`, уезжает в браузер вместе с
бандлом. Образец — [`portal/demo/.env.example`](portal/demo/.env.example), те же
значения заданы на шаге сборки в [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

| Переменная | Значение | Зачем |
| --- | --- | --- |
| `VITE_API_URL` | `https://pharma-edge.sinoptics.ru` | REST кабинета |
| `VITE_AGENT_API` | `https://pharma-edge.sinoptics.ru` | `POST /chat/{agentId}` через тот же шлюз |
| `VITE_KEYCLOAK_URL` | `https://auth.sinoptics.ru` | вход |
| `VITE_KEYCLOAK_REALM` | `pharma` | realm |
| `VITE_KEYCLOAK_CLIENT_ID` | `medmost-spa` | публичный клиент с PKCE |

Без этих переменных сборка падает явно. `X-API-Key` в браузер не кладут: это
служебный путь агента и вебхуков Plane.

## Что нужно снаружи

- **Публичный вход Edge.** `pharma-edge.sinoptics.ru` поднимает
  [`pharma_env`](https://github.com/SinopticsAI/pharma_env): шлюз
  `pharma-edge-api-gateway` и запись CNAME. Живых функций недостаточно — без
  шлюза и DNS браузер не видит ядро, и кабинет показывает `core_unreachable`
  с адресом, на котором встал запрос.
- **Аккаунт.** Пользователь realm `pharma` должен быть прописан в
  `account_users`. Иначе кабинет покажет экран `account_not_linked`: аккаунты
  заводит менеджер, саморегистрации нет.
- **Резолв аккаунта для агента.** Инструменты агента ходят в Edge по служебному
  ключу и требуют заголовок аккаунта, которого у браузерного вызова нет. Чат
  отвечает текстом, но карточки с данными падают:
  [SinopticsAI/pharma-agent#1](https://github.com/SinopticsAI/pharma-agent/issues/1).
- **Локальный порт.** Redirect URIs клиента покрывают `5173` (`web-cn`), `5174`
  (`web-ru`), `5175` (`web-portal`). Демо-сервер на `:4173` войти не даст, пока
  порт не добавят в realm.

## Что появляется после прогона

| Объект | Имя | Зачем |
| --- | --- | --- |
| Бакет | `pharma-sinoptics-ru` | HTML/JS/CSS кабинетов |
| API Gateway | `pharma-api-gateway` | раздаёт бакет на `pharma.sinoptics.ru` |
| CNAME | `pharma.sinoptics.ru.` | публичный адрес UI |

Не трогать `pharma-edge-api-gateway` и бакет `pharma-dossier`.

## Локально

```powershell
cd portal\demo
corepack enable
# Если EPERM на Program Files: corepack enable --install-directory $env:LOCALAPPDATA\bin
pnpm install
Copy-Item .env.example .env
pnpm run dev      # кабинет pharma_cert, :5175
pnpm run dev:cn   # кабинет производителя, :5173
pnpm run dev:ru   # консоль оператора, :5174
```

Порты не произвольные: именно они прописаны в redirect URIs клиента
`medmost-spa`. `pnpm run demo` собирает всё на `:4173` и годится для проверки
сборки, но не для входа.

| Приложение | Путь на домене | Контур запроса |
| --- | --- | --- |
| `web-portal` | `/` | `cn` — клиентский кабинет, без реквизитов УКЭП и ЕСИА |
| `web-cn` | `/cn/` | `cn` |
| `web-ru` | `/ru/` | `ru` — мандат с реквизитами, ввод статуса |
| лаунчер | `/split/` | статика |

## Деплой

Нужен профиль `yc` на folder `b1g07nbj3q7ccru38on0`. Ключ SA не коммитить.

```powershell
yc config profile create pharma-ui
yc config set cloud-id b1gip1vv7381q4bsoaso
yc config set folder-id b1g07nbj3q7ccru38on0
yc config profile activate pharma-ui
```

```powershell
cd portal\demo
corepack enable
pnpm install
Copy-Item .env.example .env   # сборка читает VITE_* отсюда
pnpm run build
cd ..\..
Copy-Item .\infra\account.env.example .\infra\account.env
.\infra\scripts\discover.ps1
.\infra\scripts\deploy-bucket.ps1
```

Если домена ещё нет (один раз):

```powershell
.\infra\scripts\deploy-gateway.ps1
.\infra\scripts\deploy-dns.ps1
```

Пуш в `main` запускает [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
сборка → заливка бакета → обновление spec уже существующего шлюза.
Секрет: `YC_SA_JSON_CREDENTIALS`. CI не создаёт шлюз и не правит DNS.

## Документы

| Файл | Содержание |
| --- | --- |
| [`portal/demo/README.md`](portal/demo/README.md) | как устроены кабинеты и локальный запуск |
| [`infra/README.md`](infra/README.md) | скрипты, бакет, шлюз, диагностика |
| [`spec/deploy.md`](spec/deploy.md) | CI, секреты, что не трогать |
| [`spec/frontend_framework.md`](spec/frontend_framework.md) | стек кабинетов: сборка, маршруты, данные, UI |

## Каталог Yandex Cloud

- Cloud: `b1gip1vv7381q4bsoaso`
- Folder: `b1g07nbj3q7ccru38on0`
- Домен: `pharma.sinoptics.ru`
- Бакет: `pharma-sinoptics-ru`
- Шлюз: `pharma-api-gateway`

SA с префиксом `logos-*` не трогать.
