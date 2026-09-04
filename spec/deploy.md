# Деплой UI

Канон скриптов — [`infra/README.md`](../infra/README.md). Terraform не используем.

| Действие | Где |
| --- | --- |
| Сборка кабинетов | `portal/demo` → `pnpm install --frozen-lockfile` → `pnpm run build` |
| Заливка бакета | `deploy-bucket.ps1` или workflow `deploy` |
| Первое создание шлюза и CNAME | локально, один раз |
| Обновление spec существующего шлюза | CI после заливки |

Копия в [`pharma_cert`](https://github.com/SinopticsVit/pharma_cert) помечена
шапкой `Canon: SinopticsAI/pharma_ui`. Пуш в `pharma_cert` больше не заливает
статику.

## Целевой каталог

| Параметр | Значение |
| --- | --- |
| Cloud | `b1gip1vv7381q4bsoaso` |
| Folder | `b1g07nbj3q7ccru38on0` |
| Домен | `pharma.sinoptics.ru` |
| Бакет | `pharma-sinoptics-ru` |
| Шлюз | `pharma-api-gateway` |
| Чужой шлюз | `pharma-edge-api-gateway` — [`pharma_env`](https://github.com/SinopticsAI/pharma_env) |

## Секреты

| Secret | Назначение |
| --- | --- |
| `YC_SA_JSON_CREDENTIALS` | JSON authorized key с ролями из [`iam.yml`](../iam.yml) |

## Workflow

| Workflow | Триггер | Действие |
| --- | --- | --- |
| deploy | push `main`, dispatch | сборка demo → бакет → update spec |

CI не создаёт шлюз и не правит DNS. Если шлюза нет — шаг spec падает с явным
сообщением: один раз прогнать `deploy-gateway.ps1` и `deploy-dns.ps1`.

## Что не трогать

- `pharma-edge-api-gateway` и `pharma-dossier`
- `sinoptics-api-gateway`, `orders-api-gateway`
- функции `pharma-edge-*`
