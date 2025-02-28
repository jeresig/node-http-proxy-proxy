# Node HTTP Proxy Proxy

A simple HTTP proxy server built with Node.js and Hono that forwards requests to specified URLs.

## Features

- Proxies HTTP requests to specified URLs
- Bearer token authentication for security (in production)
- Optional proxy support with ability to disable per-request
- Configurable connection limiting for concurrent requests
- Built with TypeScript for type safety
- Uses Hono for fast HTTP routing
- Code formatting and linting with Biome.js
- Production-grade process management with PM2

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and set your `ACCESS_KEY` (required for production) and optional `PROXY_URL`.

## Development

Run the development server:
```bash
pnpm dev
```

In development mode, authentication is disabled for easier testing. You can make requests without the Authorization header:
```bash
curl "http://localhost:3000/proxy?url=https://api.example.com"
```

### Code Formatting

The project uses Biome.js for code formatting and linting. Available commands:

```bash
# Format all files
pnpm format

# Lint all files
pnpm lint

# Check and auto-fix formatting and lint issues
pnpm check
```

## Production

Build and start the server:
```bash
NODE_ENV=production pnpm build
pnpm start
```

Stop the server:
```bash
pnpm stop
```

Monitor the server:
```bash
pm2 monit
```

View logs:
```bash
pm2 logs proxy-server
```

In production mode, all requests require authentication with a Bearer token:
```bash
curl "http://localhost:3000/proxy?url=https://api.example.com" \
  -H "Authorization: Bearer your_access_key"
```

## Usage

### Query Parameters

- `url` (required): The target URL to proxy
- `proxy` (optional): Set to "false" to bypass the configured proxy for this request

### Examples

Using the configured proxy (default):
```bash
curl "http://localhost:3000/proxy?url=https://api.example.com"
```

Bypassing the proxy:
```bash
curl "http://localhost:3000/proxy?url=https://api.example.com&proxy=false"
```

## Environment Variables

- `ACCESS_KEY`: Required in production. The Bearer token for authentication
- `PROXY_URL`: Optional. The URL of a proxy server to use for outgoing requests
- `PORT`: Optional. The port to run the server on (default: 3000)
- `NODE_ENV`: Set to 'production' to enable authentication
- `MAX_CONNECTIONS`: Optional. Maximum number of simultaneous outgoing connections (default: 4)

## Process Management with PM2

The server uses PM2 for production process management with the following features:

- **Auto-restart**: Automatically restarts the server if it crashes
- **Exponential Backoff**: Delays between restarts increase exponentially to prevent rapid cycling
- **Max Restarts**: Limited to 10 restarts to prevent infinite crash loops
- **Monitoring**: Built-in monitoring with `pm2 monit`
- **Logs**: Access logs with `pm2 logs proxy-server`
- **Process Control**: Start/stop with `pnpm start` and `pnpm stop`

### Log Files

PM2 logs are stored in the `logs` directory:
- `logs/out.log`: Standard output logs
- `logs/error.log`: Error logs

The logs are in JSON format and include timestamps. You can access them in several ways:
```bash
# View logs in real-time
pm2 logs proxy-server

# View only error logs
pm2 logs proxy-server --err

# View only output logs
pm2 logs proxy-server --out

# View last N lines
pm2 logs proxy-server --lines 100
```