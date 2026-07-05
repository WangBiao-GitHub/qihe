# 契合 AI 租房合同助手

基于 Next.js App Router、TypeScript、Tailwind CSS 的移动端前端，接入 Dify Chatflow 工作流实现合同生成与审查。

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/l20250208/qihe.git
cd qihe

# 2. 配置 Dify API Key
cp .env.example .env.local
# 编辑 .env.local，将 DIFY_API_KEY 替换为你的真实 Key

# 3. 安装依赖并启动
npm install
npm run dev
```

打开 http://localhost:3000 查看页面。

## 路由

- `/` 首页，含历史对话侧页
- `/generate` 合同生成聊天流
- `/review` 合同审查页

## 环境变量

复制 `.env.example` 为 `.env.local` 并配置：

| 变量 | 说明 |
|------|------|
| `DIFY_API_URL` | Dify API 地址 |
| `DIFY_API_KEY` | Dify 应用的 API Key（Dify 后台 → 应用 → API 访问） |

## 主要目录

- `src/app/page.tsx` 首页与历史对话侧页
- `src/app/generate/page.tsx` 合同生成页（已接入 Dify Chatflow）
- `src/app/review/page.tsx` 合同审查页
- `src/app/api/chat/route.ts` Dify API 代理路由（保护 API Key）
- `src/components/` 可复用 UI 组件
- `src/lib/dify.ts` Dify 流式 SSE 客户端
- `src/lib/ai-placeholders.ts` AI 调用封装
- `src/lib/markdown.tsx` 轻量 Markdown 渲染器
- `src/lib/detect-contract.ts` 合同内容检测与拆分
- `src/lib/download-contract.ts` 合同 PDF 下载（自动去除占位提示）
- `src/lib/types.ts` 类型定义
- `src/data/mock.ts` mock 假数据
