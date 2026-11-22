import dns from "node:dns";

// Some internet providers block the DNS lookups MongoDB Atlas needs.
// Use Google and Cloudflare DNS for this program (only on your own computer).
if (!process.env.VERCEL) dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { MongoClient } from "mongodb";

let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("✅ MongoDB connected");
  return db;
}

// Use these anywhere in the app to reach a collection
export const users = () => db.collection("users");
export const tuitions = () => db.collection("tuitions");
export const applications = () => db.collection("applications");
export const payments = () => db.collection("payments");
