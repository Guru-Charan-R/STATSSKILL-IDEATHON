require('dotenv').config();
const db = require('./src/db');

const trainer = db.prepare("SELECT id FROM users WHERE role='trainer' LIMIT 1").get();
const admin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();

// --- Extra video (platform demo) ---
const extraVideos = [
  { title: 'Platform overview (demo video)', youtube_id: 'jNQXAC9IVRw', channel: 'YouTube (demo)', language: 'en', subject: 'Digital Skills', difficulty: 'beginner', description: 'Demo video used to illustrate the embedded player. Replace with a verified statistics lesson.' },
];
for (const v of extraVideos) {
  const exists = db.prepare('SELECT id FROM videos WHERE youtube_id=? AND title=?').get(v.youtube_id, v.title);
  if (exists) continue;
  const thumb = `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  db.prepare('INSERT INTO videos(title,youtube_id,channel,language,subject,difficulty,description,thumbnail,submitted_by,status) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(v.title, v.youtube_id, v.channel, v.language, v.subject, v.difficulty, v.description, thumb, admin.id, 'approved');
}

// --- Documents about Indian government exams ---
function chunkText(text, size = 900) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) { chunks.push(cleaned.slice(i, i + size)); i += size - 120; if (i >= cleaned.length) break; }
  return chunks;
}
function addDoc(title, content, tags) {
  const exists = db.prepare('SELECT id FROM documents WHERE title=?').get(title);
  if (exists) return;
  const info = db.prepare('INSERT INTO documents(title,filename,original_name,mime_type,size,uploaded_by,status,tags) VALUES (?,?,?,?,?,?,?,?)')
    .run(title, title.replace(/[^a-z0-9]/gi,'_') + '.txt', title + '.txt', 'text/plain', content.length, trainer.id, 'approved', tags);
  const docId = info.lastInsertRowid;
  const chunks = chunkText(content);
  const insC = db.prepare('INSERT INTO document_chunks(document_id,chunk_index,content) VALUES (?,?,?)');
  const insF = db.prepare('INSERT INTO chunks_fts(content,document_id,chunk_id) VALUES (?,?,?)');
  chunks.forEach((c, idx) => { const r = insC.run(docId, idx, c); insF.run(c, docId, r.lastInsertRowid); });
  console.log('doc added:', title, chunks.length, 'chunks');
}

const docs = [
  { title: 'UPSC Civil Services Examination - Overview', tags: 'upsc,civil services,government exam', content: `
The Union Public Service Commission (UPSC) conducts the Civil Services Examination (CSE) annually to recruit candidates for the Indian Administrative Service (IAS), Indian Police Service (IPS), Indian Foreign Service (IFS) and other central services. The exam has three stages: Preliminary (objective), Main (written) and Interview (personality test).

Preliminary exam consists of two papers: General Studies Paper I and CSAT (Civil Services Aptitude Test). General Studies Paper I covers current events, history, geography, polity, economy, environment and general science. CSAT is qualifying in nature with a minimum 33% marks.

Main examination has nine papers including essay, four General Studies papers, two optional subject papers and two language papers (qualifying). The optional subjects include subjects like Public Administration, Sociology, Geography, History, Anthropology and many others.

Key statistics topics relevant to UPSC: data interpretation, basic statistics, census data, economic survey, national income accounting, price indices (CPI, WPI), and demographic indicators. Candidates must be familiar with government statistical publications like the Economic Survey, Census reports, NSSO surveys and PLFS reports.

Preparation tips: read NCERT books, follow standard reference books, practice previous year questions, take mock tests, and stay updated with current affairs through newspapers and government reports.` },
  { title: 'SSC CGL Examination - Guide', tags: 'ssc,cgl,government exam', content: `
The Staff Selection Commission Combined Graduate Level (SSC CGL) examination recruits staff for various Group B and Group C posts in ministries, departments and organisations of the Government of India. It has four tiers: Tier I (objective), Tier II (objective), Tier III (descriptive) and Tier IV (skill test/computer proficiency).

Tier I covers General Intelligence and Reasoning, General Awareness, Quantitative Aptitude and English Comprehension. Quantitative Aptitude includes arithmetic, algebra, geometry, trigonometry and data interpretation.

Tier II has papers on Quantitative Abilities, English Language, Statistics (for JSO/Statistical Investigator posts) and General Studies (Finance and Economics). The Statistics paper is crucial for candidates opting for Junior Statistical Officer posts and covers collection, classification and presentation of statistical data, measures of central tendency and dispersion, correlation and regression, probability theory, random variables, sampling theory, statistical inference, analysis of variance, time series analysis and index numbers.

Important: SSC CGL Statistics paper draws heavily from official statistical concepts including census methods, survey sampling, index numbers (CPI, WPI), and national income. Candidates should study from standard statistics textbooks and official NSSO/MoSPI publications.` },
  { title: 'IBPS Banking Examinations - Overview', tags: 'ibps,banking,government exam', content: `
The Institute of Banking Personnel Selection (IBPS) conducts examinations for recruitment to clerical and officer posts in public sector banks. Key exams include IBPS PO (Probationary Officer), IBPS Clerk, IBPS RRB (Regional Rural Banks) and IBPS SO (Specialist Officer).

The exam pattern includes Preliminary and Main examinations. Preliminary covers English Language, Quantitative Aptitude and Reasoning Ability. Main includes Reasoning, English, Quantitative Aptitude, General/Economy/Banking Awareness and Computer Aptitude.

Quantitative Aptitude topics: number series, simplification, data interpretation (tables, bar graphs, pie charts, line graphs), quadratic equations, and arithmetic (percentage, ratio, time & work, speed & distance, profit & loss, simple/compound interest).

Banking awareness includes RBI policies, monetary policy, banking terms, financial inclusion schemes (PMJDY, PMMY), and economic indicators. Statistical concepts like inflation (CPI), GDP growth, and banking statistics published by RBI are frequently tested.

Data interpretation questions are a major component and require quick calculation skills. Practice with previous year papers and mock tests is essential.` },
  { title: 'Indian Railways Recruitment - Exams Overview', tags: 'railways,rrb,government exam', content: `
Railway Recruitment Boards (RRBs) conduct examinations for various posts in Indian Railways, including RRB NTPC (Non-Technical Popular Categories), RRB Group D, RRB JE (Junior Engineer), RRB ALP (Assistant Loco Pilot) and RRB Technician.

RRB NTPC exam has two stages (CBT 1 and CBT 2) covering General Awareness, Mathematics and General Intelligence & Reasoning. Mathematics includes number system, BODMAS, decimals, fractions, LCM/HCF, ratio & proportion, percentage, mensuration, time & work, time & distance, simple & compound interest, profit & loss, statistics and data interpretation.

General Awareness covers Indian history, geography, polity, economy, general science, current affairs, and Indian Railways-specific knowledge. Basic statistical awareness (population, census, GDP, inflation) is often tested.

RRB JE exam includes a technical paper specific to the candidate's engineering discipline along with non-technical subjects. Group D exam covers basic mathematics, reasoning, general science and general awareness.

Preparation should focus on NCERT-level mathematics, regular current affairs, and practice of previous RRB papers.` },
  { title: 'General Competitive Exam - Statistics and Data Interpretation', tags: 'statistics,data interpretation,government exam', content: `
Statistics and Data Interpretation is a common section in many Indian government competitive examinations including SSC, Banking, Railways, UPSC CSAT and State PSCs.

Key topics:
1. Data Interpretation: tables, bar charts, pie charts, line graphs, caselets. Questions test ability to read, analyze and calculate from given data.
2. Measures of Central Tendency: mean, median, mode (for grouped and ungrouped data).
3. Measures of Dispersion: range, variance, standard deviation, coefficient of variation.
4. Probability: basic probability, conditional probability, Bayes theorem.
5. Permutation and Combination: factorial, nPr, nCr.
6. Index Numbers: price index, quantity index, CPI, WPI, Laspeyres, Paasche, Fisher indices.
7. Time Series: trend, seasonal variation, moving averages.
8. Sampling: simple random, stratified, systematic sampling.

Common question types: finding missing values, calculating averages, percentage change, ratio analysis, and trend identification. Speed and accuracy are critical; practice mental math and shortcut techniques.

Official sources for data: Census of India, NSSO surveys, Economic Survey, RBI Handbook of Statistics, and MoSPI publications.` }
];

for (const d of docs) addDoc(d.title, d.content, d.tags);

// --- Quizzes on government exams ---
const quizzes = [
  { title: 'UPSC & Government Exams - General Awareness Quiz', topic: 'Government Exams', difficulty: 'medium', questions: [
    { question: 'Which commission conducts the Civil Services Examination in India?', options: ['UPSC','SSC','IBPS','RRB'], correct_index: 0, explanation: 'UPSC conducts the Civil Services Examination.', competency_key: 'reporting' },
    { question: 'What are the three stages of the UPSC Civil Services Examination?', options: ['Prelims, Mains, Interview','Tier 1, Tier 2, Tier 3','Prelims, Mains, Skill Test','Written, Oral, Practical'], correct_index: 0, explanation: 'Preliminary, Main and Interview (personality test).', competency_key: 'reporting' },
    { question: 'Which index measures retail inflation in India?', options: ['CPI','WPI','IIP','GDP'], correct_index: 0, explanation: 'Consumer Price Index (CPI) measures retail inflation.', competency_key: 'statistics' },
    { question: 'NSSO stands for:', options: ['National Sample Survey Office','National Statistical Survey Organisation','National Social Survey Office','National Sample Statistics Office'], correct_index: 0, explanation: 'National Sample Survey Office.', competency_key: 'survey_methods' },
    { question: 'Which body publishes the Economic Survey of India?', options: ['Ministry of Finance','RBI','NITI Aayog','MoSPI'], correct_index: 0, explanation: 'Economic Survey is published by the Ministry of Finance.', competency_key: 'reporting' }
  ]},
  { title: 'Statistics & Data Interpretation Quiz', topic: 'Statistics', difficulty: 'medium', questions: [
    { question: 'Mean of 2, 4, 6, 8, 10 is:', options: ['6','5','7','8'], correct_index: 0, explanation: 'Sum=30, n=5, mean=6.', competency_key: 'statistics' },
    { question: 'Which measure is most affected by extreme values?', options: ['Mean','Median','Mode','None'], correct_index: 0, explanation: 'Mean is sensitive to outliers.', competency_key: 'statistics' },
    { question: 'CPI stands for:', options: ['Consumer Price Index','Central Price Index','Cost of Production Index','Composite Price Index'], correct_index: 0, explanation: 'Consumer Price Index.', competency_key: 'statistics' },
    { question: 'Probability of an impossible event is:', options: ['0','1','0.5','undefined'], correct_index: 0, explanation: 'Probability ranges 0 to 1; impossible event = 0.', competency_key: 'data_analysis' },
    { question: 'Standard deviation measures:', options: ['Dispersion','Central tendency','Skewness','Correlation'], correct_index: 0, explanation: 'Standard deviation measures spread/dispersion.', competency_key: 'data_analysis' }
  ]},
  { title: 'Banking Awareness Quiz', topic: 'Banking', difficulty: 'easy', questions: [
    { question: 'RBI stands for:', options: ['Reserve Bank of India','Regional Bank of India','Rural Bank of India','Royal Bank of India'], correct_index: 0, explanation: 'Reserve Bank of India.', competency_key: 'reporting' },
    { question: 'Which scheme promotes financial inclusion for all households?', options: ['PMJDY','PMMY','PMAY','PMKVY'], correct_index: 0, explanation: 'Pradhan Mantri Jan Dhan Yojana (PMJDY).', competency_key: 'digital_tools' },
    { question: 'Repo rate is the rate at which:', options: ['RBI lends to commercial banks','Banks lend to RBI','Banks lend to public','Government borrows from RBI'], correct_index: 0, explanation: 'Repo rate = RBI lending rate to banks.', competency_key: 'reporting' },
    { question: 'NABARD is associated with:', options: ['Rural development','Urban development','Industrial development','Export promotion'], correct_index: 0, explanation: 'National Bank for Agriculture and Rural Development.', competency_key: 'reporting' },
    { question: 'Which of these is a public sector bank?', options: ['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank'], correct_index: 0, explanation: 'SBI is a public sector bank.', competency_key: 'digital_tools' }
  ]}
];

for (const q of quizzes) {
  const exists = db.prepare('SELECT id FROM quizzes WHERE title=?').get(q.title);
  if (exists) continue;
  const info = db.prepare('INSERT INTO quizzes(title,description,created_by,topic,difficulty,status) VALUES (?,?,?,?,?,?)')
    .run(q.title, 'Auto-seeded quiz on ' + q.topic, trainer.id, q.topic, q.difficulty, 'approved');
  const qid = info.lastInsertRowid;
  for (const qu of q.questions) {
    db.prepare('INSERT INTO questions(quiz_id,question_text,options,correct_index,explanation,competency_key) VALUES (?,?,?,?,?,?)')
      .run(qid, qu.question, JSON.stringify(qu.options), qu.correct_index, qu.explanation, qu.competency_key);
  }
  console.log('quiz added:', q.title);
}

console.log('Extra seed complete.');