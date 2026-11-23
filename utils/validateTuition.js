export const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English", "Programming", "IELTS", "Science", "Design", "General"];
export const CLASS_LEVELS = ["Class 6", "Class 7", "Class 8", "Class 9", "SSC", "HSC", "Admission", "University"];
export const MODES = ["Online", "Offline"];
export function cleanTuition(body = {}) {
  const t = {
    title: String(body.title ?? "").trim(),
    subject: String(body.subject ?? ""),
    classLevel: String(body.classLevel ?? ""),
    mode: String(body.mode ?? ""),
    location: String(body.location ?? "").trim(),
    monthlyFee: Number(body.monthlyFee),
    daysPerWeek: Number(body.daysPerWeek),
    bannerImage: String(body.bannerImage ?? "").trim(),
    description: String(body.description ?? "").trim()
  };
  if (t.title.length < 5 || t.title.length > 100) return {
    error: "Title must be 5 to 100 characters"
  };
  if (!SUBJECTS.includes(t.subject)) return {
    error: "Please choose a valid subject"
  };
  if (!CLASS_LEVELS.includes(t.classLevel)) return {
    error: "Please choose a valid class level"
  };
  if (!MODES.includes(t.mode)) return {
    error: "Mode must be Online or Offline"
  };
  if (t.location.length < 2 || t.location.length > 100) return {
    error: "Location must be 2 to 100 characters"
  };
  if (!Number.isFinite(t.monthlyFee) || t.monthlyFee < 100 || t.monthlyFee > 100000) return {
    error: "Monthly fee must be between 100 and 100000"
  };
  if (!Number.isInteger(t.daysPerWeek) || t.daysPerWeek < 1 || t.daysPerWeek > 7) return {
    error: "Days per week must be 1 to 7"
  };
  if (!/^https?:\/\/\S+$/i.test(t.bannerImage)) return {
    error: "Banner image must be a valid http(s) link"
  };
  if (t.description.length < 20 || t.description.length > 1500) return {
    error: "Description must be 20 to 1500 characters"
  };
  return {
    data: t
  };
}
