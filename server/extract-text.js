import fs from 'fs';
import pdf from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

// Polyfills for Node.js environment
if (typeof DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(matrix) {
      if (matrix) {
        this.a = matrix.a || 1;
        this.b = matrix.b || 0;
        this.c = matrix.c || 0;
        this.d = matrix.d || 1;
        this.e = matrix.e || 0;
        this.f = matrix.f || 0;
      } else {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
    }
  };
}

if (typeof ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

if (typeof Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {
      // Simple polyfill
    }
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PDFTextExtractor {
  constructor(pdfPath, outputPath) {
    this.pdfPath = pdfPath;
    this.outputPath = outputPath;
  }

  async extractTextFromPDF() {
    const pdfBuffer = fs.readFileSync(this.pdfPath);
    const data = await pdf(pdfBuffer);
    return data.text;
  }

  cleanText(text) {
    // Remove page headers, footers, and corrupted text
    return text
      .replace(/Seite \d+ von \d+/g, '') // Remove page numbers
      .replace(/\$ QWZRUW\s*\$/g, '') // Remove corrupted text
      .replace(/6WDQG/g, '') // Remove other corrupted text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  extractQuestions(text) {
    const cleanedText = this.cleanText(text);
    
    // Roman numerals to look for
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    
    // Find all question patterns
    const questionPattern = new RegExp(`\\s(${romanNumerals.join('|')})\\s+\\d+\\s+\\d+\\s+\\d+\\s+`, 'g');
    const matches = [];
    let match;
    
    while ((match = questionPattern.exec(cleanedText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        fullMatch: match[0],
        numeral: match[1]
      });
    }
    
    // Extract questions and remove duplicates
    const questions = new Map(); // Use Map to track unique questions by their identifier
    
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      
      const questionStart = currentMatch.start;
      const questionEnd = nextMatch ? nextMatch.start : cleanedText.length;
      const questionText = cleanedText.substring(questionStart, questionEnd).trim();
      
      if (questionText && questionText.length > 10) { // Minimum length to avoid fragments
        // Extract question identifier (e.g., "I 1 1 1")
        const identifierMatch = questionText.match(/^([IVX]+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (identifierMatch) {
          const identifier = identifierMatch.slice(1).join(' ');
          
          // Keep the longest/most complete version of each question
          if (!questions.has(identifier) || questions.get(identifier).length < questionText.length) {
            questions.set(identifier, questionText);
          }
        }
      }
    }
    
    return Array.from(questions.values());
  }

  formatQuestionLine(questionText) {
    // Ensure proper spacing: three spaces between question and answers
    let formatted = questionText;
    
    // Find the question mark and ensure proper spacing after it
    const questionMarkIndex = formatted.indexOf('?');
    if (questionMarkIndex !== -1) {
      const beforeQuestion = formatted.substring(0, questionMarkIndex + 1);
      const afterQuestion = formatted.substring(questionMarkIndex + 1);
      
      // Remove extra spaces and ensure exactly three spaces
      const cleanedAfter = afterQuestion.replace(/^\s+/, '   ');
      formatted = beforeQuestion + cleanedAfter;
    }
    
    // Ensure three spaces between multiple choice answers
    formatted = formatted.replace(/\s{2,}/g, '   ');
    
    return formatted;
  }

  async extractAndSave() {
    try {
      console.log('Starting PDF text extraction...');
      
      // Extract text from PDF
      const extractedText = await this.extractTextFromPDF();
      console.log(`Extracted ${extractedText.length} characters from PDF`);
      
      // Debug: Save raw text first
      const rawOutputPath = join(__dirname, 'data', 'raw-extracted-text.txt');
      fs.writeFileSync(rawOutputPath, extractedText, 'utf8');
      console.log(`Raw text saved to: ${rawOutputPath}`);
      
      // Show first 500 characters for debugging
      console.log('First 500 characters of extracted text:');
      console.log(extractedText.substring(0, 500));
      
      // Extract and clean questions
      const questions = this.extractQuestions(extractedText);
      console.log(`Found ${questions.length} unique questions`);
      
      // Format each question line
      const formattedQuestions = questions.map(q => this.formatQuestionLine(q));
      
      // Join all questions with newlines
      const processedText = formattedQuestions.join('\n');
      
      // Save to file
      fs.writeFileSync(this.outputPath, processedText, 'utf8');
      console.log(`Text saved to: ${this.outputPath}`);
      
      return {
        success: true,
        textLength: processedText.length,
        questionLines: questions.length,
        outputPath: this.outputPath
      };
      
    } catch (error) {
      console.error('Error during text extraction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

async function main() {
  try {
    const pdfPath = join(__dirname, 'data', 'pruefungsfragen.pdf');
    const outputPath = join(__dirname, 'data', 'extracted-text.txt');
    
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    // Ensure data directory exists
    const dataDir = join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const extractor = new PDFTextExtractor(pdfPath, outputPath);
    const result = await extractor.extractAndSave();
    
    if (result.success) {
      console.log('\n✅ Text extraction completed successfully!');
      console.log(`📁 Text saved to: ${result.outputPath}`);
      console.log(`📊 Extracted ${result.textLength} characters`);
      console.log(`📝 Processed into ${result.questionLines} unique question lines`);
    } else {
      console.error('\n❌ Text extraction failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the extraction if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PDFTextExtractor }; 