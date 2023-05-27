const { v4: uuidv4 } = require('uuid');
const { nativeEventTypes, sendEventTypes, getEventTypes } = require('./constants');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 3000;

const devices = new Map();

app.use(cors());

io.on(nativeEventTypes.connection, (socket) => {
  initializeDevice(socket);

  /* Listen device messages */
  socket.on(nativeEventTypes.message, (data) => {
    handleMessages(socket, data);
  });

  /* Listen device disconnection */
  socket.on(nativeEventTypes.disconnect, () => {
    disconnectDevice(socket);
  });
});

server.listen(port, () => {
  console.log(`Server started on port ${ port }`);
});

function initializeDevice(socket) {
  const device = {
    id: uuidv4(),
    isActive: devices.size < 2,
    playerNumber: devices.size + 1,
  };

  devices.set(socket, device);
  io.emit(nativeEventTypes.message, {
    eventType: sendEventTypes.init,
    message: device,
  });

  if (devices.size === 2) {
    const sockets = [...devices.keys()];

    sockets.forEach((ws, index) => {
      const opponentWsIndex = sockets.findIndex((_, idx) => idx !== index);

      sockets[index].emit(nativeEventTypes.message, {
        eventType: sendEventTypes.opponent,
        message: [...devices.values()][opponentWsIndex],
      });
    });
  }
}

function handleMessages(socket, data) {
  switch (data.eventType) {
    case getEventTypes.tankMove: {
      updateTankPosition(socket, data);
      return;
    }
    case getEventTypes.bulletsMove: {
      updateBullets(socket, data)
      return;
    }
    case getEventTypes.numberOfLives: {
      updateNumberOfLives(socket, data);
      return;
    }
  }
}

function updateTankPosition(socket, data) {
  const device = devices.get(socket);
  const payload = {
    ...device,
    tankPosition: data.message,
  };

  devices.set(socket, payload);
  io.emit(nativeEventTypes.message, {
    eventType: sendEventTypes.tankMove,
    message: payload,
  });
}

function updateBullets(socket, data) {
  const device = devices.get(socket);
  const payload = {
    ...device,
    bullets: data.message,
  };

  devices.set(socket, payload);
  io.emit(nativeEventTypes.message, {
    eventType: sendEventTypes.bulletsMove,
    message: payload,
  });
}

function updateNumberOfLives(socket, data) {
  const device = devices.get(socket);
  const payload = {
    ...device,
    numberOfLives: data.message,
  };

  devices.set(socket, payload);
  io.emit(nativeEventTypes.message, {
    eventType: sendEventTypes.numberOfLives,
    message: payload,
  });
}

function disconnectDevice(socket) {
  const deviceId = devices.get(socket).id;

  devices.delete(socket);
  io.emit(nativeEventTypes.message, {
    eventType: sendEventTypes.disconnect,
    message: {
      id: deviceId,
    }
  });
}
