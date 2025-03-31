#!/bin/bash

# Function to stop all running servers
stop_servers() {
    echo "Stopping all servers..."
    pkill -f "node"
    pkill -f "vite"
    echo "All servers stopped"
}

# Function to start the backend server
start_backend() {
    echo "Starting backend server..."
    cd backend && npm run dev &
    cd ..
    echo "Backend server started"
}

# Function to start the frontend server
start_frontend() {
    echo "Starting frontend server..."
    npm run dev &
    echo "Frontend server started"
}

# Trap SIGINT (Ctrl+C) to stop servers gracefully
trap stop_servers SIGINT

# Stop any existing servers
stop_servers

# Start servers
start_backend
start_frontend

# Wait for user input
echo "Press Ctrl+C to stop all servers"
wait 