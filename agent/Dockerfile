# Cermin keeper agent — long-running daemon (skim/defend on Mezo testnet).
FROM node:22-bookworm-slim

WORKDIR /app

# Build toolchain for better-sqlite3's native bindings (in case no prebuilt
# binary is available for the platform).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install all deps (incl. typescript) — NODE_ENV is set to production only
# afterwards so the build step still has the compiler.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Action-log DB. Mount a Railway volume at /data to persist across redeploys;
# otherwise it lives in the ephemeral container FS (the agent still works —
# the log is an audit trail, vault state is read fresh from chain each cycle).
RUN mkdir -p /data
ENV NODE_ENV=production
ENV DB_PATH=/data/cermin.db

CMD ["node", "dist/index.js"]
