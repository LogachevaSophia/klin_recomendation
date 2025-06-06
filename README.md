# Recommendation System

A modern web application for managing recommendations built with React, TypeScript, and MobX.

## Features

- Create, read, update, and delete recommendations
- Priority-based categorization
- Responsive design
- Real-time state management with MobX
- Modern UI with Gravity UI Kit

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=http://your-api-url
```

## Project Structure

```
src/
  ├── api/              # API services and types
  ├── components/       # React components
  ├── stores/          # MobX stores
  ├── assets/          # Static assets
  └── App.tsx          # Root component
```

## Technologies Used

- React
- TypeScript
- MobX
- Vite
- Gravity UI Kit
- Axios
- SCSS Modules

## Types nodes
0 = старт, 1 - стоп, 2 = условие/параллель, 3 = действие, 4 - подпроцесс
type: "start" | "finish" | "condition" | "action" | "newprocess"
