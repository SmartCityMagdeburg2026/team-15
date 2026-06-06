FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

CMD ["npm", "run", "start"]