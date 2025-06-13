# Start your image with a node base image
FROM node:18-alpine as build

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
COPY package*.json ./

# Copy local directories to the current local directory of our docker image (/app)


# Install node packages, install serve, build the app, and remove dependencies at the end
RUN npm install \
     && npm install -g serve

COPY . /app
RUN npm run build


FROM nginx
COPY nginx.conf     /etc/nginx/nginx.conf

COPY --from=build /app/dist/travelblogs/ /usr/share/nginx/html

EXPOSE 80

