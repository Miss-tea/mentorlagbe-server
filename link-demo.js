import "dotenv/config";
import { connectDB, users, tuitions, applications } from "./db.js";
const [tutorEmail, studentEmail] = process.argv.slice(2).map(e => e?.toLowerCase());
if (!tutorEmail || !studentEmail) {
  console.log("Usage: npm run link-demo -- tutor@email student@email");
  process.exit(1);
}
await connectDB();
const tutor = await users().findOne({
  email: tutorEmail
});
const student = await users().findOne({
  email: studentEmail
});
if (!tutor || !student) {
  console.log("Both accounts must exist. Sign them up first.");
  process.exit(1);
}
await tuitions().updateMany({
  tutorEmail: "rafiq@example.com"
}, {
  $set: {
    tutorEmail: tutor.email,
    tutorName: tutor.name
  }
});
await applications().updateMany({
  tutorEmail: "rafiq@example.com"
}, {
  $set: {
    tutorEmail: tutor.email
  }
});
await applications().updateMany({
  studentEmail: "arif@example.com"
}, {
  $set: {
    studentEmail: student.email,
    studentName: student.name
  }
});
console.log("✅ Demo tutor and student now have realistic data");
process.exit(0);
