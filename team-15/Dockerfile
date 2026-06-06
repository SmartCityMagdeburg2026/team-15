FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

RUN npm run build

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["npm", "run", "start"]