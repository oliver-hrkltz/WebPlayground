#!/usr/bin/env python3

import asyncio
import json
from websockets import serve
from aiohttp import web


# Set to store connected clients.
connected_clients = set()

# Handler for WebSocket connections.
async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        while True:
            message = await websocket.recv()
            print(f"Received message from client: {message}")
    except Exception as e:
        print(f"Client disconnected: {e}")
    finally:
        connected_clients.remove(websocket)


# Function to send a message to all connected clients via WebSocket.
async def send_message_to_clients(message):
    if connected_clients:
        await asyncio.wait([asyncio.create_task(client.send(message)) for client in connected_clients])
    else:
        print("No clients connected")


# Handler for HTTP requests which will simply forward the request to all connected WebSocket clients.
async def http_handler(request):
    request_info = {
        "method": request.method,
        "path": request.path,
        "headers": dict(request.headers),
        "query": dict(request.query),
        "body": await request.text()
    }
    print(request_info)
    await send_message_to_clients(json.dumps(request_info))
    return web.Response(text="Request forwarded to WebSocket clients.")


# Blocking function to run the WebSocket server on Port 8081.
async def websocket_main():
    async with serve(websocket_handler, "", 8081):
        # Run forever.
        await asyncio.get_running_loop().create_future()


# Blocking function to run the HTTP server on Port 8080.
async def http_main():
    app = web.Application()
    # Handle any request method.
    app.router.add_route('*', '/', http_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    # Run forever.
    await asyncio.get_running_loop().create_future()


async def main():
    await asyncio.gather(
        websocket_main(),
        http_main()
    )


if __name__ == "__main__":
    asyncio.run(main())