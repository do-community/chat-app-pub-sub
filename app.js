const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const Redis = require("ioredis");

const redisPublisher = new Redis();
const redisSubscriber = new Redis();

const server = http.createServer((req, res) => {
  const htmlFilePath = path.join(__dirname, "index.html");
  fs.readFile(htmlFilePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error occured while reading file");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", (client) => {
  console.log("succesfully connected to the client");
  client.on("message", (streamMessage) => {
    redisPublisher.publish("chat_messages", streamMessage);
    // distributeClientMessages(streamMessage);
  });
});

redisSubscriber.subscribe("chat_messages");
console.log("sub", redisSubscriber.subscribe("messages"));

redisSubscriber.on("message", (channel, message) => {
  console.log("redis", channel, message);
  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
});
// const distributeClientMessages = (message) => {
//   for (const client of webSocketServer.clients) {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(message);
//     }
//   }
// };

// const PORT = 3459;
const PORT = process.argv[2] || 3459;
server.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});
