# workbook-mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server in Java that exposes an `.xlsx` workbook generator as tools that AI assistants can call. This lets a client like Claude, GitHub Copilot, or the MCP Inspector create spreadsheets on request.

Built with the official [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) over the stdio transport.

## Status

Work in progress. The server runs and serves tools over stdio; currently it registers one tool, with workbook tools coming next.

| Tool | Description |
| --- | --- |
| `get_greeting` | Returns a greeting for a given `name`. Used to verify the server end to end. |

**Planned:** tools that wrap `WorkbookGenerator` to build workbooks from explicit data, generate randomized sample data from column specifications, and write the result to disk.

## Project layout

```
src/main/java/com/example/workbooktools/
├── WorkbookMcpServer.java   # MCP server entry point (stdio transport)
├── WorkbookTools.java       # MCP tool definitions
├── WorkbookGenerator.java   # .xlsx generation library (Apache POI)
└── ColumnSpec.java          # Column shapes for sample data: text, integer, decimal, date, choice, nullable
```

## Requirements

- Java 21+
- Maven 3.9+

## Build and test

```bash
mvn compile
mvn test
```

## Run the server

```bash
mvn -q compile exec:java
```

The server speaks JSON-RPC over stdin/stdout, so it's meant to be launched by an MCP client rather than used directly. `-q` keeps Maven's build output off stdout, where it would corrupt the protocol stream.

### Try it with the MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector, choose **STDIO**, set **Command** to `mvn` and **Arguments** to `-q compile exec:java`, then **Connect** and open the **Tools** tab.

### Use it from VS Code

The repo includes an `.mcp.json` that registers the server:

```json
{
  "mcpServers": {
    "workbook-tools": {
      "type": "stdio",
      "command": "mvn",
      "args": ["-q", "compile", "exec:java"],
      "env": {}
    }
  }
}
```

## Tech stack

- Java 21 (records, sealed interfaces, text blocks)
- [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) 2.0.0
- [Apache POI](https://poi.apache.org/) 5.3.0 for `.xlsx` generation
- JUnit 5

## Credits

The workbook generation library (`WorkbookGenerator`, `ColumnSpec`, and their tests) comes from [pturch/workbook-generator](https://github.com/pturch/workbook-generator); its original commits are preserved in this repository's history. The MCP server layer is built on top of it here.

## License

[Apache License 2.0](LICENSE)
