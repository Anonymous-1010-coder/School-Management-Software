FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN npm ci
COPY . .
RUN npm run build -w shared
RUN npm run build -w frontend

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npx", "-w", "frontend", "next", "start"]
