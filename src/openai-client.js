import OpenAI from "openai";

export class OpenAIClient {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.conversationHistory = [];
  }

  convertMCPToolsToOpenAIFormat(mcpTools) {
    return mcpTools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  async chat(userMessage, tools, mcpClient) {
    console.log("\n" + "=".repeat(70));
    console.log("【ステップ1】ユーザーメッセージを受信");
    console.log("=".repeat(70));
    console.log(`入力: "${userMessage}"`);

    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const openaiTools = this.convertMCPToolsToOpenAIFormat(tools);

    console.log("\n" + "=".repeat(70));
    console.log("【ステップ2】OpenAI APIに問い合わせ中...");
    console.log("=".repeat(70));
    console.log(`モデル: gpt-4o`);
    console.log(`利用可能なツール数: ${tools.length}`);
    console.log("\n▼ 送信するメッセージ:");
    console.log(JSON.stringify(this.conversationHistory, null, 2));
    console.log("\n▼ 送信するツール定義:");
    console.log(JSON.stringify(openaiTools, null, 2));

    let response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: this.conversationHistory,
      tools: openaiTools,
      tool_choice: "auto",
    });

    console.log("\n" + "=".repeat(70));
    console.log("【ステップ3】OpenAIからの応答を受信");
    console.log("=".repeat(70));
    console.log(`Finish reason: ${response.choices[0].finish_reason}`);
    console.log("\n▼ 受信した応答の全文:");
    console.log(JSON.stringify(response.choices[0].message, null, 2));

    let message = response.choices[0].message;
    let toolCallCount = 0;

    while (message.tool_calls && message.tool_calls.length > 0) {
      toolCallCount++;
      this.conversationHistory.push(message);

      console.log("\n" + "=".repeat(70));
      console.log(`【ステップ4-${toolCallCount}】MCPツールの実行`);
      console.log("=".repeat(70));
      console.log(`実行するツール数: ${message.tool_calls.length}`);

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`\n  → ツール名: ${functionName}`);
        console.log(`  → 引数: ${JSON.stringify(functionArgs, null, 2).split('\n').join('\n     ')}`);

        try {
          console.log(`  → MCPサーバーに送信中...`);
          const result = await mcpClient.callTool(functionName, functionArgs);

          const toolResultContent = result.content
            .map((c) => {
              if (c.type === "text") {
                return c.text;
              }
              return JSON.stringify(c);
            })
            .join("\n");

          console.log(`  ✓ 実行成功`);
          console.log(`  → 結果: ${toolResultContent}`);

          this.conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResultContent,
          });
        } catch (error) {
          console.error(`  ✗ ツール実行エラー: ${error.message}`);
          this.conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `エラー: ${error.message}`,
          });
        }
      }

      console.log("\n" + "=".repeat(70));
      console.log("【ステップ5】ツール結果をOpenAIに送信中...");
      console.log("=".repeat(70));
      console.log("\n▼ 現在の会話履歴（ツール結果を含む）:");
      console.log(JSON.stringify(this.conversationHistory.slice(-5), null, 2)); // 最新5件のみ表示

      response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: this.conversationHistory,
        tools: openaiTools,
        tool_choice: "auto",
      });

      console.log(`\nFinish reason: ${response.choices[0].finish_reason}`);
      console.log("\n▼ 受信した応答の全文:");
      console.log(JSON.stringify(response.choices[0].message, null, 2));
      message = response.choices[0].message;
    }

    const finalResponse = message.content || "";

    console.log("\n" + "=".repeat(70));
    console.log("【ステップ6】最終応答の生成完了");
    console.log("=".repeat(70));
    console.log(`応答の長さ: ${finalResponse.length}文字`);
    console.log("\n▼ 最終応答の内容:");
    console.log(finalResponse);

    this.conversationHistory.push({
      role: "assistant",
      content: finalResponse,
    });

    return finalResponse;
  }

  reset() {
    this.conversationHistory = [];
  }
}
