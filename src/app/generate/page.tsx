"use client";

import { useState } from "react";
import { Download, FileText, Paperclip } from "lucide-react";
import { ChatBubble, FeedbackActions, LoadingMessage, PromptBox } from "@/components/chat";
import {
  HomeIndicator,
  PhoneFrame,
  StatusBar,
  TopNav,
} from "@/components/mobile-shell";
import { generateContractDraft } from "@/lib/ai-placeholders";
import { Markdown } from "@/lib/markdown";
import {
  hasContractContent,
  splitContractAndChat,
} from "@/lib/detect-contract";
import { downloadContractAsPdf } from "@/lib/download-contract";

type ChatMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "contract"; text: string }
  | { id: string; kind: "file"; fileName: string };

export default function GeneratePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [conversationId, setConversationId] = useState("");

  function handleFileUpload(file: File) {
    setPendingFile(file);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      kind: "user",
      text,
    };
    const newMessages: ChatMessage[] = [userMsg];
    if (pendingFile) {
      newMessages.push({
        id: `file-${Date.now()}`,
        kind: "file",
        fileName: pendingFile.name,
      });
    }

    setMessages((prev) => [...prev, ...newMessages]);
    setPendingFile(null);
    setLoading(true);

    try {
      const result = await generateContractDraft(text, conversationId);
      setConversationId(result.conversationId);

      const responseMessages: ChatMessage[] = [];

      if (hasContractContent(result.text)) {
        const { chatText, contractText } = splitContractAndChat(result.text);

        if (chatText) {
          responseMessages.push({
            id: `assistant-${Date.now()}`,
            kind: "assistant",
            text: chatText,
          });
        }

        responseMessages.push({
          id: `contract-${Date.now()}`,
          kind: "contract",
          text: contractText,
        });
      } else {
        responseMessages.push({
          id: `assistant-${Date.now()}`,
          kind: "assistant",
          text: result.text,
        });
      }

      setMessages((prev) => [...prev, ...responseMessages]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          kind: "assistant",
          text: "抱歉，请求失败，请稍后重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneFrame>
      <StatusBar />
      <TopNav action="none" />

      {messages.length === 0 ? (
        <InitialGenerateState
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 pb-5 pt-16">
            <p className="text-center text-xs text-slate-200">00:23</p>
            {messages.map((message) => {
              if (message.kind === "user") {
                return (
                  <ChatBubble key={message.id} role="user">
                    {message.text}
                  </ChatBubble>
                );
              }

              if (message.kind === "assistant") {
                return (
                  <ChatBubble key={message.id} role="assistant">
                    <Markdown content={message.text} />
                  </ChatBubble>
                );
              }

              if (message.kind === "contract") {
                return (
                  <ContractMarkdownCard key={message.id} content={message.text} />
                );
              }

              if (message.kind === "file") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="flex items-center gap-2 rounded-2xl rounded-tr-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
                      <Paperclip size={16} className="text-slate-400" />
                      <span className="max-w-[200px] truncate">
                        {message.fileName}
                      </span>
                    </div>
                  </div>
                );
              }

              return null;
            })}
            {loading ? <LoadingMessage /> : null}
          </div>

          <div className="px-4 pb-2">
            <PromptBox
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder="请输入问题"
              className="rounded-2xl"
            />
          </div>
          <HomeIndicator />
        </div>
      )}
    </PhoneFrame>
  );
}

function InitialGenerateState({
  value,
  onChange,
  onSend,
  onFileUpload,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: (file: File) => void;
}) {
  return (
    <section className="flex flex-1 flex-col px-8 pt-28">
      <h1 className="text-center text-3xl font-bold text-slate-950">
        合同生成
      </h1>
      <PromptBox
        value={value}
        onChange={onChange}
        onSend={onSend}
        onFileUpload={onFileUpload}
        multiline
        placeholder="请描述你的租房合同需求，例如：帮我写一份租房合同。"
        className="mt-8 border-slate-950 shadow-none"
      />
      <div className="mt-auto">
        <HomeIndicator />
      </div>
    </section>
  );
}

function ContractMarkdownCard({ content }: { content: string }) {
  return (
    <article className="relative rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <FileText size={14} />
          <span>租房合同</span>
        </div>
        <button
          type="button"
          onClick={() => downloadContractAsPdf(content)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
        >
          <Download size={13} />
          下载 PDF
        </button>
      </div>
      <div className="text-slate-700">
        <Markdown content={content} />
      </div>
      <FeedbackActions content={content} />
    </article>
  );
}
