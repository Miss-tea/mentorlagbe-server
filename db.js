import dns from "node:dns";
if (!process.env.VERCEL) dns.setServers(["8.8.8.8", "1.1.1.1"]);
import { MongoClient } from "mongodb";
let db;
export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  await applications().createIndex({
    tuitionId: 1,
    studentEmail: 1
  }, {
    unique: true
  });
  await payments().createIndex({
    stripeSessionId: 1
  }, {
    unique: true
  });
  console.log("✅ MongoDB connected");
  return db;
}
export const users = () => db.collection("users");
export const tuitions = () => db.collection("tuitions");
export const applications = () => db.collection("applications");
export const payments = () => db.collection("payments");
