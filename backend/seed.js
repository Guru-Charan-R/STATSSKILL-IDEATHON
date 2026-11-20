require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/db');

// users (neutral demo identities)
const users = [
  { name: 'Admin User', email: 'admin@statskill.ai', password: 'Admin@123', role: 'admin', department: 'Administration', region: 'National', designation: 'Platform Administrator' },
  { name: 'Trainer User', email: 'trainer@statskill.ai', password: 'Trainer@123', role: 'trainer', department: 'Training', region: 'National', designation: 'Senior Trainer' },
  { name: 'Trainee User', email: 'trainee@statskill.ai', password: 'Trainee@123', role: 'trainee', department: 'Statistics', region: 'State Directorate', designation: 'Statistical Officer' },
];
for (const u of users) {
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(u.email);
  if (exists) continue;
  const hash = bcrypt.hashSync(u.password, 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role,department,region,designation) VALUES (?,?,?,?,?,?,?)')
    .run(u.name, u.email, hash, u.role, u.department, u.region, u.designation);
}

// departments
const depts = ['National Accounts', 'Price Statistics', 'Labour Bureau', 'Field Operations'];
for (const d of depts) {
  const exists = db.prepare('SELECT id FROM departments WHERE name=?').get(d);
  if (!exists) db.prepare('INSERT INTO departments(name,region) VALUES (?,?)').run(d, 'National');
}

// batches
const trainer = db.prepare("SELECT id FROM users WHERE role='trainer' LIMIT 1").get();
const dept = db.prepare('SELECT id FROM departments LIMIT 1').get();
const batchExists = db.prepare('SELECT id FROM batches WHERE name=?').get('Batch A - 2026');
if (!batchExists) db.prepare('INSERT INTO batches(name,department_id,trainer_id) VALUES (?,?,?)').run('Batch A - 2026', dept.id, trainer.id);

// assign trainee to batch
const trainee = db.prepare("SELECT id FROM users WHERE role='trainee' LIMIT 1").get();
const batch = db.prepare('SELECT id FROM batches LIMIT 1').get();
db.prepare('UPDATE users SET batch_id=? WHERE id=?').run(batch.id, trainee.id);

// sample videos (verified YouTube IDs)
const videos = [
  { title: 'Statistics: The average (Descriptive statistics)', youtube_id: 'uhxtUt_-GyM', channel: 'Khan Academy', language: 'en', subject: 'Statistics Fundamentals', difficulty: 'beginner', description: 'Introduction to averages and descriptive statistics.' },
  { title: 'Hypothesis testing and p-values', youtube_id: '-FtlH4svqx4', channel: 'Khan Academy', language: 'en', subject: 'Data Analysis', difficulty: 'intermediate', description: 'Basics of hypothesis testing and p-values in inferential statistics.' },
];
for (const v of videos) {
  const exists = db.prepare('SELECT id FROM videos WHERE youtube_id=?').get(v.youtube_id);
  if (exists) continue;
  const thumb = `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  db.prepare('INSERT INTO videos(title,youtube_id,channel,language,subject,difficulty,description,thumbnail,submitted_by,status) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(v.title, v.youtube_id, v.channel, v.language, v.subject, v.difficulty, v.description, thumb, trainer.id, 'approved');
}

// course
const courseExists = db.prepare('SELECT id FROM courses WHERE title=?').get('Statistics Fundamentals (English)');
if (!courseExists) {
  const info = db.prepare('INSERT INTO courses(title,description,language,subject,difficulty,created_by) VALUES (?,?,?,?,?,?)')
    .run('Statistics Fundamentals (English)', 'An introductory course covering descriptive statistics and hypothesis testing.', 'en', 'Statistics Fundamentals', 'beginner', trainer.id);
  const courseId = info.lastInsertRowid;
  const vids = db.prepare("SELECT id FROM videos WHERE status='approved' ORDER BY id").all();
  vids.forEach((v, idx) => db.prepare('INSERT INTO course_lessons(course_id,video_id,position) VALUES (?,?,?)').run(courseId, v.id, idx));
}

// sample diagnostic assessment for trainee
const comp = db.prepare('SELECT id,key FROM competencies').all();
const existingAssess = db.prepare('SELECT COUNT(*) as n FROM assessments WHERE user_id=?').get(trainee.id).n;
if (existingAssess === 0) {
  const scores = { statistics: 72, data_analysis: 58, digital_tools: 65, survey_methods: 50, census: 45, data_viz: 60, reporting: 55, software: 70 };
  const ins = db.prepare('INSERT INTO assessments(user_id,competency_id,score,target) VALUES (?,?,?,?)');
  for (const c of comp) {
    ins.run(trainee.id, c.id, scores[c.key] ?? 60, 80);
  }
}

console.log('Seed complete.');
console.log('Admin: admin@statskill.ai / Admin@123');
console.log('Trainer: trainer@statskill.ai / Trainer@123');
console.log('Trainee: trainee@statskill.ai / Trainee@123');