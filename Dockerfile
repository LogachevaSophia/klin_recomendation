# Сборка SPA (как PhantiK_frontend: builder → nginx:alpine)
FROM node:20-alpine AS builder

WORKDIR /app

# Флаг --include=dev у npm = «установить пакеты из секции devDependencies в package.json» (там лежит vite как инструмент сборки).
# Не путать с NODE_ENV=development: финальная статика собирается командой vite build ниже.
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./

RUN npm ci --include=dev

COPY . .

# Базовый URL бэкенда (REST), куда из браузера идут запросы axios — НЕ URL страницы фронта.
# Пример: http://<сервер>:3000/api при прокси IAM или http://<сервер>:8000/api до Clinrec.
# Задаётся при сборке: --build-arg VITE_API_BASE_URL=... или CI Variable/Secret.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# production — нормальный режим для vite build (оптимизация)
ENV NODE_ENV=production
RUN npx vite build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
