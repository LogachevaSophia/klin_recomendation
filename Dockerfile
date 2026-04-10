# Стадия сборки - используем Debian-based Node.js вместо Alpine
FROM node:20.18.3 as builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# Стадия production
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]