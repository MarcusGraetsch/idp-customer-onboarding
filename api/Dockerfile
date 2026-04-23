FROM golang:1.22-alpine AS builder

WORKDIR /app

# Abhängigkeiten cachen
COPY go.mod go.sum ./
RUN go mod download

# Code kopieren und bauen
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server cmd/server/main.go

# Production Image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
