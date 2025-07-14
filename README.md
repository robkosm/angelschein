# Angelschein - Fishing License Quiz App

A web application to help users prepare for their fishing license exam (Angelschein) in Brandenburg Germany.

Official exam questions can be found at: [FischereischeinTEST Brandenburg](https://fischereischeintest.brandenburg.de/)

## Quick Setup

### Prerequisites

- Node.js (v20 or higher)

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd angelschein
   ```

2. Install server dependencies

   ```bash
   cd server
   npm install
   ```

3. Install client dependencies

   ```bash
   cd ../client
   npm install
   ```

4. Start the development servers

   Server (terminal 1):

   ```bash
   cd server
   npm run dev
   ```

   Client (terminal 2):

   ```bash
   cd client
   npm run dev
   ```

5. Access the application
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## PDF Question Extraction

The application includes a PDF text extraction tool that processes the official Brandenburg fishing license exam questions. This uses Node.js packages and doesn't require any external system dependencies.

### Available Scripts

- `extract-text.js` - Extracts text from PDF files using Node.js pdf-parse library
- `final-parse-questions.js` - Parses extracted text into structured question format
- `import-questions.js` - Imports parsed questions into the database

### Usage

1. Place your PDF file in the `server/data/` directory
2. Run the extraction and parsing:
   ```bash
   cd server
   node extract-text.js
   node final-parse-questions.js
   ```
3. Set up the database with parsed questions:
   ```bash
   ./db-setup.sh
   ```
