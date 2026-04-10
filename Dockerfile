# Стадия сборки
FROM node:20.19.0 as builder

WORKDIR /app
COPY . .
RUN npm install && npm run build

# Стадия production
FROM nginx:alpine

# Копируем кастомную конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]