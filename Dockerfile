# Express + TypeScript server die publieke weer-API's aggregeert tot
# een ZeistApp-weerdashboard. Geen browser nodig, dus slim node-image.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY templates ./templates
RUN npm run build

RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV TZ=Europe/Amsterdam

EXPOSE 3000

# Niet als root draaien (node:alpine bevat de 'node'-user).
USER node

CMD ["node", "dist/server.js"]
