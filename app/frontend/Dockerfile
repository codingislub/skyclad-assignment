FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=http://caseflow-alb-dev-644355283.us-east-1.elb.amazonaws.com:3000/api
ARG VITE_ONESCHEMA_ENABLED
ARG VITE_ONESCHEMA_CLIENT_ID
ARG VITE_ONESCHEMA_TEMPLATE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ONESCHEMA_ENABLED=$VITE_ONESCHEMA_ENABLED
ENV VITE_ONESCHEMA_CLIENT_ID=$VITE_ONESCHEMA_CLIENT_ID
ENV VITE_ONESCHEMA_TEMPLATE_KEY=$VITE_ONESCHEMA_TEMPLATE_KEY
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
