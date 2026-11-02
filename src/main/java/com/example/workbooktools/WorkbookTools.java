package com.example.workbooktools;

import java.nio.file.Path;

import io.modelcontextprotocol.json.McpJsonDefaults;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import io.modelcontextprotocol.spec.McpSchema.Tool;

public class WorkbookTools {
    private static final Path OUTPUT_DIR = Path.of(System.getProperty("workbook.output.dir", "generated-workbooks"));
    private static final WorkbookGenerator GENERATOR = new WorkbookGenerator();



    static SyncToolSpecification greetingTool() {
        String schema = """
            {
              "type": "object",
              "properties": {
                "name": { "type": "string" }
              },
              "required": ["name"]
            }
            """;

        return SyncToolSpecification.builder()
            .tool(Tool.builder("get_greeting", McpJsonDefaults.getMapper(), schema)
                .description("Returns a greeting for a given name")
                .build())
            .callHandler((exchange, request) -> {
                String name = (String) request.arguments().get("name");
                return CallToolResult.builder()
                    .addTextContent("Hello, " + name + "!")
                    .build();
            })
            .build();
    }
}


