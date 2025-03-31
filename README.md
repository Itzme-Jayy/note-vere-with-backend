# NoteVerse Exchange

A platform for sharing and managing educational notes among students.

## Features

- Create, edit, and delete notes
- Toggle note privacy (public/private)
- Like and save notes
- Search and filter notes by branch, year, and subject
- File attachments support
- User authentication

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/noteverse-exchange.git
cd noteverse-exchange
```

2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

   - Create `.env` files in both frontend and backend directories
   - Add necessary environment variables (see `.env.example`)

4. Start the development servers:

```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd frontend
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
