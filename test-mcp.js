#!/usr/bin/env node

import { MCPClient } from "./src/mcp-client.js";

async function testMCPConnection() {
  console.log("MCPサーバー接続テスト\n");

  const mcpClient = new MCPClient();

  try {
    console.log("1. MCPサーバーに接続中...");
    // npx経由でnpmパッケージを使用
    await mcpClient.connect("npx", ["-y", "@odenalexbs/mcp-sample-server"]);
    console.log("✓ 接続成功\n");

    console.log("2. ツールのリストを取得中...");
    const tools = mcpClient.getTools();
    console.log(`✓ ${tools.length}個のツールを取得\n`);

    console.log("3. get_current_time ツールをテスト...");
    const timeResult = await mcpClient.callTool("get_current_time", {
      timezone: "Asia/Tokyo"
    });
    console.log("結果:", timeResult.content[0].text);
    console.log("✓ テスト成功\n");

    console.log("4. calculate ツールをテスト...");
    const calcResult = await mcpClient.callTool("calculate", {
      operation: "add",
      a: 10,
      b: 5
    });
    console.log("結果:", calcResult.content[0].text);
    console.log("✓ テスト成功\n");

    console.log("5. 接続を閉じています...");
    await mcpClient.close();
    console.log("✓ 完了\n");

    console.log("すべてのテストが成功しました！");
    process.exit(0);

  } catch (error) {
    console.error("✗ エラー:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testMCPConnection();
