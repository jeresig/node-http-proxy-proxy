import type {Agent} from "node:http";
import {serve} from "@hono/node-server";
import {config} from "dotenv";
import {Hono} from "hono";
import {HttpsProxyAgent} from "https-proxy-agent";
import fetch from "node-fetch";

// Load environment variables
config();

// Semaphore implementation for connection limiting
class Semaphore {
    private permits: number;
    private waiting: Array<() => void> = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        if (this.waiting.length > 0) {
            const nextResolve = this.waiting.shift();
            nextResolve?.();
        } else {
            this.permits++;
        }
    }
}

const app = new Hono();
const port = process.env.PORT || 3000;
const accessKey = process.env.ACCESS_KEY;
const proxyUrl = process.env.PROXY_URL;
const isProduction = process.env.NODE_ENV !== "development";
const maxConnections = Number.parseInt(process.env.MAX_CONNECTIONS || "4", 10);

// Create a semaphore with configurable number of permits
const connectionLimiter = new Semaphore(maxConnections);

if (isProduction && !accessKey) {
    console.error("ACCESS_KEY environment variable is required in production");
    process.exit(1);
}

// Middleware to check access key in Authorization header (only in production)
app.use("*", async (c, next) => {
    // Skip authentication in development
    if (!isProduction) {
        return next();
    }

    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
            {error: "Authorization header with Bearer token is required"},
            401,
        );
    }

    const token = authHeader.split(" ")[1];
    if (token !== accessKey) {
        return c.json({error: "Unauthorized"}, 401);
    }

    await next();
});

app.get("/proxy", async (c) => {
    const targetUrl = c.req.query("url");
    const disableProxy = c.req.query("proxy") === "false";

    if (!targetUrl) {
        return c.json({error: "URL parameter is required"}, 400);
    }

    try {
        // Acquire a permit before making the request
        await connectionLimiter.acquire();

        const fetchOptions: {agent?: Agent} = {};

        // Add proxy agent if PROXY_URL is configured and proxy is not disabled
        if (proxyUrl && !disableProxy) {
            fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
        }

        try {
            const response = await fetch(targetUrl, fetchOptions);

            // Convert headers to a plain object
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
                c.header(key, value);
            });

            // Get the response body as a buffer
            const buffer = await response.arrayBuffer();

            return new Response(buffer, {
                status: response.status,
                headers,
            });
        } finally {
            // Release the permit after the request is complete (success or failure)
            connectionLimiter.release();
        }
    } catch (error) {
        console.error("Proxy error:", error);
        return c.json({error: "Failed to fetch URL"}, 500);
    }
});

console.log(
    `Server is running on port ${port} in ${isProduction ? "production" : "development"} mode`,
);
serve({
    fetch: app.fetch,
    port: Number(port),
});
