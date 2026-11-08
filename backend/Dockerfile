FROM node:22-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p storage public/temp && chown -R node:node /app
USER node
ENV NODE_ENV=production PORT=8000
EXPOSE 8000
CMD ["node", "src/index.js"]