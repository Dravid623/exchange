# Base image
FROM node:20-slim
#Set working directory
WORKDIR /app
RUN npm install -g typescript
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
#Install dependencies
COPY ./apps/api/package*.json ./
RUN npm install
#Copy source code
COPY ./apps/api .
#Expose port
EXPOSE 3000
#Add healthcheck
HEALTHCHECK CMD curl --fail http://localhost:3000/api/v1/health || exit 1
#Start the service
CMD ["npm","run","dev"]