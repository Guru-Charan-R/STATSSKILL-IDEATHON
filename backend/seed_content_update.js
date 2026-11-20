// Content update seed:
// - removes the unrelated demo video
// - adds verified, topic-relevant statistics/probability videos
// - adds 3 demo quizzes with 6 MCQs each
// - adds text documents (with RAG chunks) from backend/uploads
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/db');

const admin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
const trainer = db.prepare("SELECT id FROM users WHERE role='trainer' LIMIT 1").get();
const owner = admin || trainer;
if (!owner) throw new Error('No admin/trainer user found. Run node seed.js first.');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

function chunkText(text, size = 900) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) {
    chunks.push(cleaned.slice(i, i + size));
    i += size - 120;
    if (i >= cleaned.length) break;
  }
  return chunks;
}

db.exec('BEGIN');
try {
  // ---- 1. Remove the unrelated demo video ----
  const demo = db.prepare("SELECT id FROM videos WHERE youtube_id='jNQXAC9IVRw'").all();
  for (const v of demo) {
    db.prepare('DELETE FROM video_progress WHERE video_id=?').run(v.id);
    db.prepare('DELETE FROM saved_videos WHERE video_id=?').run(v.id);
    db.prepare('DELETE FROM course_lessons WHERE video_id=?').run(v.id);
    db.prepare('DELETE FROM videos WHERE id=?').run(v.id);
    console.log('removed demo video id', v.id);
  }

  // ---- 2. Verified statistics / probability videos ----
  // Titles and channel names are taken from YouTube oEmbed metadata.
  const videos = [
    { y: '3v9w79NhsfI', t: 'Random variables | Probability and Statistics', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'beginner', desc: 'Basic idea and definitions of random variables, with examples from probability and statistics.' },
    { y: 'uzkc-qNVoOk', t: 'Probability explained | Independent and dependent events', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'beginner', desc: 'Introduction to probability using coin flips and dice rolls, including independence and dependence.' },
    { y: 'KFgvOQtH0Z0', t: 'Intuitive sense of probabilities', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'beginner', desc: 'What probabilities 0 and 1 mean and how to reason about likelihood in everyday situations.' },
    { y: 'FICRd7Lp67s', t: 'Determining probability | Probability and Statistics', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'beginner', desc: 'Finding probabilities from sample spaces and equally likely outcomes.' },
    { y: 'DIjlllgq3dc', t: 'Example: Lottery probability | Probability and combinatorics', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'intermediate', desc: 'Worked example calculating the chance of winning a 4-number lottery using combinations.' },
    { y: 'pIfpHdGVwLU', t: 'Conditional probability and independence | AP Statistics', c: 'Khan Academy', l: 'en', s: 'Statistics Fundamentals', d: 'intermediate', desc: 'Conditional probability, the multiplication rule and testing whether events are independent.' },
    { y: 'HvDqbzu0i0E', t: 'Statistics: Standard deviation | Descriptive statistics', c: 'Khan Academy', l: 'en', s: 'Data Analysis', d: 'intermediate', desc: 'How standard deviation measures spread around the mean and how to calculate it.' },
    { y: 'Qf3RMGXR-h8', t: 'Statistics: Sample variance | Descriptive statistics', c: 'Khan Academy', l: 'en', s: 'Data Analysis', d: 'intermediate', desc: 'Using sample variance to estimate population variance and the reason for n minus one.' },
    { y: 'hlM7zdf7zwU', t: 'Confidence intervals and margin of error | AP Statistics', c: 'Khan Academy', l: 'en', s: 'Data Analysis', d: 'advanced', desc: 'Building confidence intervals and interpreting margin of error for survey estimates.' },
    { y: 'z-Qi4w6Xkuc', t: 'Types of statistical studies | Probability and Statistics', c: 'Khan Academy', l: 'en', s: 'Survey Methodology', d: 'beginner', desc: 'Sample surveys, observational studies and experiments, and how conclusions differ.' },
    { y: 'dTQT4NFQOl4', t: 'Introduction to probability | Data Handling | NCERT Grade 8', c: 'Khan Academy India - English', l: 'en', s: 'Statistics Fundamentals', d: 'beginner', desc: 'NCERT-level introduction to probability using everyday examples.' },
    { y: 'OpmEm4PgLpU', t: 'Intro to theoretical probability - 1/2 (Hindi)', c: 'Khan Academy India', l: 'hi', s: 'Statistics Fundamentals', d: 'beginner', desc: 'हिंदी में सैद्धांतिक प्रायिकता का परिचय - सिक्का और पासे के उदाहरण।' },
    { y: '7NPnxGjcBks', t: 'Introduction to Theoretical Probability [Hindi]', c: 'Khan Academy India - Hindi medium', l: 'hi', s: 'Statistics Fundamentals', d: 'beginner', desc: 'हिंदी माध्यम में प्रायिकता के मूलभूत सिद्धांत और गणना।' },
    { y: 'G9rxXgR9Zr0', t: 'Probability Rules in Tamil | Data Science Tutorial for Beginners', c: 'BTree Systems', l: 'ta', s: 'Statistics Fundamentals', d: 'beginner', desc: 'தமிழில் நிகழ்தகவு விதிகள் - தரவு அறிவியல் தொடக்கப் பாடம்.' },
    { y: 'IZYSFJMJOw0', t: 'Example 8.12 | Statistics & Probability | Class 10 | In Tamil', c: 'Namma ooru Google', l: 'ta', s: 'Statistics Fundamentals', d: 'beginner', desc: '10 ஆம் வகுப்பு புள்ளியியல் மற்றும் நிகழ்தகவு - உதாரணம் 8.12.' },
    { y: 'HfrYyf36mP0', t: 'PROBABILITY, Class 11 Full Chapter explained in Malayalam', c: 'MATH AND SCIENCE GUIDE', l: 'ml', s: 'Statistics Fundamentals', d: 'intermediate', desc: 'ക്ലാസ് 11 പ്രോബബിലിറ്റി - മലയാളത്തിൽ വിശദമായ വിശദീകരണം.' },
    { y: '4nBmw1eQ9s0', t: 'Conditional Probability | An Introduction to Statistics - 04 in Malayalam', c: 'Malayali Statistician', l: 'ml', s: 'Statistics Fundamentals', d: 'intermediate', desc: 'ഷരത് പ്രോബബിലിറ്റിയും സ്റ്റാറ്റിസ്റ്റിക്സ് ആമുഖവും - മലയാളം.' },
    { y: 'S0tI_W_U058', t: 'Normal distribution | Malayalam Explanation with Examples', c: 'Maths Dwani', l: 'ml', s: 'Data Analysis', d: 'advanced', desc: 'സാധാരണ വിതരണം - മലയാളത്തിൽ ഉദാഹരണങ്ങളോടെ.' },
  ];
  const addVideo = db.prepare('INSERT INTO videos(title,youtube_id,channel,language,subject,difficulty,description,thumbnail,submitted_by,status) VALUES (?,?,?,?,?,?,?,?,?,?)');
  let videoCount = 0;
  for (const v of videos) {
    if (db.prepare('SELECT id FROM videos WHERE youtube_id=?').get(v.y)) continue;
    addVideo.run(v.t, v.y, v.c, v.l, v.s, v.d, v.desc, `https://img.youtube.com/vi/${v.y}/hqdefault.jpg`, owner.id, 'approved');
    videoCount++;
  }
  console.log('videos added:', videoCount);

  // ---- 3. Three demo quizzes, six MCQs each ----
  const quizzes = [
    {
      title: 'Demo Quiz 1 - Probability Basics', topic: 'Probability', difficulty: 'beginner',
      description: 'Six multiple-choice questions on sample spaces, probability rules and independence.',
      questions: [
        { q: 'Which of the following cannot be a probability?', o: ['0', '0.75', '1.25', '1'], c: 2, e: 'A probability must be between 0 and 1, inclusive.', k: 'statistics' },
        { q: 'The probability of an impossible event is:', o: ['1', '0.5', 'undefined', '0'], c: 3, e: 'An impossible event never occurs, so its probability is 0.', k: 'statistics' },
        { q: 'A fair coin is tossed twice. What is the probability of getting two heads?', o: ['1/4', '1/2', '1/3', '1'], c: 0, e: 'Sample space = {HH, HT, TH, TT}; one favourable outcome out of four.', k: 'statistics' },
        { q: 'If A and B are mutually exclusive with P(A)=0.4 and P(B)=0.3, what is P(A or B)?', o: ['0.12', '0.1', '0.7', '0.55'], c: 2, e: 'For mutually exclusive events, P(A or B) = P(A) + P(B) = 0.7.', k: 'statistics' },
        { q: 'For independent events A and B, P(A and B) equals:', o: ['P(A)+P(B)', 'P(A) x P(B)', 'P(A)/P(B)', '1 - P(A)'], c: 1, e: 'Independence means the joint probability is the product of the individual probabilities.', k: 'data_analysis' },
        { q: 'The conditional probability P(A given B) is defined as:', o: ['P(A and B)/P(B)', 'P(B)/P(A)', 'P(A) x P(B)', 'P(A) + P(B)'], c: 0, e: 'P(A|B) = P(A and B) / P(B), provided P(B) > 0.', k: 'data_analysis' },
      ]
    },
    {
      title: 'Demo Quiz 2 - Ratios and Proportions', topic: 'Ratios & Proportions', difficulty: 'beginner',
      description: 'Six multiple-choice questions on ratios, proportions, percentages and weighted averages.',
      questions: [
        { q: 'The ratio 12:18 in its simplest form is:', o: ['6:9', '2:3', '3:2', '4:6'], c: 1, e: 'Divide both terms by their highest common factor, 6.', k: 'statistics' },
        { q: 'If 3 kg of a commodity costs Rs 120, what will 5 kg cost?', o: ['Rs 180', 'Rs 240', 'Rs 200', 'Rs 150'], c: 2, e: 'Cost per kg = 40, so 5 kg costs 5 x 40 = Rs 200.', k: 'statistics' },
        { q: 'If a/b = c/d, which statement must be true?', o: ['a x d = b x c', 'a + d = b + c', 'a x b = c x d', 'a - d = b - c'], c: 0, e: 'Cross multiplication gives a x d = b x c.', k: 'statistics' },
        { q: 'A price rises from 200 to 240. The percentage increase is:', o: ['40%', '24%', '20%', '16.7%'], c: 2, e: 'Increase = 40; 40/200 x 100 = 20%.', k: 'data_analysis' },
        { q: 'An indicator moving from 30% to 35% has increased by:', o: ['5 percentage points', '35%', '16.7 percentage points', '5%'], c: 0, e: 'The absolute change is 5 percentage points; the relative change is 16.7%.', k: 'reporting' },
        { q: 'Two quantities are inversely proportional when:', o: ['their ratio is constant', 'their sum is constant', 'their product is constant', 'their difference is constant'], c: 2, e: 'In inverse proportion, x x y stays constant.', k: 'statistics' },
      ]
    },
    {
      title: 'Demo Quiz 3 - Descriptive Statistics', topic: 'Descriptive Statistics', difficulty: 'intermediate',
      description: 'Six multiple-choice questions on mean, median, mode, dispersion and coefficient of variation.',
      questions: [
        { q: 'The mean of 2, 4, 6, 8 and 10 is:', o: ['5', '6', '7', '8'], c: 1, e: 'Sum = 30 and there are 5 values, so mean = 6.', k: 'statistics' },
        { q: 'Which measure of central tendency is most affected by an extreme value?', o: ['Median', 'Mode', 'Mean', 'None of these'], c: 2, e: 'The mean uses every value, so an outlier pulls it strongly.', k: 'statistics' },
        { q: 'The median of 10, 12, 12, 13 and 300 is:', o: ['12', '13', '69.4', '12.5'], c: 0, e: 'The middle value after sorting is 12; the median resists the extreme 300.', k: 'statistics' },
        { q: 'The mode of a dataset is the value that:', o: ['is the largest', 'occurs most often', 'lies in the middle', 'equals the average'], c: 1, e: 'Mode is the most frequently occurring value.', k: 'statistics' },
        { q: 'Standard deviation measures:', o: ['central tendency', 'dispersion', 'skewness', 'sample size'], c: 1, e: 'Standard deviation measures the spread of values around the mean.', k: 'data_analysis' },
        { q: 'The coefficient of variation is useful because it:', o: ['is always larger than the standard deviation', 'has no unit and allows comparison across different scales', 'only works for positive data', 'replaces the need for a mean'], c: 1, e: 'CV = (SD / mean) x 100, so it is unit-free and comparable across datasets.', k: 'data_analysis' },
      ]
    }
  ];
  const addQuiz = db.prepare('INSERT INTO quizzes(title,description,created_by,topic,difficulty,status) VALUES (?,?,?,?,?,?)');
  const addQ = db.prepare('INSERT INTO questions(quiz_id,question_text,options,correct_index,explanation,competency_key) VALUES (?,?,?,?,?,?)');
  let quizCount = 0;
  for (const quiz of quizzes) {
    if (db.prepare('SELECT id FROM quizzes WHERE title=?').get(quiz.title)) continue;
    const info = addQuiz.run(quiz.title, quiz.description, owner.id, quiz.topic, quiz.difficulty, 'approved');
    for (const qu of quiz.questions) {
      addQ.run(info.lastInsertRowid, qu.q, JSON.stringify(qu.o), qu.c, qu.e, qu.k);
    }
    quizCount++;
  }
  console.log('quizzes added:', quizCount, '(6 questions each)');

  // ---- 4. Text documents for the document library / RAG ----
  const docs = [
    { file: 'stats_probability_basics.txt', title: 'Probability - Basic Concepts and Rules', tags: 'probability,statistics,basics,rules' },
    { file: 'stats_ratios_proportions.txt', title: 'Ratios, Proportions and Percentages', tags: 'ratios,proportions,percentages,statistics' },
    { file: 'stats_descriptive_mean_median_mode.txt', title: 'Descriptive Statistics - Mean, Median and Mode', tags: 'descriptive statistics,mean,median,mode' },
    { file: 'stats_variance_std_deviation.txt', title: 'Variance, Standard Deviation and Coefficient of Variation', tags: 'variance,standard deviation,dispersion,cv' },
    { file: 'stats_sampling_index_numbers.txt', title: 'Sampling and Index Numbers - Quick Reference', tags: 'sampling,cpi,wpi,index numbers' },
  ];
  const addDoc = db.prepare('INSERT INTO documents(title,filename,original_name,mime_type,size,uploaded_by,status,tags) VALUES (?,?,?,?,?,?,?,?)');
  const addChunk = db.prepare('INSERT INTO document_chunks(document_id,chunk_index,content) VALUES (?,?,?)');
  const addFts = db.prepare('INSERT INTO chunks_fts(content,document_id,chunk_id) VALUES (?,?,?)');
  let docCount = 0;
  for (const d of docs) {
    if (db.prepare('SELECT id FROM documents WHERE title=?').get(d.title)) continue;
    const file = path.join(UPLOAD_DIR, d.file);
    if (!fs.existsSync(file)) { console.warn('missing file:', file); continue; }
    const content = fs.readFileSync(file, 'utf8');
    const info = addDoc.run(d.title, d.file, d.title + '.txt', 'text/plain', Buffer.byteLength(content), owner.id, 'approved', d.tags);
    const id = info.lastInsertRowid;
    chunkText(content).forEach((chunk, idx) => {
      const r = addChunk.run(id, idx, chunk);
      addFts.run(chunk, id, r.lastInsertRowid);
    });
    docCount++;
  }
  console.log('documents added:', docCount);

  // tidy up placeholder test documents (reversible: they are only archived)
  const archived = db.prepare("UPDATE documents SET status='archived' WHERE title LIKE 'Test Doc%' AND status IN ('draft','approved')").run();
  if (archived.changes) console.log('archived placeholder docs:', archived.changes);

  db.exec('COMMIT');
  console.log('Content update complete.');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
