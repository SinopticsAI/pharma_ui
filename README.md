# pharma_ui

Веб-интерфейс кабинета MedMost и деплой статики на `https://pharma.sinoptics.ru`.

Этот репозиторий — канон UI и его выкладки. Продуктовые виды остаются в
`pharma_cert`. API кабинета, шлюз Edge и базы сюда не кладут.

- Виды и исследование: [`SinopticsVit/pharma_cert`](https://github.com/SinopticsVit/pharma_cert)
- API: [`SinopticsAI/pharma-edge`](https://github.com/SinopticsAI/pharma-edge)
- Ingress API: [`SinopticsAI/pharma_env`](https://github.com/SinopticsAI/pharma_env) — `pharma-edge.sinoptics.ru`, не этот домен
- PostgreSQL: [`SinopticsAI/pharma-postgracesql`](https://github.com/SinopticsAI/pharma-postgracesql)

**Дата среза:** 3 сентября 2026 года.

Сейчас кабинеты работают на мок-данных в браузере. Live-чат и JWT — после
подъёма Keycloak, Edge и агента; этот репозиторий по-прежнему только собирает
и заливает статику.

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
npm ci
npm run demo
```

| Адрес | Что |
| --- | --- |
| http://localhost:4173/ | кабинет pharma_cert |
| http://localhost:4173/cn/ | кабинет производителя |
| http://localhost:4173/ru/ | консоль оператора |
| http://localhost:4173/split/ | режим «рядом» |

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
npm ci
npm run build
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

## Каталог Yandex Cloud

- Cloud: `b1gip1vv7381q4bsoaso`
- Folder: `b1g07nbj3q7ccru38on0`
- Домен: `pharma.sinoptics.ru`
- Бакет: `pharma-sinoptics-ru`
- Шлюз: `pharma-api-gateway`

SA с префиксом `logos-*` не трогать.
