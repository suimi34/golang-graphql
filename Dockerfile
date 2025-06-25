# Use the offical Go image to create a build artifact.
# This is based on Debian and sets the GOPATH to /go.
# https://hub.docker.com/_/golang
FROM golang:1.23.3 as builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

# Copy local code to the container image.
COPY . .

# Build the command inside the container.
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o /app/main

# Use a Docker multi-stage build to create a lean production image.
# https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds
FROM gcr.io/distroless/base-debian11

# Change the working directory.
WORKDIR /

# Copy the binary to the production image from the builder stage.
COPY --from=builder /app/main /golang-graphql
COPY --from=builder /app/templates /templates

EXPOSE 8080

# Run the web service on container startup.
USER nonroot:nonroot
ENTRYPOINT ["/golang-graphql"]
