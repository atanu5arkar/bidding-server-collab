import express from 'express';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';

const app = express();
const port = 8080;

// app.use(express.static("../client"))

const server = http.createServer(app);
let bid = JSON.parse(fs.readFileSync('bid.json'));

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

/*
fs
disconnect
client
*/

app.get('/end', (req, res) => {
  io.emit('end-bidding');
  res.status(200).json({ message: 'bidding ended' });
});

/*
socket events emitted: 

current-bid:    (initially) 
emit : {fname: "example", bid: 22}

bid: 
emit : {fname: "example", bid: 22}

bid:    (in case of rejected bid) 
{fname: "example", bid: 22, rejected: true}

*/

const endTime = Date.now() + 24 * 60 * 60 * 1000;

io.on('connection', (socket) => {
  if (Date.now() >= endTime) {
    socket.emit('end');
    return socket.disconnect();
  }

  console.log(`Current bid: `, bid);
  socket.emit(`bid`, { ...bid, initialBid: true });

  socket.on('bid', (newBid) => {
    if (+newBid.bid > bid.bid) {
      bid = { bid: newBid.bid, fname: newBid.fname };
      fs.writeFileSync('bid.json', JSON.stringify(bid));
      console.log(`user bid: `, newBid);
      io.emit('bid', { ...newBid, rejected: false });
    } else {
      io.emit('bid', { ...newBid, rejected: true });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected: ');
  });

  setTimeout(() => {
    socket.emit('end');
    return socket.disconnect();
  }, endTime - Date.now());
});

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
