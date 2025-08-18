# Simple Chat

A local, privacy-focused chat application built with Next.js, Vercel AI SDK, Zustand, and IndexedDB. This application provides a ChatGPT-like interface for interacting with various AI providers while keeping all data and API keys stored locally.

## Features

- **URL-based Navigation**: Chat conversations are accessible via URL parameters (`/?id=conversation-id`)
- **Smart Chat Creation**: New chats are created only when you send your first message, not when clicking "New chat"
- **Persistent Conversations**: All conversations are saved locally and persist across browser sessions
- **Multiple AI Providers**: Support for OpenAI, Google AI, and custom providers
- **Real-time Streaming**: Responses stream in real-time for a smooth chat experience
- **Dark/Light Mode**: Built-in theme switching
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Usage

- **New Chat**: Click "New chat" or navigate to `/` to start a fresh conversation
- **Existing Chats**: Click on any conversation in the sidebar or use the direct URL
- **URL Sharing**: Share conversation URLs with others (they'll need their own local setup)
- **Auto-save**: Conversations are automatically saved as you chat

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.
