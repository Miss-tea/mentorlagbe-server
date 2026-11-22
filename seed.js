import "dotenv/config";
import { connectDB, tuitions } from "./db.js";

const sample = [
  {
    title: "SSC Physics Crash Batch",
    subject: "Physics",
    classLevel: "SSC",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 1500,
    daysPerWeek: 3,
    bannerImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaa0aa?w=800",
    description: "Concept-first physics with weekly mock tests and doubt sessions.",
    tutorName: "Rafiq Ahmed",
    tutorEmail: "rafiq@example.com",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    title: "Python for Absolute Beginners",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Google Meet",
    monthlyFee: 2500,
    daysPerWeek: 2,
    bannerImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    description: "Build 5 mini projects while learning Python fundamentals.",
    tutorName: "Nusrat Jahan",
    tutorEmail: "nusrat@example.com",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    title: "HSC Higher Math 1-on-1",
    subject: "Math",
    classLevel: "HSC",
    mode: "Offline",
    location: "Dhanmondi, Dhaka",
    monthlyFee: 4000,
    daysPerWeek: 4,
    bannerImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    description: "Personal mentorship at your home with a printed problem bank.",
    tutorName: "Tanvir Hasan",
    tutorEmail: "tanvir@example.com",
    approvalStatus: "approved",
    isActive: true,
  },
];

await connectDB();
const col = tuitions();
await col.deleteMany({});

await col.insertMany(sample.map((t) => ({ ...t, createdAt: new Date() })));
console.log(`🌱 Seeded ${sample.length} tuitions`);
process.exit(0);
