const express = require('express');
const app = express();
const TradingView = require('@mathieuc/tradingview');
const server = require('http').createServer(app);
const { Server } = require("socket.io");

const io = new Server(6001, {  cors: {
  origin: '*',
  methods: ["GET", "POST"]
}});
const cors = require('cors');
app.use(cors({credentials: true, origin: true}));
app.get('/', function (req, res){
  res.send("XCULE INDICATOR SERVER IS RUNNING")
})

//INDICATOR CODEBASE 1X =============================================== START
const socketClient = {};
const socketChart = {};

io.sockets.on('connection', (socket) => {
  console.log("Socket Client Connected On Server", socket.id);

  socket.on('join', function(data) {
    // console.log(`${socket.id} Requested to JOIN ON ${data.uid} with values of ${data.ticker}, ${data.tf}`);
    if (socket.rooms.has(data.uid)) {
      console.log("OLD USER + ALREADY IN", data.uid);
    } else {
      newClientSessionInit(data);
      socket.join(data.uid);
      console.log("NEW-USER JOINING ROOM", data.uid);
      getLiveFeedData({data, socket}, cb => {
        io.to(data.uid).emit('indicatorFeed', {"live": cb, "uid": data.uid});
      });
    }
  });

  socket.on('leave', function(data) {
    if (socket.rooms.has(data.uid)) {
      socket.leave(data.uid);
      console.log("USER LEFT ROOM", data.uid);
      exitRoomIfNoUser(data);
    }
  });

  socket.on('error', function(error) {
    console.error("USER LEFT DUE TO AN ERROR", error);
  });

  socket.on('disconnect', function (data) {
    socket.leave();
    console.log("USER LEFT & DISCONNECTED");
  });
});

const getLiveFeedData = ({data, socket}, callback) => {
  const symbol = data.ticker;
  let tf = data.tf;
  if (['1D', '1W', '1M'].includes(data.tf)) {
    tf = data.tf.replace('1', '');
  }

  let indicatorID = data.indicator;
//   console.log("GET LC OF:", symbol, tf);

  socketChart[data.uid].setMarket(symbol, { timeframe:tf });

  socketChart[data.uid].onError((...err) => {
    socketClient[data.uid].end();
    return console.error(new Error("DATA Error"));
  });

  TradingView.getIndicator(indicatorID, 'last').then((indic) => {
    //   indic.setOption(20, 1000);
      const study = new socketChart[data.uid].Study(indic);

      study.onError((...err) => {
        // console.log('Study error:', ...err);
        socketClient[data.uid].end();
        return console.error(new Error("DATA Error"));
      });

      study.onReady(() => {
        console.log(`Study '${JSON.stringify(study.instance)}' Loaded!`);
      });

      study.onUpdate((v) => {
        if (!v[0]) return;
        io.to(socket.id).emit('indicatorData', { indicator, data: study.graphic });
        client.end();
      });

  })

}

const newClientSessionInit = (data) => {
  socketClient[data.uid] = new TradingView.Client();
  socketChart[data.uid] = new socketClient[data.uid].Session.Chart();
  socketChart[data.uid].setTimezone('Asia/Kolkata');
}

const exitRoomIfNoUser = (data) => {
  io.of("/").in(data.uid).fetchSockets().then(sks => {
    if (!sks.length) {
      console.log("NO USERS & CLOSING THE ROOM", data.uid);
      socketClient[data.uid].end();
    }
  });
}

 //INDICATOR CODEBASE 1X ===============================================  END


server.listen(() => console.log('WebSocket listening at', 6001));
app.listen(process.env.PORT || 6000, console.log("Http server listening at", 6000));