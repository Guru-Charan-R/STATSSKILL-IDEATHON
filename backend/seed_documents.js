// Inline test documents for the Document Library and RAG. Self-contained so it
// works on Vercel serverless, where uploaded files are not part of the build.
require('dotenv').config();
const db = require('./src/db');

const admin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
const trainer = db.prepare("SELECT id FROM users WHERE role='trainer' LIMIT 1").get();
const owner = admin || trainer;
if (!owner) throw new Error('No admin/trainer user found. Run node seed.js first.');

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

const docs = [
  {
    title: 'Descriptive Statistics - Worked Examples',
    tags: 'descriptive statistics,mean,median,mode,test document',
    content: `
Descriptive statistics summarise and describe the main features of a data set in a quantitative way. The three common measures of central tendency are the mean, median and mode.

The arithmetic mean is the sum of all observations divided by the number of observations. For the data 4, 8, 6, 10, 12 the mean is (4+8+6+10+12)/5 = 40/5 = 8.

The median is the middle value when observations are arranged in order. For 4, 6, 8, 10, 12 the median is 8. If there is an even number of observations, the median is the average of the two middle values.

The mode is the value that occurs most often. For 3, 5, 5, 7, 9 the mode is 5. A data set can have no mode, one mode, or several modes.

Measures of dispersion describe the spread of the data. The range is the largest value minus the smallest value. Variance is the average of the squared deviations from the mean, and the standard deviation is the square root of the variance. A small standard deviation means values are close to the mean; a large one means they are spread out.

Worked example: find the mean and standard deviation of 2, 4, 4, 4, 5, 5, 7, 9. The mean is 40/8 = 5. The squared deviations are 9, 1, 1, 1, 0, 0, 4, 16, which sum to 32. Population variance is 32/8 = 4, so the standard deviation is 2.

In official statistics, these measures are used in census reports, labour force surveys and economic surveys to summarise income, expenditure, age and other indicators.`
  },
  {
    title: 'Probability Fundamentals - Test Notes',
    tags: 'probability,bayes,conditional probability,test document',
    content: `
Probability measures the likelihood of an event occurring and always lies between 0 and 1. An impossible event has probability 0 and a certain event has probability 1.

The classical definition states that if all outcomes are equally likely, the probability of an event A is the number of favourable outcomes divided by the total number of outcomes. For a fair die, the probability of rolling an even number is 3/6 = 0.5.

The addition rule: P(A or B) = P(A) + P(B) - P(A and B). The multiplication rule for independent events: P(A and B) = P(A) x P(B).

Conditional probability is written P(A|B), the probability of A given that B has occurred. P(A|B) = P(A and B) / P(B), provided P(B) is greater than zero.

Bayes theorem relates conditional probabilities: P(A|B) = P(B|A) x P(A) / P(B). It is widely used in statistical inference and decision making.

Worked example: a bag contains 5 red and 3 blue balls. Two balls are drawn without replacement. The probability that both are red is (5/8) x (4/7) = 20/56 = 5/14.

Common mistakes include assuming events are independent when they are not, and forgetting to subtract the intersection in the addition rule. Practice these concepts with previous-year question papers for SSC CGL Statistics, UPSC CSAT and banking exams.`
  },
  {
    title: 'Sampling Methods for Official Statistics',
    tags: 'sampling,survey methods,nss,census,test document',
    content: `
Sampling is the process of selecting a subset of individuals from a population to estimate characteristics of the whole population. It is far cheaper and faster than a complete enumeration, and is the backbone of official surveys such as those conducted by NSSO and MoSPI.

Simple random sampling gives every unit an equal chance of selection. Stratified random sampling divides the population into homogeneous groups (strata) and samples from each, improving precision when strata differ substantially.

Systematic sampling selects every kth unit from an ordered list. Cluster sampling selects whole groups, such as villages or urban blocks, and is useful when a complete list of units is unavailable.

The sampling error measures how much a survey estimate may differ from the true population value. It decreases as the sample size increases. Non-sampling errors include measurement errors, non-response and coverage errors, and these do not automatically decrease with larger samples.

Design weight is the inverse of the probability of selection. It is used to scale sample results back to population totals. In stratified sampling, weights differ across strata.

Example: to estimate average monthly expenditure of households in a district, a statistician stratifies by rural and urban areas, draws a random sample from each, and applies separate weights before computing the overall mean.

Good survey design requires a clear sampling frame, an appropriate method, adequate sample size, and careful documentation of weights and non-response.`
  },
  {
    title: 'Index Numbers - CPI, WPI and Worked Problems',
    tags: 'index numbers,cpi,wpi,inflation,test document',
    content: `
An index number is a statistical measure that shows changes in a variable or a group of related variables over time. Index numbers are commonly used to measure inflation, production and price changes.

A price index compares the cost of a fixed basket of goods in the current period with the cost in a base period. The base period is usually assigned an index value of 100.

The Consumer Price Index (CPI) measures the change in prices of a basket of goods and services consumed by households. It is the primary measure of retail inflation in India and is published by the National Statistical Office.

The Wholesale Price Index (WPI) measures the price change of goods at the wholesale level, excluding most services. It reflects producer-level price movements.

Laspeyres index uses base-period quantities as weights, Paasche index uses current-period quantities, and Fisher index is the geometric mean of the two. Fisher index is often preferred because it satisfies more desirable tests.

Worked example: if the cost of a basket was Rs 200 in the base year and Rs 260 in the current year, the index number is (260/200) x 100 = 130, indicating a 30 percent increase in price level.

Index numbers are used in wage negotiations, inflation targeting, deflation of nominal values and economic policy. They are a core topic for SSC CGL Statistics and other government examinations.`
  },
  {
    title: 'Data Interpretation Practice Set',
    tags: 'data interpretation,charts,tables,test document',
    content: `
Data interpretation questions present information in tables, bar charts, pie charts, line graphs or caselets and ask you to analyse and calculate from it.

A table organises data in rows and columns. Always read the units and headings carefully before calculating. A bar chart compares quantities using rectangular bars; a pie chart shows parts of a whole as angles or percentages; a line graph shows trends over time.

Useful shortcuts: percentage change = (new - old) / old x 100. Average = total / number of items. Ratio comparisons are often faster by cross-multiplication. Approximate first, then calculate precisely only if needed.

Worked example: a table shows exports of 120, 150, 180 and 210 crore rupees over four years. The average export is (120+150+180+210)/4 = 660/4 = 165 crore. The percentage growth from year 1 to year 4 is (210-120)/120 x 100 = 75 percent.

In a pie chart, an angle of 90 degrees represents 25 percent of the total, because 90/360 = 0.25.

Common traps include misreading the scale, forgetting that percentages in a pie chart must sum to 100, and confusing percentage point changes with percentage changes.

Regular practice with previous-year papers is the best way to improve speed and accuracy for SSC, banking, railways and UPSC CSAT data interpretation sections.`
  }
];

const insertDoc = db.prepare('INSERT INTO documents(title,filename,original_name,mime_type,size,uploaded_by,status,tags) VALUES (?,?,?,?,?,?,?,?)');
const insertChunk = db.prepare('INSERT INTO document_chunks(document_id,chunk_index,content) VALUES (?,?,?)');
const insertFts = db.prepare('INSERT INTO chunks_fts(content,document_id,chunk_id) VALUES (?,?,?)');

let added = 0;
for (const d of docs) {
  if (db.prepare('SELECT id FROM documents WHERE title=?').get(d.title)) continue;
  const filename = d.title.replace(/[^a-z0-9]/gi, '_') + '.txt';
  const info = insertDoc.run(d.title, filename, d.title + '.txt', 'text/plain', Buffer.byteLength(d.content), owner.id, 'approved', d.tags);
  const id = info.lastInsertRowid;
  const chunks = chunkText(d.content);
  chunks.forEach((chunk, idx) => {
    const r = insertChunk.run(id, idx, chunk);
    insertFts.run(chunk, id, r.lastInsertRowid);
  });
  added++;
  console.log('document added:', d.title, '(', chunks.length, 'chunks )');
}
console.log('Test documents seed complete. added:', added);
