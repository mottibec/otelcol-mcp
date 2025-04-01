# OpenTelemetry MCP Server

An MCP server implementation for configuring and managing OpenTelemetry Collectors, allowing dynamic configuration of telemetry data collection, processing, and export.

## Features

- **Dynamic OpenTelemetry Configuration**: Configure OpenTelemetry Collectors through MCP tools
- **Component Management**: Add, remove, and configure receivers, processors, and exporters

## Tools

- **Get Available Components**
  - List all available receivers, processors, and exporters
  - No input parameters required

- **Get Component Configuration**
  - Retrieve configuration options for specific components
  - Inputs:
    - `type` (string): Component type ("receiver", "processor", or "exporter")
    - `name` (string): Name of the component

## Configuration

### Usage with mcp clients

Add this to your `mcp.json`:

```json
{
    "mcpServers": {
      "otelcol": {
        "url": "http://localhost:3001/sse"
      }
    }
}
```

## Development

This is a local implementation of an MCP server for OpenTelemetry configuration. To use it:

1. Clone the repository
2. Build the project using the provided build scripts
3. Configure Claude Desktop to use the local server implementation

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
