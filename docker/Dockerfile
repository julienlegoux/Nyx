FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages (including gosu for proper user switching in entrypoint)
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3 \
    curl \
    wget \
    ca-certificates \
    gnupg \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (required for Agent SDK compatibility)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun and symlink for system-wide access
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -s /root/.bun/bin/bunx /usr/local/bin/bunx
ENV PATH="/root/.bun/bin:$PATH"

# Install Playwright + Chromium (headless, for visual feedback loop — Story 7.3)
RUN npx playwright install --with-deps chromium

# Create nyx user with home directory
RUN useradd -m -s /bin/bash nyx

# Create runtime directories
RUN mkdir -p /app/signals /app/logs

# Set working directory
WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application source
COPY src/ ./src/
COPY tsconfig.json biome.json bunfig.toml ./

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set ownership of application and runtime files
RUN chown -R nyx:nyx /app

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
