# manager-service/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# install deps for server and client
COPY package*.json ./
RUN npm ci

# copy full project
COPY . .

# build client (assumes client has its own package.json in src/client)
WORKDIR /usr/src/app/src/client
RUN npm ci --production=false
RUN npm run build

# final image
FROM node:18-alpine
WORKDIR /usr/src/app

# copy package json and install production deps
COPY package*.json ./
RUN npm ci --production

# copy app + client build
COPY --from=builder /usr/src/app ./

# if your server expects client build in src/client/dist (default Vite),
# it is already present from the builder stage.
EXPOSE 8080
ENV NODE_ENV=production

CMD ["node", "src/server/server.js"]
