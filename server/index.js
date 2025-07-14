import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Set up DB with default data
const adapter = new JSONFile('db/db.json');
const defaultData = { questions: [], user_progress: [] };
const db = new Low(adapter, defaultData);
await db.read();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// SRS levels with weights (higher level = less likely to appear)
const LEVEL_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05];

function calculateSuccessRate(consecutiveCorrect, totalAttempts) {
    if (totalAttempts === 0) return 0;
    return consecutiveCorrect / totalAttempts;
}

function getOrCreateProgress(userId, questionId) {
    let progress = db.data.user_progress.find(p => p.user_id === userId && p.question_id === parseInt(questionId));
    
    if (!progress) {
        progress = {
            user_id: userId,
            question_id: questionId,
            level: 0,
            consecutive_correct: 0,
            consecutive_incorrect: 0,
            total_attempts: 0,
            last_reviewed: null,
            created_at: new Date().toISOString()
        };
        db.data.user_progress.push(progress);
    }
    
    return progress;
}

function selectRandomQuestion(userId, excludeQuestionId = null) {
    const userProgress = db.data.user_progress.filter(p => p.user_id === userId);
    
    // Create weighted selection pool
    const selectionPool = [];
    
    userProgress.forEach(progress => {
        if (excludeQuestionId && progress.question_id === parseInt(excludeQuestionId)) return;
        
        const weight = LEVEL_WEIGHTS[Math.min(progress.level, LEVEL_WEIGHTS.length - 1)];
        const question = db.data.questions.find(q => q.id === progress.question_id);
        
        if (question) {
            // Add question multiple times based on weight (inverse relationship)
            const repetitions = Math.max(1, Math.floor(1 / weight));
            for (let i = 0; i < repetitions; i++) {
                selectionPool.push({
                    ...progress,
                    question: question
                });
            }
        }
    });
    
    // Add new questions (level 0) with high weight
    const newQuestions = db.data.questions.filter(q => 
        !userProgress.some(p => p.question_id === parseInt(q.id))
    );
    
    newQuestions.forEach(question => {
        for (let i = 0; i < 10; i++) { // High weight for new questions
            selectionPool.push({
                user_id: userId,
                question_id: question.id,
                level: 0,
                consecutive_correct: 0,
                consecutive_incorrect: 0,
                total_attempts: 0,
                last_reviewed: null,
                created_at: new Date().toISOString(),
                question: question
            });
        }
    });
    
    if (selectionPool.length === 0) return null;
    
    // Random selection from weighted pool
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    return selectionPool[randomIndex];
}

// Routes
app.get('/api/questions', (req, res) => {
    res.json(db.data.questions);
});

app.get('/api/questions/:id', (req, res) => {
    const question = db.data.questions.find(q => q.id === parseInt(req.params.id));
    if (question) {
        res.json(question);
    } else {
        res.status(404).json({ error: 'Question not found' });
    }
});

app.get('/api/quiz/next/:userId', (req, res) => {
    const userId = req.params.userId;
    const excludeId = req.query.exclude ? parseInt(req.query.exclude) : null;
    
    const nextQuestion = selectRandomQuestion(userId, excludeId);
    
    if (nextQuestion) {
        res.json(nextQuestion);
    } else {
        res.status(404).json({ error: 'No questions available' });
    }
});

app.get('/api/quiz/progress/:userId', (req, res) => {
    const userId = req.params.userId;
    const progress = db.data.user_progress
        .filter(p => p.user_id === userId)
        .map(p => {
            const question = db.data.questions.find(q => q.id === parseInt(p.question_id));
            return {
                ...p,
                question: question,
                success_rate: calculateSuccessRate(p.consecutive_correct, p.total_attempts)
            };
        });
    res.json(progress);
});

app.get('/api/quiz/stats/:userId', (req, res) => {
    const userId = req.params.userId;
    const progress = db.data.user_progress.filter(p => p.user_id === userId);
    
    // Count questions by level
    const levelStats = {};
    for (let i = 0; i <= 6; i++) {
        levelStats[i] = progress.filter(p => p.level === i).length;
    }
    
    // Add unanswered questions to level 0
    const answeredQuestionIds = progress.map(p => p.question_id);
    const unansweredQuestions = db.data.questions.filter(q => !answeredQuestionIds.includes(parseInt(q.id)));
    levelStats[0] += unansweredQuestions.length;
    
    // Calculate overall stats
    const totalQuestions = db.data.questions.length; // All questions, not just answered ones
    const totalAttempts = progress.reduce((sum, p) => sum + p.total_attempts, 0);
    const averageLevel = progress.length > 0 ? progress.reduce((sum, p) => sum + p.level, 0) / progress.length : 0;
    
    res.json({
        levelStats,
        totalQuestions,
        totalAttempts,
        averageLevel: Math.round(averageLevel * 100) / 100
    });
});

app.post('/api/questions', async (req, res) => {
    const { question, answers, category } = req.body;
    const newQuestion = { 
        id: Date.now(), 
        question, 
        answers, 
        category 
    };
    db.data.questions.push(newQuestion);
    await db.write();
    res.json({ success: true, question: newQuestion });
});

app.post('/api/quiz/submit', async (req, res) => {
    const { userId, questionId, selectedAnswerId } = req.body;
    const question = db.data.questions.find(q => q.id === parseInt(questionId));
    
    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }
    
    const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
    const isCorrect = selectedAnswer ? selectedAnswer.correct : false;
    
    // Update SRS progress
    const progress = getOrCreateProgress(userId, questionId);
    progress.total_attempts += 1;
    progress.last_reviewed = new Date().toISOString();
    
    if (isCorrect) {
        progress.consecutive_correct += 1;
        progress.consecutive_incorrect = 0;
        
        // Level up based on consecutive correct answers
        if (progress.consecutive_correct >= 3) {
            progress.level = Math.min(6, progress.level + 1);
            progress.consecutive_correct = 0; // Reset for next level
        }
    } else {
        progress.consecutive_incorrect += 1;
        progress.consecutive_correct = 0;
        
        // Level down on mistakes
        if (progress.consecutive_incorrect >= 2) {
            progress.level = Math.max(0, progress.level - 1);
            progress.consecutive_incorrect = 0; // Reset
        }
    }
    
    await db.write();
    
    res.json({ 
        success: true, 
        isCorrect,
        correctAnswer: question.answers.find(a => a.correct),
        progress: {
            level: progress.level,
            consecutive_correct: progress.consecutive_correct,
            consecutive_incorrect: progress.consecutive_incorrect,
            total_attempts: progress.total_attempts,
            success_rate: calculateSuccessRate(progress.consecutive_correct, progress.total_attempts)
        }
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
