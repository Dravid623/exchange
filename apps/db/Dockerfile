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

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client
# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD pg_isready -h timescaledb -p 5432 -U my_user -d my_database || exit 1

# Start the service
CMD ["npm", "run", "dev"]
