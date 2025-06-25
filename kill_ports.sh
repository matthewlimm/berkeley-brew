#!/bin/bash

# Script to kill all processes on commonly used development ports
# For Berkeley Brew application

echo "Killing processes on common development ports..."

# Common development ports used in web development
PORTS=(
  3000  # Next.js default
  3001  # Alternative Next.js
  4000  # Express alternative
  5000  # Express default
  8000  # Common dev server
  8080  # Common dev server
  9000  # Common dev server
  27017 # MongoDB
  5432  # PostgreSQL
)

# Kill processes on each port
for PORT in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
  else
    echo "No process found on port $PORT"
  fi
done

# Kill any Node.js processes related to Berkeley Brew
echo "Checking for Node.js processes related to Berkeley Brew..."
NODE_PIDS=$(ps aux | grep "[n]ode.*berkeley-brew" | awk '{print $2}')
if [ -n "$NODE_PIDS" ]; then
  echo "Killing Node.js processes: $NODE_PIDS"
  kill -9 $NODE_PIDS 2>/dev/null
else
  echo "No Berkeley Brew Node.js processes found"
fi

echo "All ports have been cleared!"
