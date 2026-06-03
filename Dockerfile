# ---------- Stage 1: build frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json bun.lockb* package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ---------- Stage 2: install backend deps ----------
FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev

# ---------- Stage 3: runtime (postgres + node via supervisord) ----------
FROM postgres:16-alpine
ENV POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres \
    POSTGRES_DB=trading_journal \
    PGDATA=/data/pgdata \
    NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/data/uploads

# Node.js + supervisord
RUN apk add --no-cache nodejs npm supervisor

WORKDIR /app
COPY --from=frontend /app/dist ./dist
COPY --from=backend  /app/server ./server
COPY server ./server
COPY init.sql ./init.sql

# Supervisord config
RUN mkdir -p /etc/supervisor.d /data/uploads /data/pgdata && \
    chown -R postgres:postgres /data/pgdata
COPY supervisord.conf /etc/supervisord.conf
COPY docker-entrypoint-wrapper.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

VOLUME ["/data"]
EXPOSE 3000

CMD ["/usr/local/bin/start.sh"]
