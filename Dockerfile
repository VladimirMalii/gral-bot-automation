# Use Node.js 20 with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Switch to root to enable Corepack
USER root
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy entire repository
COPY . .

# Change ownership to pptruser
RUN chown -R pptruser:pptruser /app

# Switch back to pptruser for security
USER pptruser

# Navigate to nodejs_space and install dependencies
WORKDIR /app/nodejs_space
RUN yarn install

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Set environment for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the application
CMD ["yarn", "start:prod"]
