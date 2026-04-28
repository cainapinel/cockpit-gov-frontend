FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# A variável de ambiente do backend seria injetada no script de build (VITE_API_URL=http://... npm run build)
RUN npm run build 

# Stage 2: Serve the App using Nginx
FROM nginx:alpine

# Limpa configuração padrão do nginx e injeta a nossa preparada para SPA routing (react-router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos otimizados gerados no State 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
