# create-express-gen

A simple, interactive CLI tool to **generate a production-ready Express.js boilerplate** with support for **JavaScript** or **TypeScript** and popular ORMs like **Mongoose**, **Prisma**, and **Sequelize**.

Think of it as `create-next-app` — but for Express.

---

## ✨ Features

- 🚀 **Instant setup** for an Express.js project
- 🟦 Choose **JavaScript (CommonJS)** or **TypeScript (ESM)**
- 🛠️ Built-in project structure with:
  - `controllers/` (for app logic)
  - `routes/` (API routes)
  - `lib/` (DB connection & utilities)
  - `.env` preconfigured
- 📦 ORM support:
  - **Mongoose** (MongoDB)
  - **Prisma** (Postgres, MySQL, SQLite, etc.)
  - **Sequelize** (SQL databases)
  - Or **no ORM** at all
- 🔧 Pre-installed dependencies:
  - `express`, `dotenv`, `cors`
  - ORM packages automatically added based on your choice
- 🛡️ Boilerplate with **connectDB()** handling & clean structure

---

## 📦 Installation

You don’t need to install globally. Just run it with **npx**:

```bash
npx create-express-gen myapp
```

[![npm version](https://img.shields.io/npm/v/create-myexpress-app)](https://www.npmjs.com/package/create-express-gen)
[![npm downloads](https://img.shields.io/npm/dm/create-myexpress-app)](https://www.npmjs.com/package/create-express-gen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
