type StreamCallbacks = {
  onMessage: (text: string, conversationId: string) => void;
  onComplete: (conversationId: string) => void;
  onError: (error: string) => void;
};

/**
 * 调用 Dify Chatflow 流式接口，通过 /api/chat 代理
 * API Key 仅存在于服务端环境变量，不会暴露到浏览器
 */
export async function streamDifyChatflow(params: {
  query: string;
  conversationId?: string;
  inputs?: Record<string, unknown>;
} & StreamCallbacks) {
  const { query, conversationId, inputs, onMessage, onComplete, onError } =
    params;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        conversation_id: conversationId || "",
        inputs: inputs || {},
      }),
    });

    if (!response.ok || !response.body) {
      const errData = await response.json().catch(() => ({}));
      onError((errData as { error?: string }).error || "请求失败，请稍后重试");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentSseEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentSseEvent = line.slice(7).trim();
          continue;
        }

        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const payload = JSON.parse(raw);
          const eventType = payload.event || currentSseEvent;

          switch (eventType) {
            case "message":
            case "message_replace": {
              if (payload.answer != null) {
                onMessage(payload.answer, payload.conversation_id);
              }
              break;
            }
            case "message_end":
            case "workflow_finished":
              onComplete(payload.conversation_id);
              break;
            case "error":
              onError(payload.message || "未知错误");
              break;
          }
        } catch {
          // 忽略非 JSON 行
        }
      }
    }
  } catch {
    onError("网络错误，请检查网络连接");
  }
}

export function callDifyChatflow(params: {
  query: string;
  conversationId?: string;
  inputs?: Record<string, unknown>;
}): Promise<{ text: string; conversationId: string }> {
  return new Promise((resolve, reject) => {
    let fullText = "";
    let finalConversationId = params.conversationId || "";

    streamDifyChatflow({
      ...params,
      onMessage: (text, conversationId) => {
        fullText += text;
        finalConversationId = conversationId;
      },
      onComplete: (conversationId) => {
        resolve({ text: fullText, conversationId });
      },
      onError: (error) => {
        reject(new Error(error));
      },
    });
  });
}
