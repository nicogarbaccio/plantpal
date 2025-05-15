# PlantPal 🌱

PlantPal is a modern web application designed to help plant enthusiasts manage their houseplant collection. Keep track of your plants' watering schedules, monitor their health, and discover new plants to add to your collection.

## Features

- 🪴 Browse a curated catalog of popular houseplants
- 💧 Track watering schedules and plant care history
- 🏠 Manage your personal plant collection
- 📱 Responsive design for both desktop and mobile use
- 🔍 Filter and search plants by category, difficulty, and more
- 📊 Visual care status overview
- 📝 Add notes and track plant health

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching and caching
- **Wouter** for routing
- **Zod** for form validation

### Backend
- **Node.js** with TypeScript
- **Express** for the server framework
- **PostgreSQL** with Drizzle ORM for database management
- **Zod** for schema validation

## Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- PostgreSQL database
- pnpm, npm, or yarn package manager

### Environment Setup

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd plantpal
\`\`\`

2. Create a \`.env\` file in the server directory:
\`\`\`
DATABASE_URL="postgresql://username:password@localhost:5432/plantpal"
\`\`\`

### Installation

1. Install dependencies for all packages:
\`\`\`bash
# Install server dependencies
cd server
pnpm install

# Install client dependencies
cd ../client
pnpm install

# Install shared dependencies
cd ../shared
pnpm install
\`\`\`

2. Set up the database:
\`\`\`bash
cd ../server
pnpm db:push    # Apply database migrations
pnpm db:seed    # Seed the database with initial data
\`\`\`

### Running the Application

1. Start the server:
\`\`\`bash
cd server
pnpm dev
\`\`\`

2. In a new terminal, start the client:
\`\`\`bash
cd client
pnpm dev
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

\`\`\`
plantpal/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── types/       # TypeScript type definitions
├── server/              # Backend Express server
│   ├── migrations/      # Database migrations
│   ├── seeds/          # Seed data
│   └── routes.ts        # API routes
└── shared/             # Shared types and schemas
    └── schema.ts       # Database schema definitions
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/my-new-feature\`
3. Commit your changes: \`git commit -am 'Add some feature'\`
4. Push to the branch: \`git push origin feature/my-new-feature\`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
