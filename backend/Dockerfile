# Use a lightweight Alpine Linux image
FROM alpine:latest

# Set the PocketBase version (check the latest release on GitHub)
ARG PB_VERSION=0.40.3

# Install necessary packages
RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Optional: Copy local migrations and hooks into the image
COPY ./pb_migrations /pb/pb_migrations
COPY ./pb_hooks /pb/pb_hooks

# Expose the port PocketBase will run on
EXPOSE 8080

#start pocketbase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--origins=https://hall-logger.fly.dev"]