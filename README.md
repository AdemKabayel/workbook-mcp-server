# workbook-mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server in Java that exposes an `.xlsx` workbook generator to AI assistants. Through tools, resources and prompts, a client like Claude, GitHub Copilot, or the MCP Inspector can design, generate, list and review spreadsheets on request.

Built with the official [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) over the stdio transport.

## What the server exposes

### Tools

| Tool | Description |
| --- | --- |
| `generate_workbook` | Builds a sample `.xlsx` from column specifications (`fileName`, `rowCount`, `columns`, optional `seed`) and writes it to the output directory. Returns structured output with the file path and row count. |
| `list_workbooks` | Lists the generated workbooks in the output directory. |
| `clear_workbooks` | Deletes all generated workbooks. |
| `get_greeting` | Returns a greeting for a given `name`. Used to verify the server end to end. |

Invalid arguments come back as a recoverable tool error (`isError: true`), while unexpected I/O failures are raised as an `McpError`.

### Resources

| URI | Description |
| --- | --- |
| `workbook-tools://schema/column-spec` | JSON schema for a single column specification accepted by `generate_workbook`. |
| `workbook-tools://docs/column-types` | Markdown guide to how each column type (text, integer, decimal, date, choice) behaves, and how `blankProbability` works. |
| `workbook-tools://workbooks/{fileName}` | Resource template that returns a generated workbook's contents as CSV. |

### Prompts

| Prompt | Arguments | Description |
| --- | --- | --- |
| `design_workbook` | `description`, `rowCount` | Walks the model through confirming missing arguments, reading the schema and column type resources, calling `generate_workbook`, and checking the result with `list_workbooks`. |
| `review_workbook` | `fileName` | Has the model confirm the file exists, read it through the workbook resource, check the data for internal consistency, and report a PASS or FAIL verdict using only this server's tools and resources. |

## Project layout

```
src/main/java/com/example/workbooktools/
├── WorkbookMcpServer.java   # MCP server entry point (stdio transport)
├── WorkbookTools.java       # Tool definitions
├── WorkbookResources.java   # Resource and resource template definitions
├── WorkbookPrompts.java     # Prompt definitions
├── WorkbookGenerator.java   # .xlsx generation library (Apache POI)
└── ColumnSpec.java          # Column shapes for sample data: text, integer, decimal, date, choice, nullable
src/main/resources/docs/
└── column-types.md          # Served as the column types guide resource
e2e/                         # Playwright + Applitools Eyes visual test for the workbook viewer
```

## Requirements

- Java 21+
- Maven 3.9+
- Node.js 18+ (only for the e2e test and the Playwright and Eyes MCP servers)

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

Generated workbooks are written to `generated-workbooks/` by default. Override it with `-Dworkbook.output.dir=<path>`.

### Try it with the MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector, choose **STDIO**, set **Command** to `mvn` and **Arguments** to `-q compile exec:java`, then **Connect**. The **Tools**, **Resources** and **Prompts** tabs each list what the server exposes.

### Use it from an MCP client

The repo includes an `.mcp.json` that registers this server alongside the [Applitools Eyes MCP](https://www.npmjs.com/package/@applitools/mcp) and [Playwright MCP](https://github.com/microsoft/playwright-mcp) servers:

```json
{
  "mcpServers": {
    "workbook-tools": {
      "type": "stdio",
      "command": "mvn",
      "args": ["-q", "compile", "exec:java"],
      "env": {}
    },
    "applitools-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@applitools/mcp@latest"],
      "env": {
        "APPLITOOLS_API_KEY": "${APPLITOOLS_API_KEY}"
      }
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

The Eyes API key is read from the `APPLITOOLS_API_KEY` environment variable, so it never lives in the repo:

```bash
export APPLITOOLS_API_KEY="your-key"
```

## Multi-server workflow

MCP servers don't talk to each other. The agent holds a client connection to each one and passes results between them. With all three servers connected, an agent can:

1. Call `generate_workbook` with a fixed `seed` and get back the file path.
2. Use Playwright MCP to open the [workbook viewer](https://github.com/pturch/workbook-viewer-webapp) at `http://localhost:8080`, upload the file and click **Upload & View**.
3. Use Eyes MCP to take a visual checkpoint of the rendered workbook. The first run becomes the baseline.
4. Regenerate with the same seed and run again. Eyes compares against the baseline to confirm the same workbook renders identically.

### End-to-end visual test

The `e2e/` folder holds the Playwright test produced from that workflow. It uploads a seeded workbook into the viewer and takes an Eyes checkpoint.

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

It expects the viewer running on `http://localhost:8080` and `APPLITOOLS_API_KEY` set. Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `WORKBOOK` | `generated-workbooks/eyes-visual-test.xlsx` | Workbook to upload, relative to the repo root. |
| `VIEWER_URL` | `http://localhost:8080/` | Viewer base URL. |
| `EYES_BATCH_NAME` | `Workbook Viewer - seeded workbook` | Batch name shown in the Eyes dashboard. |

The test runs headed with `slowMo` so you can watch it.

## Tech stack

- Java 21 (records, sealed interfaces, text blocks)
- [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) 2.0.0
- [Apache POI](https://poi.apache.org/) 5.3.0 for `.xlsx` generation
- JUnit 5
- Playwright and Applitools Eyes for the e2e visual test

## Credits

The workbook generation library (`WorkbookGenerator`, `ColumnSpec`, and their tests) comes from [pturch/workbook-generator](https://github.com/pturch/workbook-generator); its original commits are preserved in this repository's history. The MCP server layer is built on top of it here. The viewer app used in the e2e test is [pturch/workbook-viewer-webapp](https://github.com/pturch/workbook-viewer-webapp).

This project was built while following Test Automation University's course on building MCP servers in Java.

## License

[Apache License 2.0](LICENSE)
