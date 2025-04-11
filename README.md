# Smart Inventory Management System

A full-stack inventory management system with AI-powered forecasting and automated order processing.

## Features

- 📊 Real-time inventory tracking
- 🤖 AI-powered sales forecasting
- 🔄 Automated order processing
- 📈 Analytics and reporting
- 🔍 Advanced search and filtering
- 📱 Responsive design

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Table
- Chart.js

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Hugging Face AI Models

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Chaitu123432/Smart-Inventory-Management-System.git
cd Smart-Inventory-Management-System
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Create .env files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

4. Initialize the database:
```bash
cd backend
npm run init-db
```

5. Start the development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

### Backend (.env)
```
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_management
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# API Keys
HUGGING_FACE_API_KEY=your_api_key_here
```

## Project Structure

```
Smart-Inventory-Management-System/
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static files
│
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── tests/            # Test files
│
└── docs/                 # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI models
- [React Table](https://react-table.tanstack.com/) for data tables
- [Chart.js](https://www.chartjs.org/) for data visualization 