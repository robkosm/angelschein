#!/bin/bash

# Database setup script for Angelschein Quiz App
# This script initializes the LowDB with sample questions and proper schema

echo "Setting up database for Angelschein Quiz App..."

# Create db directory if it doesn't exist
mkdir -p db

# Create initial database structure with empty schema
cat > db/db.json << 'EOF'
{
  "questions": [],
  "user_progress": []
}
EOF

echo "Database initialized with empty schema!"
echo "Schema created:"
echo "  - questions: Array of fishing license questions"
echo "  - user_progress: Array for SRS progress tracking"

# Check if parsed questions exist and import them
if [ -f "data/parsed-questions.json" ]; then
    echo ""
    echo "Found parsed questions, importing to database..."
    node import-questions.js
    echo "Questions imported successfully!"
else
    echo ""
    echo "No parsed questions found at data/parsed-questions.json"
    echo "Run the parsing script first: node final-parse-questions.js"
fi

echo ""
echo "You can now start the server with: npm start" 