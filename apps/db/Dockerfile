# Use minimal Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app
RUN npm install -g typescript
# Copy package.json and install dependencies
COPY ./apps/db/package*.json ./
RUN npm install --production

# Copy source code
COPY ./apps/db .

# Expose port
EXPOSE 3002

# Healthcheck
HEALTHCHECK CMD curl --fail http://localhost:3002/health || exit 1

# Start the service
CMD ["npm", "run", "dev"]
