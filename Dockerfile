# Stage 1: Build the Angular application
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Stage 2: Serve the application from a lightweight web server
FROM nginx:1.25-alpine

# Copy the built application from the build stage
COPY --from=build /app/dist/front-end-teemo/browser /usr/share/nginx/html

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
