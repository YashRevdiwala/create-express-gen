#!/usr/bin/env node
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import inquirer from "inquirer"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)
let appName = args[0]

const run = async () => {
  // Ask for app name
  if (!appName) {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "appName",
        message: "Enter your app name:",
        validate: (input) => !!input || "App name cannot be empty",
      },
    ])
    appName = answer.appName
  }

  // Ask for language
  const { language } = await inquirer.prompt([
    {
      type: "list",
      name: "language",
      message: "Choose a variant:",
      choices: ["JavaScript", "TypeScript"],
    },
  ])

  // Ask for ORM
  const { orm } = await inquirer.prompt([
    {
      type: "list",
      name: "orm",
      message: "Choose an ORM / database library:",
      choices: ["None", "Mongoose", "Prisma", "Sequelize"],
    },
  ])

  const root = path.join(process.cwd(), appName)

  if (fs.existsSync(root)) {
    console.error(`❌ Directory ${appName} already exists!`)
    process.exit(1)
  }

  // Copy template
  const templateDir = path.join(
    __dirname,
    "..",
    "templates",
    language.toLowerCase()
  )
  await fs.copy(templateDir, root)

  // --- Update package.json ---
  const pkgPath = path.join(root, "package.json")
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))
  pkg.name = appName

  // ORM dependencies
  if (orm === "Mongoose") {
    pkg.dependencies["mongoose"] = "^8.0.0"
  }
  if (orm === "Prisma") {
    pkg.dependencies["@prisma/client"] = "^5.12.0"
    pkg.devDependencies["prisma"] = "^5.12.0"
  }
  if (orm === "Sequelize") {
    pkg.dependencies["sequelize"] = "^6.35.0"
    pkg.dependencies["pg"] = "^8.11.0" // default to PostgreSQL
  }

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2))

  // --- Add ORM boilerplate ---
  if (orm !== "None") {
    const ext = language === "TypeScript" ? "ts" : "js"
    const libDir =
      language === "TypeScript"
        ? path.join(root, "src/lib")
        : path.join(root, "lib")
    const dbFile = path.join(libDir, `db.${ext}`)

    let content = ""
    if (orm === "Mongoose") {
      content =
        language === "TypeScript"
          ? `import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
`
          : `const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = { connectDB };
`
    }

    if (orm === "Prisma") {
      content = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;
`
      // Create prisma schema dir
      const prismaDir = path.join(root, "prisma")
      await fs.ensureDir(prismaDir)
      await fs.writeFile(
        path.join(prismaDir, "schema.prisma"),
        `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
}
`
      )
    }

    if (orm === "Sequelize") {
      content =
        language === "TypeScript"
          ? `import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_URI || "postgres://user:pass@localhost:5432/mydb", {
  logging: false,
});

export async function connectDB(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected via Sequelize");
  } catch (err) {
    console.error("❌ Sequelize connection error:", err);
    process.exit(1);
  }
}
`
          : `const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_URI || "postgres://user:pass@localhost:5432/mydb", {
  logging: false,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected via Sequelize");
  } catch (err) {
    console.error("❌ Sequelize connection error:", err);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
`
    }

    await fs.writeFile(dbFile, content)

    // --- Update index.js / index.ts to import connectDB ---
    const srcDir = language === "TypeScript" ? path.join(root, "src") : root
    const indexFile = path.join(srcDir, `index.${ext}`)
    let indexContent = await fs.readFile(indexFile, "utf-8")

    if (orm === "Mongoose" || orm === "Sequelize") {
      if (language === "TypeScript") {
        indexContent = `import { connectDB } from "./lib/db";\n` + indexContent
        indexContent += `

async function startServer() {
  try {
    await connectDB();
    app.listen(process.env.PORT || 3000, () => {
      console.log(\`🚀 Server running at http://localhost:\${process.env.PORT || 3000}\`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
`
      } else {
        indexContent =
          `const { connectDB } = require("./lib/db");\n` + indexContent
        indexContent += `

async function startServer() {
  try {
    await connectDB();
    app.listen(process.env.PORT || 3000, () => {
      console.log(\`🚀 Server running at http://localhost:\${process.env.PORT || 3000}\`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
`
      }
    }

    if (orm === "Prisma") {
      if (language === "TypeScript") {
        indexContent = `import prisma from "./lib/db";\n` + indexContent
      } else {
        indexContent = `const prisma = require("./lib/db");\n` + indexContent
      }
    }

    await fs.writeFile(indexFile, indexContent)
  }

  // --- Update .env with ORM vars ---
  const envPath = path.join(root, ".env")
  let envContent = await fs.readFile(envPath, "utf-8")
  if (orm === "Mongoose") {
    envContent += `\nMONGO_URI=mongodb://localhost:27017/mydb\n`
  }
  if (orm === "Prisma") {
    envContent += `\nDATABASE_URL="postgresql://user:pass@localhost:5432/mydb"\n`
  }
  if (orm === "Sequelize") {
    envContent += `\nDB_URI=postgres://user:pass@localhost:5432/mydb\n`
  }
  await fs.writeFile(envPath, envContent)

  console.log(`\n✅ Successfully created ${appName} with ${language} + ${orm}!`)
  console.log(`\n👉 Next steps:`)
  console.log(`   cd ${appName}`)
  console.log(`   npm install`)
  if (orm === "Prisma") {
    console.log(`   npx prisma migrate dev --name init`)
  }
  console.log(`   npm run dev`)
}

run()
