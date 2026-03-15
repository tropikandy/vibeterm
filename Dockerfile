FROM node:20-slim

# Install system dependencies for node-pty and tmux
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    tmux \
    git \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Ensure node user has UID 1000 to match host 'ubuntu' user
RUN usermod -u 1000 node && groupmod -g 1000 node

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .
RUN chown -R node:node /app

# Run as node user
USER node

# Environment defaults
ENV PORT=4001
ENV BROWSE_ROOT=/host
ENV TMUX_TMPDIR=/tmp

EXPOSE 4001

CMD ["node", "server.js"]
