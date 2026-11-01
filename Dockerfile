FROM node:22-bookworm-slim

# System ffmpeg (arch-independent) and the standalone yt-dlp binary (no Python needed).
# FFMPEG_PATH / YTDLP_PATH override the Windows defaults baked into server/lib/ytdlp.js.
ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    YTDLP_PATH=/usr/local/bin/yt-dlp

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
 && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
 && chmod +x /usr/local/bin/yt-dlp \
 && apt-get purge -y curl \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --ignore-scripts skips the ffmpeg-static binary download; we use the system ffmpeg.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY server ./server

# The app writes stats/history here; make it writable for the non-root user.
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data

USER node

EXPOSE 5000
CMD ["node", "server/index.js"]
