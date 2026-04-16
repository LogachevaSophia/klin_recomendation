# Стадия сборки
FROM node:20.19.0 as builder

# Прокидывается при `docker build --build-arg VITE_API_BASE_URL=...` (CI: GitHub Secrets)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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