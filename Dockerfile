# Use Node.js 20 with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Set working directory
WORKDIR /app

# Copy nodejs_space directory
COPY nodejs_space/package.json nodejs_space/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY nodejs_space ./

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Set environment for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the application
CMD ["yarn", "start:prod"]
