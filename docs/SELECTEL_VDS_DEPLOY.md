# Развёртывание на Selectel VDS: IP-этап

Этот документ подготавливает сайт к работе по `http://135.106.210.15` на Ubuntu 24.04. На этом этапе HTTPS, домен, Telegram и прокси не настраиваются.

## Что есть в репозитории сейчас

- Frontend — статический сайт на нативных ES-модулях. `npm run build` собирает его в `dist/`.
- У текущей версии нет npm-зависимостей и `package-lock.json`, поэтому `npm ci` выполнять не нужно.
- `scripts/dev.mjs` — локальный сервер для разработки, не production API.
- Node API и прямое подключение к PostgreSQL отсутствуют.
- По умолчанию заявка сохраняется в `localStorage` браузера. Режим `supabase` из `src/data/store.js` работает только с внешним Supabase и не использует PostgreSQL VDS.

Поэтому первые команды ниже безопасно публикуют frontend по IP. Шаблоны API подготовлены заранее, но сервис API пока **не включается**: файла `server/index.mjs` в текущем проекте нет. Чтобы реально сохранять заявки в существующий PostgreSQL, следующим отдельным этапом нужно реализовать API, серверную валидацию и миграцию PostgreSQL.

## Переменные и секреты

Production URL уже задан в проекте как `https://chydozaika.ru`: он используется для canonical, sitemap, Open Graph и статических SEO-страниц. Пароль базы, `DATABASE_URL`, Telegram-токены и прокси-данные не нужны для текущей статической версии и не должны попадать в `runtime-config.js`, Git или публичную папку.

Будущий API получает секреты только из `/etc/chudozaika/api.env`, созданного на сервере из `deploy/selectel/api.env.example` с реальными значениями.

## Команды для VDS

Выполняйте по порядку под пользователем с `sudo`. Команды не открывают PostgreSQL наружу и не удаляют данные базы.

```bash
ssh root@135.106.210.15

sudo apt update
sudo apt install -y git nginx ufw
node --version
npm --version
sudo systemctl enable --now nginx postgresql

# Создаёт отдельного системного пользователя только если его ещё нет.
id chudozaika >/dev/null 2>&1 || sudo adduser --system --group --home /srv/chudozaika chudozaika
sudo install -d -o "$USER" -g chudozaika -m 0750 /srv/chudozaika
sudo -u postgres psql -d chudozaika -c '\conninfo'

git clone https://github.com/mersisk/chudo-zayka-primorye.git /srv/chudozaika/app
cd /srv/chudozaika/app
npm run check
npm run build

sudo chown -R root:chudozaika /srv/chudozaika/app
sudo find /srv/chudozaika/app -type d -exec chmod 0750 {} \;
sudo find /srv/chudozaika/app -type f -exec chmod 0640 {} \;
sudo find /srv/chudozaika/app/dist -type f -exec chmod 0644 {} \;
sudo find /srv/chudozaika/app/dist -type d -exec chmod 0755 {} \;
```

Перед отключением стандартного сайта Nginx убедитесь, что на VDS действительно нет другого сайта. Для нового сервера выполните:

```bash
sudo cp /srv/chudozaika/app/deploy/selectel/nginx-ip.conf.template /etc/nginx/sites-available/chudozaika
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/chudozaika /etc/nginx/sites-enabled/chudozaika
sudo nginx -t
sudo systemctl reload nginx
```

Настройка UFW оставляет только SSH, HTTP и будущий HTTPS. Порт PostgreSQL `5432` не открывается:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Проверка после установки:

```bash
curl -I http://135.106.210.15/
curl -I http://135.106.210.15/robots.txt
curl -I http://135.106.210.15/sitemap.xml
```

## Будущий Node API и PostgreSQL

После появления API скопируйте подготовленные шаблоны, заполните секреты вручную и только затем включите сервис:

```bash
sudo install -d -o root -g chudozaika -m 0750 /etc/chudozaika
sudo install -o root -g chudozaika -m 0640 /srv/chudozaika/app/deploy/selectel/api.env.example /etc/chudozaika/api.env
sudoedit /etc/chudozaika/api.env
# Убедитесь, что путь к Node.js совпадает с результатом: command -v node
sudo install -o root -g root -m 0644 /srv/chudozaika/app/deploy/selectel/chudozaika-api.service.template /etc/systemd/system/chudozaika-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now chudozaika-api
sudo systemctl status chudozaika-api --no-pager
```

В `api.env` замените только `CHANGE_ME` в `DATABASE_URL` на пароль пользователя PostgreSQL `chudozaika`. Сервис обязан слушать `127.0.0.1:3000`; Nginx будет единственной внешней точкой доступа к `/api`.

Когда API будет добавлен, он должен принимать запросы только с того же origin `http://135.106.210.15`, повторно валидировать все поля заявки на сервере, использовать параметризованные SQL-запросы и отвечать на `GET /api/health`. Nginx уже ограничивает `/api` до 10 запросов в минуту с burst 20; API должен иметь собственный rate limit как второй уровень защиты.

## Обновление frontend без удаления данных

```bash
sudo git -C /srv/chudozaika/app pull --ff-only origin main
sudo npm --prefix /srv/chudozaika/app run check
sudo npm --prefix /srv/chudozaika/app run build
sudo chown -R root:chudozaika /srv/chudozaika/app
sudo systemctl reload nginx
```

Эти команды не меняют и не удаляют записи в PostgreSQL. Миграции базы выполняйте только отдельной согласованной командой после резервной копии.
