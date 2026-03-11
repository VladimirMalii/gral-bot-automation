*** a//home/ubuntu/gralmed_automation_api/Dockerfile
--- b//home/ubuntu/gralmed_automation_api/Dockerfile
***************
*** 5,28 ****
       4	# Set working directory
       5	WORKDIR /app
       6	
!      7	# Copy nodejs_space directory
!      8	COPY nodejs_space/package.json nodejs_space/yarn.lock ./
       9	
!     10	# Install dependencies
!     11	RUN yarn install --frozen-lockfile
!     12	
!     13	# Copy source code
!     14	COPY nodejs_space ./
!     15	
!     16	# Build the application
!     17	RUN yarn build
!     18	
!     19	# Expose port
!     20	EXPOSE 3000
!     21	
!     22	# Set environment for Puppeteer
!     23	ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
!     24	    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
!     25	
!     26	# Start the application
!     27	CMD ["yarn", "start:prod"]
--- 5,26 ----
       4	# Set working directory
       5	WORKDIR /app
       6	
!      7	# Copy entire repository
!      8	COPY . .
       9	
!     10	# Navigate to nod
