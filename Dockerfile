# Стадия сборки (как PhantiK_frontend/Dockerfile)
FROM node:20-alpine as builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Устанавливаем ВСЕ зависимости (включая devDependencies)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Стадия production
FROM nginx:alpine

# Копируем собранное приложение в nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx (опционально)
# COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
