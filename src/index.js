#!/usr/bin/env node

import dotenv from "dotenv";
import { MCPClient } from "./mcp-client.js";
import { OpenAIClient } from "./openai-client.js";
import * as readline from "readline";

dotenv.config();

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("エラー: OPENAI_API_KEY 環境変数を設定してください");
    process.exit(1);
  }

  const mcpClient = new MCPClient();
  const aiClient = new OpenAIClient(apiKey);

  console.log("=".repeat(60));
  console.log("MCP自然言語クライアント");
  console.log("=".repeat(60));
  console.log("\nMCPサーバーに接続中...\n");

  // MCPサーバーへの接続設定
  // 環境変数から取得、なければデフォルト値を使用（npx経由）
  const serverCommand = process.env.MCP_SERVER_COMMAND || "npx";
  const serverArgs = process.env.MCP_SERVER_ARGS
    ? process.env.MCP_SERVER_ARGS.split(' ')
    : ["-y", "@odenalexbs/mcp-sample-server"];

  console.log(`サーバーコマンド: ${serverCommand} ${serverArgs.join(" ")}`);

  // 他の接続オプション例:
  // オプション1: ローカルインストールされたnpmパッケージを使用
  // const serverCommand = "node";
  // const serverArgs = ["node_modules/@odenalexbs/mcp-sample-server/dist/index.js"];

  // オプション2: ローカルにビルドされた独自サーバーを使用
  // const serverCommand = "node";
  // const serverArgs = ["/path/to/your-mcp-server/dist/index.js"];

  try {
    await mcpClient.connect(serverCommand, serverArgs);
  } catch (error) {
    console.error("MCPサーバーへの接続に失敗しました:", error.message);
    process.exit(1);
  }

  const tools = mcpClient.getTools();

  console.log("\n" + "=".repeat(60));
  console.log("準備完了！自然言語でMCPサーバーとやり取りできます");
  console.log("終了するには 'quit' または 'exit' と入力してください");
  console.log("会話履歴をリセットするには 'reset' と入力してください");
  console.log("=".repeat(60) + "\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question("\nあなた: ", async (input) => {
      const userInput = input.trim();

      if (!userInput) {
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
        console.log("\nさようなら！");
        await mcpClient.close();
        rl.close();
        process.exit(0);
      }

      if (userInput.toLowerCase() === "reset") {
        aiClient.reset();
        console.log("\n会話履歴をリセットしました");
        askQuestion();
        return;
      }

      try {
        const response = await aiClient.chat(userInput, tools, mcpClient);

        console.log("\n" + "=".repeat(70));
        console.log("【最終結果】AIからの返答");
        console.log("=".repeat(70));
        console.log(response);
        console.log("=".repeat(70));
      } catch (error) {
        console.error("\n" + "=".repeat(70));
        console.error("【エラー】処理中にエラーが発生しました");
        console.error("=".repeat(70));
        console.error(`エラー内容: ${error.message}`);
        console.error("=".repeat(70));
      }

      askQuestion();
    });
  };

  askQuestion();
}

main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
