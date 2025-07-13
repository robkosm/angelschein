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
echo ""
echo "You can now start the server with: npm start" 