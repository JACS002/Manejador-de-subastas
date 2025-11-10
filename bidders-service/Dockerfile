# bidders-service/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# build client
WORKDIR /usr/src/app/src/client
RUN npm ci --production=false
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /usr/src/app ./

# By default, the bidders service will try to query the manager service at MANAGER_URL.
# In docker-compose we will set MANAGER_URL to http://manager-service:8080
ENV NODE_ENV=production
EXPOSE 8081

CMD ["node", "src/server/server.js"]
