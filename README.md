[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/mottibec-otelcol-mcp-badge.jpg)](https://mseep.ai/app/mottibec-otelcol-mcp)

# OpenTelemetry Collector MCP Server

An MCP server implementation for configuring OpenTelemetry Collectors.

## Features

- **Dynamic OpenTelemetry Configuration**: Configure OpenTelemetry Collectors through MCP tools
- **Component Management**: Add, remove, and configure receivers, processors, and exporters

## Tools

- **Update Resources**
  - Updates local resource files with the latest component information from GitHub
  - No input parameters required
  - Returns statistics about updated components (receivers, processors, exporters)

## Resources

- **Receivers** (`receivers://receivers`)
  - Lists all available OpenTelemetry receivers
  - Returns receiver metadata including name, description, and stability

- **Processors** (`processors://processors`)
  - Lists all available OpenTelemetry processors
  - Returns processor metadata including name, description, and stability

- **Exporters** (`exporters://exporters`)
  - Lists all available OpenTelemetry exporters
  - Returns exporter metadata including name, description, and stability

- **Component Schemas** (`component://{type}/{name}`)
  - Retrieves configuration schema for specific components
  - Supports listing all available schemas or getting a specific component's schema
  - Parameters:
    - `type`: Component type ("receiver", "processor", or "exporter")
    - `name`: Name of the specific component (optional)

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
3. Configure your MCP client to use the local server implementation

## License

This MCP server is licensed under the GPL-3.0 License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the GPL-3.0 License. For more details, please see the LICENSE file in the project repository.
