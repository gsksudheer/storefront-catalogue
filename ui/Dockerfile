FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Demo-only: link to the Mailpit inbox. Leave empty for production builds.
ARG VITE_DEMO_INBOX_URL=""
ENV VITE_DEMO_INBOX_URL=$VITE_DEMO_INBOX_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
