import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'node:fs';
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
// extract english dict object from SettingsContext by reading file
const src = fs.readFileSync('../frontend/src/context/SettingsContext.jsx','utf8');
const m = src.match(/en: (\{[^}]*\})/);
// fallback: read keys from a provided json
const keys = process.argv.slice(2);
const enObj = {
 home:'Home',about:'About',features:'Features',videos:'Video Library',courses:'Courses',documents:'Documents',quizzes:'Quizzes',dashboard:'Dashboard',login:'Login',register:'Register',logout:'Logout',
 chatWelcome:'Welcome! I am StatSkill AI. Ask me about statistics, data analysis, sampling, surveys, CPI, PLFS and more.',
 chatPlaceholder:'Ask StatSkill AI...',chatTitle:'StatSkill AI Assistant',chatSubtitle:'Ask about statistics, data, surveys...',
 loginTitle:'Login',loginSubtitle:'Access your StatSkill AI dashboard.',demoAccounts:'Demo accounts:',noAccount:'No account?',haveAccount:'Already have an account?',
 registerTitle:'Register',registerSubtitle:'Create a trainee or trainer account.',
 documentsTitle:'Document Library',uploadDoc:'Upload document',askDoc:'Ask the document (RAG)',askBtn:'Ask',noDocs:'No documents yet.',
 quizzesTitle:'Quizzes',genMcq:'Generate MCQs with AI (Groq)',availableQuizzes:'Available quizzes',noQuizzes:'No quizzes yet.',
 coursesTitle:'Courses',noCourses:'No courses yet.',videosTitle:'Video Library',noVideos:'No videos found.',submitVideo:'Submit a YouTube video',
 aboutTitle:'About StatSkill AI',featuresTitle:'Features',profileTitle:'Profile',notFound:'Page not found',goHome:'Go home',
 traineeDashboard:'Trainee Dashboard',adminDashboard:'Admin Dashboard',trainerDashboard:'Trainer Dashboard',welcome:'Welcome',
 competencyScores:'Competency scores',recommendedFocus:'Recommended focus areas',courseProgress:'My course progress',recentAttempts:'Recent quiz attempts',
 noGaps:'No gaps detected. Great job!',noCoursesEnrolled:'No courses enrolled yet.',noAttempts:'No attempts yet.',
 users:'Users',pendingVideoApprovals:'Pending video approvals',pendingQuizApprovals:'Pending quiz approvals',orgGaps:'Organisation competency gaps',
 myBatches:'My batches',quickActions:'Quick actions',batchGaps:'Batch competency gaps (overview)',myQuizzes:'My quizzes',noBatches:'No batches assigned.',none:'None.'
};
const target = process.argv[2] || 'ta';
const langName = { hi:'Hindi', ta:'Tamil', te:'Telugu', ml:'Malayalam' }[target];
const completion = await client.chat.completions.create({
  model: process.env.GROQ_MODEL,
  messages: [
    { role:'system', content: `Translate the values of this JSON object to ${langName}. Keep keys unchanged. Return ONLY valid JSON, no markdown.` },
    { role:'user', content: JSON.stringify(enObj) }
  ],
  temperature: 0.2,
  max_tokens: 4000
});
const out = completion.choices[0].message.content.replace(/```json|```/g,'').trim();
fs.writeFileSync(`../frontend/src/i18n_${target}.json`, out);
console.log('done', target);