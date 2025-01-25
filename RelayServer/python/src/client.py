#!/usr/bin/env python3

import asyncio
import websockets
import requests


# Function to connect to the WebSocket server and forward messages to another local running HTTP server (Port 8082).
async def connect_to_server():
    uri = "ws://localhost:8081"
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            print(f"Received message from server: {message}")
            # Forward the message as an HTTP POST request
            response = requests.post('http://localhost:8082/forward', json=message)
            print(f"Forwarded message to HTTP server, response status: {response.status_code}")


if __name__ == "__main__":
    asyncio.run(connect_to_server())