FROM node:20-slim

# Install system dependencies for node-pty, tmux, and shell tooling
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    tmux \
    git \
    procps \
    curl \
    jq \
    vim \
    htop \
    less \
    iputils-ping \
    dnsutils \
    && rm -rf /var/lib/apt/lists/*

# Ensure node user has UID 1001 to match host ubuntu user (uid=1001)
RUN usermod -u 1001 node && groupmod -g 1001 node

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .
RUN chown -R node:node /app
RUN chmod +x /app/entrypoint.sh

# Run as node user
USER node

# Environment defaults
ENV PORT=4001
ENV BROWSE_ROOT=/host
ENV TMUX_TMPDIR=/tmp

EXPOSE 4001

CMD ["/app/entrypoint.sh"]
