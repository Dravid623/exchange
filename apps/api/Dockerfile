# Base image
FROM node:20-slim
#Set working directory
WORKDIR /app
RUN npm install -g typescript
#Install dependencies
COPY ./apps/api/package*.json ./
RUN npm install
#Copy source code
COPY ./apps/api .
#Expose port
EXPOSE 3000
#Add healthcheck
HEALTHCHECK CMD curl --fail http://loalhost:300/health || exit 1
#Start the service
CMD ["npm","run","dev"]