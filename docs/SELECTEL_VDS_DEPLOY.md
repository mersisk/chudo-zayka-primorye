# Production-заявки на Selectel VDS

Сайт работает на `https://chydozaika.ru`: Nginx раздаёт `dist/`, а Node.js API слушает только `127.0.0.1:3000`. PostgreSQL не публикуется в интернет. Заявка сначала сохраняется в PostgreSQL, затем API пытается доставить уведомление в Telegram через SOCKS5. Ошибка Telegram не отменяет сохранённую заявку: в таблице остаётся статус `failed` и причина сбоя.

## Что добавлено

- `POST /api/applications` — принимает JSON-заявку размером до 24 KiB.
- Сервер повторно проверяет имя, российский телефон, дату, согласие и выбранные услуги. Названия и стоимость вариантов берутся из серверного каталога, поэтому их нельзя подменить браузером.
- PostgreSQL-таблица `applications` создаётся миграцией без удаления существующих данных.
- `GET /api/health` — локальная проверка доступности процесса.
- API ограничивает заявки с одного IP; Nginx добавляет второй лимит на `/api`.
- Telegram соединяется с `api.telegram.org` через SOCKS5 с логином и паролем. Секреты остаются только в `/etc/chudozaika/api.env`.
- systemd timer повторяет недоставленные Telegram-уведомления каждые пять минут.

## Переменные окружения

Создайте закрытый файл только на VDS из [api.env.example](../deploy/selectel/api.env.example). Заполните вручную:

| Переменная | Значение |
| --- | --- |
| `DATABASE_URL` | URL подключения пользователя PostgreSQL `chudozaika` к БД `chudozaika` на `127.0.0.1` |
| `BOT_TOKEN` | токен Telegram-бота |
| `TELEGRAM_CHAT_ID` | ID Telegram-группы |
| `PROXY_HOST`, `PROXY_PORT` | адрес и порт SOCKS5-прокси |
| `PROXY_USER`, `PROXY_PASS` | учётные данные SOCKS5-прокси |
| `CORS_ORIGIN` | `https://chydozaika.ru` |

Не добавляйте этот файл в Git, `runtime-config.js`, папку `dist` или конфигурацию Nginx.

## Развёртывание на VDS

Команды ниже не удаляют данные. Перед изменениями на рабочем сервере проверьте текущий статус: `sudo systemctl status nginx chudozaika-api --no-pager`.

```bash
ssh root@135.106.210.15

sudo apt update
sudo apt install -y git nginx postgresql curl
node --version
npm --version

sudo install -d -o root -g chudozaika -m 0750 /etc/chudozaika
sudo install -o root -g chudozaika -m 0640 /srv/chudozaika/app/deploy/selectel/api.env.example /etc/chudozaika/api.env
sudoedit /etc/chudozaika/api.env

# Нужны только права на создание таблицы в уже существующей БД; 5432 наружу не открывается.
sudo -u postgres psql -d chudozaika -c 'GRANT USAGE, CREATE ON SCHEMA public TO chudozaika;'

cd /srv/chudozaika/app
sudo npm install --omit=dev
sudo install -o root -g root -m 0644 deploy/selectel/chudozaika-api.service.template /etc/systemd/system/chudozaika-api.service
sudo systemctl daemon-reload

# Миграция только создаёт отсутствующую таблицу и индексы.
sudo -u chudozaika bash -c 'set -a; . /etc/chudozaika/api.env; set +a; cd /srv/chudozaika/app; npm run db:migrate'

sudo systemctl enable --now chudozaika-api
sudo systemctl status chudozaika-api --no-pager

sudo install -o root -g root -m 0644 deploy/selectel/chudozaika-telegram-retry.service.template /etc/systemd/system/chudozaika-telegram-retry.service
sudo install -o root -g root -m 0644 deploy/selectel/chudozaika-telegram-retry.timer.template /etc/systemd/system/chudozaika-telegram-retry.timer
sudo systemctl daemon-reload
sudo systemctl enable --now chudozaika-telegram-retry.timer
sudo systemctl list-timers chudozaika-telegram-retry.timer --all
```

Убедитесь, что в `chudozaika-api.service` путь в `ExecStart` совпадает с `command -v node`. Сервис должен слушать только `127.0.0.1:3000`.

## Nginx и firewall

Шаблон [nginx-ip.conf.template](../deploy/selectel/nginx-ip.conf.template) показывает нужный блок `/api/`: он проксирует запросы на локальный сервис и раздаёт frontend из `/srv/chudozaika/app/dist`. На уже работающем VDS с HTTPS **не копируйте шаблон поверх текущего виртуального хоста** — проверьте, что в активном HTTPS `server` уже есть этот блок `location /api/`, затем только проверьте и перезагрузите Nginx.

```bash
sudo nginx -t
sudo systemctl reload nginx

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status verbose
```

Не добавляйте правило UFW для `5432` или `3000`: PostgreSQL и API должны быть доступны только локально.

## Проверка после установки

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsSI https://chydozaika.ru/
curl -fsS https://chydozaika.ru/api/health
sudo journalctl -u chudozaika-api -n 100 --no-pager
```

Отправьте одну реальную тестовую заявку через форму. Проверьте новую строку в БД и поле `telegram_status`:

```bash
sudo -u postgres psql -d chudozaika -c 'SELECT id, name, phone, telegram_status, created_at FROM applications ORDER BY created_at DESC LIMIT 10;'
```

При `telegram_status = 'failed'` заявка уже сохранена. Причина доставки ограниченно записывается в `telegram_error`; systemd timer повторит отправку. Для немедленной повторной попытки без создания новой заявки используйте:

```bash
sudo systemctl start chudozaika-telegram-retry.service
sudo journalctl -u chudozaika-telegram-retry.service -n 50 --no-pager
```

## Обновление приложения

```bash
sudo git -C /srv/chudozaika/app pull --ff-only origin main
sudo npm --prefix /srv/chudozaika/app install --omit=dev
sudo npm --prefix /srv/chudozaika/app run check
sudo npm --prefix /srv/chudozaika/app run build
sudo systemctl restart chudozaika-api
sudo systemctl reload nginx
```
