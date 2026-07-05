import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversation_id, inputs } = body;

    const apiUrl = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
    const apiKey = process.env.DIFY_API_KEY || "";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "未配置 DIFY_API_KEY，请在 .env.local 中设置" }),
        { status: 500 },
      );
    }

    const response = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        inputs: inputs || {},
        user: "qihe_user",
        response_mode: "streaming",
        conversation_id: conversation_id || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dify API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Dify API error: ${response.status}` }),
        { status: response.status },
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 },
    );
  }
}
