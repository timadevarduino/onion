FROM node:18-alpine

# Устанавливаем Tor
RUN apk update && apk add --no-cache tor

# Создаем папки и ДАЕМ ПРАВА пользователю tor (100:101)
RUN mkdir -p /var/lib/tor/hidden_service && \
    chown -R tor:tor /var/lib/tor && \
    chmod 700 /var/lib/tor /var/lib/tor/hidden_service

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install --production

# Копируем остальные файлы проекта
COPY . .

# Скрипт запуска от имени пользователя tor
# Скрипт запуска, который подождет Tor и принудительно выведет адрес
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'node server.js &' >> /start.sh && \
    echo 'sleep 3' >> /start.sh && \
    echo 'tor -f /app/torrc &' >> /start.sh && \
    echo 'sleep 15' >> /start.sh && \
    echo 'echo "========================================="' >> /start.sh && \
    echo 'echo "ТВОЙ TOR АДРЕС НИЖЕ:"' >> /start.sh && \
    echo 'cat /var/lib/tor/hidden_service/hostname' >> /start.sh && \
    echo 'echo "========================================="' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Запускаем контейнер под пользователем tor, чтобы обойти ошибку прав
USER tor

CMD ["/start.sh"]



