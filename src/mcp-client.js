import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.availableTools = [];
  }

  async connect(serverCommand, serverArgs) {
    this.client = new Client(
      {
        name: "mcp-natural-language-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
    });

    await this.client.connect(this.transport);
    console.log("MCPサーバーに接続しました");

    await this.loadTools();
  }

  async loadTools() {
    const response = await this.client.listTools();
    this.availableTools = response.tools;
    console.log(`利用可能なツール: ${this.availableTools.length}件`);
    this.availableTools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  }

  getTools() {
    return this.availableTools;
  }

  async callTool(name, args) {
    const response = await this.client.callTool({
      name,
      arguments: args,
    });
    return response;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}
