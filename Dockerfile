# Сборка SPA (как PhantiK_frontend: builder → nginx:alpine)
FROM node:20-alpine AS builder

WORKDIR /app

# Без этого при NODE_ENV=production (часто из CI/buildx) npm ci не ставит devDependencies → нет vite
ENV NODE_ENV=development

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./

RUN npm ci --include=dev

COPY . .

# API бэкенда для браузера (тот же origin через gateway или прямой URL до REST-proxy)
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# production — нормальный режим для vite build (оптимизация)
ENV NODE_ENV=production
RUN npx vite build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
