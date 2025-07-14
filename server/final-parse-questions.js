import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FinalQuestionParser {
  constructor(inputPath, outputPath) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.questions = [];
  }

  async parseQuestions() {
    try {
      console.log('Starting final question parsing...');
      
      // Read the extracted text
      const extractedText = fs.readFileSync(this.inputPath, 'utf8');
      console.log(`Read ${extractedText.length} characters from text file`);
      
      // Parse questions from text
      const questions = this.parseQuestionsFromText(extractedText);
      console.log(`Parsed ${questions.length} questions`);
      
      // Validate questions
      const validQuestions = questions.filter(question => this.validateQuestion(question));
      console.log(`${validQuestions.length} valid questions after validation`);
      
      // Save questions
      await this.saveQuestions(validQuestions);
      
      return {
        success: true,
        totalQuestions: validQuestions.length,
        outputPath: this.outputPath
      };
      
    } catch (error) {
      console.error('Error during question parsing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseQuestionsFromText(text) {
    // Clean and normalize the text
    const cleanText = text.trim();
    const questions = [];
    
    // Split the text by lines since each line now contains one question
    const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`Processing ${lines.length} question lines...`);
    
    for (const line of lines) {
      const question = this.parseQuestionFromLine(line);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  parseQuestionFromLine(line) {
    try {
      // Split the line by three spaces to get the question parts
      const parts = line.split('   ');
      
      if (parts.length < 8) {
        console.log(`Skipping line with insufficient parts: ${parts.length} parts`);
        return null;
      }

      // Extract the components
      const subject = parts[0]; // Roman numeral (I, II, III, etc.)
      const questionId = parts[3];
      const questionText = parts[4];
      const answerA = parts[5];
      const answerB = parts[6];
      const answerC = parts[7];

      // Validate that we have all required parts
      if (!questionId || !questionText || !answerA || !answerB || !answerC) {
        console.log(`Skipping line with missing parts: ${line.substring(0, 100)}...`);
        return null;
      }

      return this.createQuestionObject(
        parseInt(questionId),
        questionText.trim(),
        answerA.trim(),
        answerB.trim(),
        answerC.trim(),
        subject
      );
      
    } catch (error) {
      console.log(`Error parsing line: ${error.message}`);
      return null;
    }
  }

  createQuestionObject(questionId, questionText, answerA, answerB, answerC, subject) {
    // Determine category based on keywords and subject
    const category = this.categorizeQuestion(questionText, subject);
    
    // For now, assume the first answer is correct (this might need adjustment based on your PDF structure)
    const correctAnswerId = 'a';

    // Clean up the answers with correct field
    const answers = [
      { id: 'a', text: answerA, correct: correctAnswerId === 'a' },
      { id: 'b', text: answerB, correct: correctAnswerId === 'b' },
      { id: 'c', text: answerC, correct: correctAnswerId === 'c' }
    ];

    return {
      id: questionId,
        question: questionText,
        category: category,
        subject: subject, // Save the roman numeral
        answers: answers,
      level: this.determineDifficultyLevel(questionText, answers),
      total_attempts: 0
    };
  }

  categorizeQuestion(questionText, subject) {
    // Subject-based categorization
    const subjectCategories = {
      'I': 'Fischkunde und -hege',
      'II': 'Pflege der Fischgewässer',
      'III': 'Fanggeräte und deren Gebrauch', 
      'IV': 'Behandlung der gefangenen Fische',
      'V': 'Einschlägige Rechtsvorschriften'
    };

    // Use subject-based category if available
    if (subjectCategories[subject]) {
      return subjectCategories[subject];
    }

    // Fallback to keyword-based categorization
    const categories = {
      'Verkehrszeichen': ['zeichen', 'schild', 'signal', 'verkehrszeichen'],
      'Vorfahrt': ['vorfahrt', 'vorrang', 'rechts vor links'],
      'Geschwindigkeit': ['geschwindigkeit', 'tempo', 'kmh', 'km/h'],
      'Parken': ['parken', 'halten', 'parkplatz', 'parkverbot'],
      'Verhalten': ['verhalten', 'fahrweise', 'reaktion'],
      'Technik': ['motor', 'bremsen', 'reifen', 'technik', 'wartung'],
      'Umwelt': ['umwelt', 'emission', 'kraftstoff', 'verbrauch'],
      'Recht': ['recht', 'gesetz', 'strafe', 'bußgeld', 'versicherung']
    };

    const lowerQuestionText = questionText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerQuestionText.includes(keyword))) {
        return category;
      }
    }
    
    return 'Allgemein';
  }

  determineDifficultyLevel(questionText, answers) {
    // Simple difficulty assessment based on question length and complexity
    const questionLength = questionText.length;
    const avgAnswerLength = answers.reduce((sum, ans) => sum + ans.text.length, 0) / answers.length;
    
    if (questionLength > 100 || avgAnswerLength > 50) {
      return 3; // Hard
    } else if (questionLength > 50 || avgAnswerLength > 25) {
      return 2; // Medium
    } else {
      return 1; // Easy
    }
  }

  validateQuestion(question) {
    // Basic validation checks
    if (!question.id || !question.question) {
      return false;
    }
    
    if (!question.question || question.question.trim().length === 0) {
      return false;
    }
    
    if (!question.answers || question.answers.length !== 3) {
      return false;
    }
    
    // Check that all answers have text and correct field
    for (const answer of question.answers) {
      if (!answer.text || answer.text.trim().length === 0) {
        return false;
      }
      if (typeof answer.correct !== 'boolean') {
        return false;
      }
    }
    
    return true;
  }

  async saveQuestions(questions) {
    try {
      // Create output directory if it doesn't exist
      const outputDir = dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save questions to JSON file
      fs.writeFileSync(this.outputPath, JSON.stringify(questions, null, 2), 'utf8');
      console.log(`Questions saved to: ${this.outputPath}`);
      
      // Generate summary
      this.generateSummary(questions);
      
    } catch (error) {
      console.error('Error saving questions:', error);
      throw error;
    }
  }

  generateSummary(questions) {
    const summary = {
      total_questions: questions.length,
      categories: this.getCategorySummary(questions),
      subjects: this.getSubjectSummary(questions),
      difficulty_levels: this.getDifficultyLevelSummary(questions),
      generated_at: new Date().toISOString()
    };
    
    const summaryPath = join(dirname(this.outputPath), 'parsed-questions-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Summary saved to: ${summaryPath}`);
  }

  getCategorySummary(questions) {
    const categories = {};
    questions.forEach(q => {
      const category = q.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  getSubjectSummary(questions) {
    const subjects = {};
    questions.forEach(q => {
      const subject = q.subject;
      subjects[subject] = (subjects[subject] || 0) + 1;
    });
    return subjects;
  }

  getDifficultyLevelSummary(questions) {
    const levels = {};
    questions.forEach(q => {
      const level = q.level;
      levels[level] = (levels[level] || 0) + 1;
    });
    return levels;
  }
}

async function main() {
  // Use the existing extracted text file
    const inputPath = join(__dirname, 'data', 'extracted-text_joined.txt');
    const outputPath = join(__dirname, 'data', 'parsed-questions.json');
  
  console.log('Starting final question parsing...');
  console.log(`Input path: ${inputPath}`);
  console.log(`Output path: ${outputPath}`);
  
  const parser = new FinalQuestionParser(inputPath, outputPath);
  
  try {
    const result = await parser.parseQuestions();
    console.log('Parsing completed successfully!');
    console.log(`Total questions parsed: ${result.totalQuestions}`);
    console.log(`Output saved to: ${result.outputPath}`);
  } catch (error) {
    console.error('Error during parsing:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default FinalQuestionParser; 