#!/bin/bash

echo "⏳ Updating dependencies for Smart Inventory Management System..."

cd frontend

# Install core dependencies
echo "📦 Installing React and core dependencies..."
npm install --save react react-dom react-router-dom axios chart.js react-chartjs-2 react-table @tailwindcss/forms

# Install necessary types
echo "📦 Installing TypeScript type definitions..."
npm install --save-dev typescript @types/react @types/react-dom @types/react-router-dom @types/react-table 

# Install Tailwind CSS and its dependencies
echo "📦 Installing Tailwind CSS and its dependencies..."
npm install --save tailwindcss postcss autoprefixer

# Install development tools
echo "📦 Installing development tools..."
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react

echo "✅ All dependencies have been installed successfully!"
echo "🚀 You can now run the application with: npm start" 