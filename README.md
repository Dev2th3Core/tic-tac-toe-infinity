# Tic-Tac-Toe Infinity

Welcome to **Tic-Tac-Toe Infinity**! 🎉

Are you ready to experience Tic-Tac-Toe like never before? Unlike the classic game where a draw is common, Tic-Tac-Toe Infinity introduces a unique twist: **there are no draws!** The grid expands infinitely, ensuring the game continues until there is a winner. This means every match is exciting, strategic, and full of surprises.

Whether you're playing against friends or challenging our smart bots, you'll find endless fun and new strategies to explore. Give it a try and see how long you can outsmart your opponent in this ever-expanding battlefield!

**Live Demo:**  
The project is currently hosted on Render:  
👉 [tic-tac-toe-infinity](https://tic-tac-toe-infinity.onrender.com/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [License](#license)

---

## 🎮 Features

- Play Tic-Tac-Toe against friends or AI bots
- Real-time multiplayer support (via sockets)
- Responsive, modern UI with Tailwind CSS
- Extensible architecture for adding new features or bots

---

## 🛠️ Tech Stack

- **Frontend:** React, Next.js (App Router & Pages Router)
- **Styling:** Tailwind CSS, PostCSS
- **Backend/API:** Next.js API routes, WebSockets
- **Other:** TypeScript, Render (deployment)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm, yarn, pnpm, or bun (choose one)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tic-tac-toe-infinity.git
   cd tic-tac-toe-infinity
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🗂️ Project Structure

```
tic-tac-toe-infinity/
├── app/                # Main application (App Router, layouts, components)
│   ├── components/     # UI and game components
│   ├── lib/            # Client-side libraries/utilities
│   ├── layout.tsx      # App-wide layout
│   └── page.tsx        # Main entry page
├── pages/              # API routes (Next.js)
│   └── api/            # Backend endpoints (game logic, sockets, etc.)
├── public/             # Static assets (icons, images)
├── styles/             # Global styles (Tailwind, CSS)
├── lib/                # Shared libraries (e.g., socket logic)
├── README.md
├── package.json
└── ... (config files)
```

---

## 🤝 Contributing

We welcome contributions from the community! To get started:

1. **Fork the repository** and create your branch from `main` or the relevant feature branch.
2. **Make your changes** (add features, fix bugs, improve docs, etc.).
3. **Test your changes** locally.
4. **Submit a pull request** with a clear description of your changes.

**Guidelines:**
- Follow the existing code style and structure.
- Write clear, concise commit messages.
- For major changes, please open an issue first to discuss what you would like to change.

---

## 🌐 Deployment

The project is currently deployed on [Render](https://render.com/) web services as we are using socket connections which requires nodejs environment.  
You can view the live app here:  
👉 [https://tic-tac-toe-infinity.onrender.com/](https://tic-tac-toe-infinity.onrender.com/)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Enjoy playing and contributing to Tic-Tac-Toe Infinity!**
