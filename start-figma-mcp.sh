#!/bin/bash

# Port to listen on
PORT=3845
BRIDGE_SCRIPT="figma-mcp-bridge.js"
LOG_FILE="figma-mcp-bridge.log"

echo "Stopping any existing process running on port $PORT..."
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
  echo "Killing process $PID..."
  kill -9 $PID
fi

echo "Starting Figma MCP Bridge Server..."
nohup node "$BRIDGE_SCRIPT" > "$LOG_FILE" 2>&1 &

# Wait a second to check if it started successfully
sleep 1

NEW_PID=$(lsof -t -i:$PORT)
if [ ! -z "$NEW_PID" ]; then
  echo "Figma MCP Bridge Server successfully started in the background (PID: $NEW_PID)."
  echo "Listening on http://127.0.0.1:$PORT/mcp"
else
  echo "Failed to start Figma MCP Bridge Server. Check $LOG_FILE for details."
fi
