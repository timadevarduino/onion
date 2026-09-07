FROM node:18-alpine

# Устанавливаем Tor
RUN apk update && apk add --no-cache tor

# Создаем папки для проекта и для ключей Tor
RUN mkdir -p /var/lib/tor/hidden_service && chmod 700 /var/lib/tor/hidden_service
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Скрипт, который запустит твой Node.js и Tor одновременно
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'npm start &' >> /start.sh && \
    echo 'sleep 3' >> /start.sh && \
    echo 'tor -f /app/torrc &' >> /start.sh && \
    echo 'sleep 10' >> /start.sh && \
    echo 'echo "========================================="' >> /start.sh && \
    echo 'echo "ТВОЙ TOR АДРЕС НИЖЕ:"' >> /start.sh && \
    echo 'cat /var/lib/tor/hidden_service/hostname' >> /start.sh && \
    echo 'echo "========================================="' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]
