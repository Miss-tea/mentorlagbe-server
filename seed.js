import "dotenv/config";
import { connectDB, tuitions, applications } from "./db.js";
const img = seed => `https://picsum.photos/seed/${seed}/800/500`;
const raw = [{
  title: "SSC Physics Crash Batch",
  subject: "Physics",
  classLevel: "SSC",
  mode: "Online",
  location: "Zoom",
  monthlyFee: 1500,
  daysPerWeek: 3,
  bannerImage: img("physics1"),
  description: "Concept-first physics with weekly mock tests and doubt-clearing sessions. Ideal for SSC candidates who want to finish the syllabus fast.",
  tutorName: "Rafiq Ahmed",
  tutorEmail: "rafiq@example.com",
  approvalStatus: "approved"
}, {
  title: "Python for Absolute Beginners",
  subject: "Programming",
  classLevel: "University",
  mode: "Online",
  location: "Google Meet",
  monthlyFee: 2500,
  daysPerWeek: 2,
  bannerImage: img("python1"),
  description: "Build 5 mini projects while learning Python fundamentals. No prior coding experience needed.",
  tutorName: "Nusrat Jahan",
  tutorEmail: "nusrat@example.com",
  approvalStatus: "approved"
}, {
  title: "HSC Higher Math 1-on-1",
  subject: "Math",
  classLevel: "HSC",
  mode: "Offline",
  location: "Dhanmondi, Dhaka",
  monthlyFee: 4000,
  daysPerWeek: 4,
  bannerImage: img("math1"),
  description: "Personal mentorship at your home with a printed problem bank and weekly progress reports.",
  tutorName: "Tanvir Hasan",
  tutorEmail: "tanvir@example.com",
  approvalStatus: "approved"
}, {
  title: "IELTS 7+ Intensive Preparation",
  subject: "IELTS",
  classLevel: "Admission",
  mode: "Online",
  location: "Zoom",
  monthlyFee: 3500,
  daysPerWeek: 3,
  bannerImage: img("ielts1"),
  description: "All four modules covered with weekly mock tests, speaking practice and personal writing feedback.",
  tutorName: "Samia Rahman",
  tutorEmail: "samia@example.com",
  approvalStatus: "approved"
}, {
  title: "Class 8 Science and Math Batch",
  subject: "Science",
  classLevel: "Class 8",
  mode: "Offline",
  location: "Uttara, Dhaka",
  monthlyFee: 2000,
  daysPerWeek: 3,
  bannerImage: img("science1"),
  description: "Small batch of 6 students. Activity-based learning that makes science fun and easy to remember.",
  tutorName: "Mahmud Hossain",
  tutorEmail: "mahmud@example.com",
  approvalStatus: "approved"
}, {
  title: "Web Development with React",
  subject: "Programming",
  classLevel: "University",
  mode: "Online",
  location: "Google Meet",
  monthlyFee: 3000,
  daysPerWeek: 3,
  bannerImage: img("react1"),
  description: "From HTML basics to a deployed React portfolio in 10 weeks, with code reviews every Friday.",
  tutorName: "Farhan Kabir",
  tutorEmail: "farhan@example.com",
  approvalStatus: "approved"
}, {
  title: "HSC Chemistry Master Class",
  subject: "Chemistry",
  classLevel: "HSC",
  mode: "Online",
  location: "Zoom",
  monthlyFee: 1800,
  daysPerWeek: 3,
  bannerImage: img("chem1"),
  description: "Organic and physical chemistry explained with animations, followed by chapter-wise exams.",
  tutorName: "Dr. Ayesha Siddika",
  tutorEmail: "ayesha@example.com",
  approvalStatus: "approved"
}, {
  title: "Spoken English for Beginners",
  subject: "English",
  classLevel: "Class 9",
  mode: "Offline",
  location: "Mirpur, Dhaka",
  monthlyFee: 1200,
  daysPerWeek: 2,
  bannerImage: img("english1"),
  description: "Lose the fear of speaking. Daily conversation practice, pronunciation drills and vocabulary games.",
  tutorName: "Tasnim Akter",
  tutorEmail: "tasnim@example.com",
  approvalStatus: "approved"
}, {
  title: "SSC Biology Quick Revision",
  subject: "Biology",
  classLevel: "SSC",
  mode: "Online",
  location: "Google Meet",
  monthlyFee: 1400,
  daysPerWeek: 2,
  bannerImage: img("bio1"),
  description: "Diagram-focused revision with memory tricks and past-paper practice before the board exam.",
  tutorName: "Shakil Mahmud",
  tutorEmail: "shakil@example.com",
  approvalStatus: "approved"
}, {
  title: "Data Structures and Algorithms",
  subject: "Programming",
  classLevel: "University",
  mode: "Online",
  location: "Discord + Zoom",
  monthlyFee: 3200,
  daysPerWeek: 3,
  bannerImage: img("dsa1"),
  description: "Master arrays, trees and graphs with problem solving for interviews and university exams.",
  tutorName: "Imran Chowdhury",
  tutorEmail: "imran@example.com",
  approvalStatus: "approved"
}, {
  title: "Class 10 General Math Support",
  subject: "Math",
  classLevel: "SSC",
  mode: "Offline",
  location: "Chattogram, Agrabad",
  monthlyFee: 1600,
  daysPerWeek: 4,
  bannerImage: img("math2"),
  description: "Step-by-step algebra and geometry practice with a strong focus on weak topics.",
  tutorName: "Rina Das",
  tutorEmail: "rina@example.com",
  approvalStatus: "approved"
}, {
  title: "University Admission Physics",
  subject: "Physics",
  classLevel: "Admission",
  mode: "Online",
  location: "Zoom",
  monthlyFee: 2800,
  daysPerWeek: 4,
  bannerImage: img("physics2"),
  description: "Targeted prep for BUET, DU and medical admission tests with timed MCQ practice.",
  tutorName: "Rafiq Ahmed",
  tutorEmail: "rafiq@example.com",
  approvalStatus: "approved"
}, {
  title: "Graphic Design with Figma",
  subject: "Design",
  classLevel: "University",
  mode: "Online",
  location: "Google Meet",
  monthlyFee: 2200,
  daysPerWeek: 2,
  bannerImage: img("figma1"),
  description: "Learn UI design basics and build a 3-screen mobile app prototype.",
  tutorName: "Nusrat Jahan",
  tutorEmail: "nusrat@example.com",
  approvalStatus: "pending"
}, {
  title: "Class 6 All Subjects Home Tutor",
  subject: "General",
  classLevel: "Class 6",
  mode: "Offline",
  location: "Mohammadpur, Dhaka",
  monthlyFee: 3000,
  daysPerWeek: 5,
  bannerImage: img("home1"),
  description: "Daily home tutoring covering all subjects with homework supervision.",
  tutorName: "Mahmud Hossain",
  tutorEmail: "mahmud@example.com",
  approvalStatus: "pending"
}, {
  title: "Guaranteed A+ Without Studying",
  subject: "General",
  classLevel: "SSC",
  mode: "Online",
  location: "Online",
  monthlyFee: 500,
  daysPerWeek: 1,
  bannerImage: img("spam1"),
  description: "Unrealistic promises. This one should be rejected by the admin.",
  tutorName: "Test Tutor",
  tutorEmail: "spam@example.com",
  approvalStatus: "rejected"
}];
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const docs = raw.map((t, i) => ({
  ...t,
  isActive: true,
  createdAt: new Date(now - i * DAY)
}));
await connectDB();
await tuitions().deleteMany({});
await applications().deleteMany({});
const result = await tuitions().insertMany(docs);
const idOf = index => String(result.insertedIds[index]);
const apps = [{
  i: 0,
  studentName: "Arif Hossain",
  studentEmail: "arif@example.com",
  studentPhone: "01711000001",
  preferredSchedule: "Sat, Mon, Wed - 7 PM",
  studentNote: "I struggle with motion and force chapters.",
  status: "pending"
}, {
  i: 0,
  studentName: "Mim Akter",
  studentEmail: "mim@example.com",
  studentPhone: "01711000002",
  preferredSchedule: "Sun, Tue, Thu - 6 PM",
  studentNote: "Preparing for the SSC board exam.",
  status: "accepted"
}, {
  i: 1,
  studentName: "Arif Hossain",
  studentEmail: "arif@example.com",
  studentPhone: "01711000001",
  preferredSchedule: "Fri, Sat - 9 PM",
  studentNote: "Complete beginner, excited to start!",
  status: "accepted"
}, {
  i: 3,
  studentName: "Mim Akter",
  studentEmail: "mim@example.com",
  studentPhone: "01711000002",
  preferredSchedule: "Mon, Wed, Fri - 8 PM",
  studentNote: "Target band score is 7.5.",
  status: "pending"
}, {
  i: 5,
  studentName: "Arif Hossain",
  studentEmail: "arif@example.com",
  studentPhone: "01711000001",
  preferredSchedule: "Sat, Mon, Wed - 8 PM",
  studentNote: "I know HTML and CSS already.",
  status: "rejected"
}, {
  i: 9,
  studentName: "Mim Akter",
  studentEmail: "mim@example.com",
  studentPhone: "01711000002",
  preferredSchedule: "Tue, Thu, Sat - 7 PM",
  studentNote: "Preparing for coding interviews.",
  status: "pending"
}].map(({
  i,
  ...a
}) => ({
  ...a,
  tuitionId: idOf(i),
  tuitionTitle: docs[i].title,
  subject: docs[i].subject,
  monthlyFee: docs[i].monthlyFee,
  tutorEmail: docs[i].tutorEmail,
  appliedAt: new Date(now - i * DAY)
}));
await applications().insertMany(apps);
console.log(`🌱 Seeded ${docs.length} tuitions and ${apps.length} applications`);
process.exit(0);
