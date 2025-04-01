import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { z } from "zod";
import { fetchComponents, fetchComponentConfig } from "./github.js";

// Simple logger implementation
const logger = {
    info: (message: string, data?: object) => {
        console.log(`[${new Date().toISOString()}] INFO: ${message}`, data ? data : '');
    },
    error: (message: string, data?: object) => {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, data ? data : '');
    },
    warn: (message: string, data?: object) => {
        console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data ? data : '');
    },
    debug: (message: string, data?: object) => {
        console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, data ? data : '');
    }
};

// Create Express app
const app = express();

// Create server instance
const server = new McpServer({
    name: "otelcol-config",
    version: "1.0.0",
    capabilities: {
        tools: true,
        prompts: false,
        resources: true,
        logging: false,
        roots: {
            listChanged: false
        }
    },
});

// Register otelcol-config tools
server.tool(
    "get-receivers",
    "Get all available OpenTelemetry Collector receivers",
    {},
    async () => {
        logger.info('Fetching OpenTelemetry receivers');
        try {
            const receivers = await fetchComponents('receiver');
            logger.info(`Successfully fetched ${receivers.length} receivers`);
            const formattedReceivers = receivers.map(rec =>
                `Name: ${rec.name}\nDescription: ${rec.description}\nStability: ${rec.stability}\n---`
            ).join('\n\n');

            return {
                content: [
                    {
                        type: "text",
                        text: `Available OpenTelemetry Collector Receivers:\n\n${formattedReceivers}`,
                    },
                ],
            };
        } catch (error) {
            logger.error('Error fetching receivers', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching receivers: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    "get-processors",
    "Get all available OpenTelemetry Collector processors",
    {},
    async () => {
        logger.info('Fetching OpenTelemetry processors');
        try {
            const processors = await fetchComponents('processor');
            logger.info(`Successfully fetched ${processors.length} processors`);
            const formattedProcessors = processors.map(proc =>
                `Name: ${proc.name}\nDescription: ${proc.description}\nStability: ${proc.stability}\n---`
            ).join('\n\n');

            return {
                content: [
                    {
                        type: "text",
                        text: `Available OpenTelemetry Collector Processors:\n\n${formattedProcessors}`,
                    },
                ],
            };
        } catch (error) {
            logger.error('Error fetching processors', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching processors: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    "get-exporters",
    "Get all available OpenTelemetry Collector exporters",
    {},
    async () => {
        logger.info('Fetching OpenTelemetry exporters');
        try {
            const exporters = await fetchComponents('exporter');
            logger.info(`Successfully fetched ${exporters.length} exporters`);
            const formattedExporters = exporters.map(exp =>
                `Name: ${exp.name}\nDescription: ${exp.description}\nStability: ${exp.stability}\n---`
            ).join('\n\n');

            return {
                content: [
                    {
                        type: "text",
                        text: `Available OpenTelemetry Collector Exporters:\n\n${formattedExporters}`,
                    },
                ],
            };
        } catch (error) {
            logger.error('Error fetching exporters', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching exporters: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    "get-component-config",
    "Get configuration options for a specific OpenTelemetry Collector component",
    {
        type: z.enum(['receiver', 'processor', 'exporter']).describe("Type of component"),
        name: z.string().describe("Name of the component"),
    },
    async ({ type, name }) => {
        logger.info('Fetching component configuration', { type, name });
        try {
            const config = await fetchComponentConfig(type, name);
            logger.info('Successfully fetched component configuration', { type, name });
            const formattedConfig =
                `Name: ${config.name}\n` +
                `Description: ${config.description}\n` +
                `Stability: ${config.stability}\n\n` +
                `Configuration Options:\n${config.configuration}`;

            return {
                content: [
                    {
                        type: "text",
                        text: formattedConfig,
                    },
                ],
            };
        } catch (error) {
            logger.error('Error fetching component configuration', { 
                type, 
                name, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching component configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
            };
        }
    },
);

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (_: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    logger.info('New SSE connection established', { sessionId: transport.sessionId });
    
    res.on("close", () => {
        logger.info('SSE connection closed', { sessionId: transport.sessionId });
        delete transports[transport.sessionId];
    });
    
    await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    logger.debug('Received message', { sessionId, body: req.body });
    
    const transport = transports[sessionId];
    if (transport) {
        try {
            await transport.handlePostMessage(req, res);
            logger.debug('Successfully handled message', { sessionId });
        } catch (error) {
            logger.error('Error handling message', { 
                sessionId, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            });
            res.status(500).send('Error handling message');
        }
    } else {
        logger.warn('No transport found for sessionId', { sessionId });
        res.status(400).send('No transport found for sessionId');
    }
});

app.listen(3001, () => {
    logger.info('Server started', { port: 3001 });
});