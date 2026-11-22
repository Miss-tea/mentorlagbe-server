import "dotenv/config";
import { connectDB, users } from "./db.js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.log("Usage: npm run make-admin -- someone@example.com");
  process.exit(1);
}

await connectDB();
const result = await users().updateOne({ email }, { $set: { role: "admin" } });
console.log(result.matchedCount ? `👑 ${email} is now an admin` : "No user with that email");
process.exit(0);
