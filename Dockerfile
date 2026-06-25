# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Not: migration:run ve seed komutları ts-node/typeorm CLI kullandığı için
# dev bağımlılıklarını da kuruyoruz (--omit=dev YAPMIYORUZ, bilerek).
COPY package*.json ./
RUN npm install

COPY --from=build /app/dist ./dist
COPY src ./src
COPY tsconfig.json ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]
