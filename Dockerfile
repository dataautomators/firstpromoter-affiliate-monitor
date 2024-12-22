#syntax=docker/dockerfile:1-labs

FROM ubuntu:focal as base
ENV DEBIAN_FRONTEND=noninteractive 
SHELL ["/bin/bash", "-c", "-l"]

# Install dependencies including Python
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOF
  rm -f /etc/apt/apt.conf.d/docker-clean
  sed -i -e 's/http:\/\/archive\.ubuntu\.com\/ubuntu\//mirror:\/\/mirrors\.ubuntu\.com\/mirrors\.txt/' /etc/apt/sources.list
  apt-get update && apt-get install -yq \
    curl \
    git \
    build-essential \
    python3 \
    python3-pip
EOF

# Install Node.js and pnpm
RUN --mount=type=cache,target=/root/Downloads <<EOF
    curl -sS https://webi.sh/node | sh
    echo "source ~/.config/envman/PATH.env" >> /root/.profile
    source /root/.profile
    corepack enable && corepack prepare pnpm@9.15.0 --activate
EOF

WORKDIR /usr/src/app
COPY --parents .eslintrc.json package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile
COPY . .
RUN pnpm prisma generate

# set required the env before build so it doesn't reinstall just due to some variable change
# Set build-time arguments
ARG NEXT_PUBLIC_API_URL
ARG CREDENTIALS_ENCRYPTION_KEY

# Set environment variables using the build arguments
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV CREDENTIALS_ENCRYPTION_KEY=${CREDENTIALS_ENCRYPTION_KEY}

RUN pnpm build

# Create startup script
COPY <<EOF /docker-entrypoint.sh
#!/bin/bash
source /root/.profile
corepack enable && corepack prepare pnpm@9.15.0 --activate

cd /usr/src/app
pnpm db:deploy
pnpm start
EOF

RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/docker-entrypoint.sh"]