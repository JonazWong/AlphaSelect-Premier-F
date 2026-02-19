FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use --legacy-peer-deps to handle React 19 peer dependency issues
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]
