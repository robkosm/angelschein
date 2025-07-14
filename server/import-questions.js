import fs from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Load parsed questions
const parsedQuestions = JSON.parse(fs.readFileSync('data/parsed-questions.json', 'utf8'));

// Load database
const adapter = new JSONFile('db/db.json');
const defaultData = { questions: [], user_progress: [] };
const db = new Low(adapter, defaultData);
await db.read();

// Add questions to database
db.data.questions.push(...parsedQuestions);

// Save database
await db.write();

console.log(`Imported ${parsedQuestions.length} questions into database`);
console.log(`Total questions in database: ${db.data.questions.length}`); 