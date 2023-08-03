const express = require('express');
const app = express();
require("dotenv").config();
require("./config/database").connect();
const authJWT = require("./middleware/auth");
var bodyParser = require('body-parser')
const TradingView = require('@mathieuc/tradingview');
const server = require('http').createServer(app);
const { Server } = require("socket.io");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
var jsonParser = bodyParser.json()
// const TOKEN_KEY = process.env.TOKEN_KEY;
const TOKEN_KEY = '1234567890';
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const io = new Server(8888, {  cors: {
  origin: '*',
  methods: ["GET", "POST"]
}});
const cors = require('cors');
app.use(cors({credentials: true, origin: true}));
app.get('/', function (req, res){
  res.send("XCULE DATA SERVER IS RUNNING")
})
//CODEBASE 1X =============================================== START
const socketClient = {};
const socketChart = {};

io.sockets.on('connection', (socket) => {
  console.log("Socket Client Connected On Server", socket.id);

  socket.on('join', function(data) {
    console.log(`${socket.id} Requested to JOIN ON ${data.uid} with values of ${data.ticker}, ${data.tf}`);
    if (socket.rooms.has(data.uid)) {
      console.log("OLD USER + ALREADY IN", data.uid);
    } else {
      newClientSessionInit(data);
      socket.join(data.uid);
      console.log("NEW-USER JOINING ROOM", data.uid);
      getLiveFeedData({data, socket}, cb => {
        io.to(data.uid).emit('feed', {"live": cb, "uid": data.uid});
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
  console.log("GET LC OF:", symbol, tf);
  socketChart[data.uid].setMarket(symbol, { timeframe:tf });
  socketChart[data.uid].onUpdate(() => {
    if (!socketChart[data.uid].periods[0]) return console.error(new Error("No data"));
    callback(socketChart[data.uid].periods[0]);
  });
  socketChart[data.uid].onError((...err) => {
    socketClient[data.uid].end();
    return console.error(new Error("DATA Error"));
  });
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

 //CODEBASE 1X ===============================================  END

const User = require("./model/user");
app.post("/createBetaUser", jsonParser, async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).send("All input is required");
    }

    const userExists = await User.exists({ username });

    if (userExists) {
      signIn(username, password, res);
      return;
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.toLowerCase(),
      password: encryptedPassword,
    });

    const token = jwt.sign(
      { user_id: user._id, username },
      TOKEN_KEY,
      { expiresIn: "2h" }
    );

    user.token = token;

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating beta user");
  }
});


app.post("/signIn", jsonParser, async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).send("All input is required");

    //   const encryptedPassword = await bcrypt.hash(password, 10);

    //   const user = await User.create({
    //     username: username.toLowerCase(),
    //     password: encryptedPassword,
    //   });
  
    //   const token = jwt.sign(
    //     { user_id: user._id, username },
    //     process.env.TOKEN_KEY,
    //     { expiresIn: "2h" }
    //   );
  
    //   user.token = token;
  
    //   await user.save();
  
    //  return res.status(201).json(user);
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).send("User not found");

    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign(
      { user_id: user._id, username },
      TOKEN_KEY,
      { expiresIn: "2h" }
    );

    user.token = token;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error signing in user");
  }
});

const signIn = async (username, password, res) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).send("Invalid Credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid Credentials");
    }

    const token = jwt.sign(
      { user_id: user._id, username },
      TOKEN_KEY,
      { expiresIn: "2h" }
    );

    user.token = token;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error signing in user");
  }
};


app.get('/login', authJWT, async function (req, res) {
  const usr = 'tugoftrades'
  const pwd = 'toc__123#'
  console.log(usr, pwd);
  if (!usr) throw Error('Please specify your username/email');
  if (!pwd) throw Error('Please specify your password');
  await TradingView.loginUser(usr.toString(), pwd.toString(), true).then((user) => {
    console.log('USER Sessionid:', user.session);
    res.send(user)
  }).catch((err) => {
    console.error('Login error:', err.message);
    return res.send(err.message)
  });
});

app.get('/getBars/', function (req, res) {
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  symbol = req.query.symbol.toString()
  tf = req.query.tf.toString()
  range = parseInt(req.query.range)
  to = JSON.parse(req.query.to)
  
  chart.setMarket(symbol, { // Set the market
    timeframe:tf,
    range: range,
    to: to,
  });
  
  chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
    console.log(`GET BARS FOR Market "${chart.infos, tf}" loaded !`);
  });
  
  chart.onUpdate(async () => { // When price changes
    if (!chart.periods[0]) return;
    var periods = Object.values(chart.periods);
    let diff, lastCTime;

    if(chart.periods.length < range){
      for (let i = 0; i <= (range - chart.periods.length) ; i++){
        diff = periods[periods.length - 2].time - periods[periods.length - 1].time;
        lastCTime = periods[periods.length - 1].time;
        const elm = {"time": lastCTime - diff, "open": periods[periods.length - 1].open, "max": periods[periods.length - 1].max, "min": periods[periods.length - 1].min, "close": periods[periods.length - 1].close, "volume": periods[periods.length - 1].volume};
        periods.push(elm);
      }
      periods.pop();
      console.log("=====>", periods.length);
      res.send(periods);
      client.end();
      return;
    } else {
      console.log("TOTAL SEND PACKETS: ", chart.periods.length);
      res.send(periods);
      client.end();
    }
  });
  
  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.log("Chart error: ===================>", ...err);
    res.send(err.message);
  });
});


app.get('/getReplayBars/', function (req, res) {
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  chart.setTimezone('Asia/Kolkata')
  symbol = req.query.symbol.toString()
  tf = req.query.tf.toString()
  range = parseInt(req.query.range)
  to = JSON.parse(req.query.to)
  console.log(symbol, tf, to, range)
  chart.setMarket(symbol, { // Set the market
    timeframe:tf,
    range: -range,
    to: to,
  });
  chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
    console.log(`GET BARS FOR Market "${chart.infos, tf}" loaded !`);
  });
  chart.onUpdate(async () => { // When price changes
    if (!chart.periods[0]) return;
      console.log("TOTAL SEND PACKETS: ", chart.periods.length)
      res.send(chart.periods.reverse())
      client.end()
  });
  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.error("Chart error: ===================>", ...err)
    res.status(500).send(err.message)
    client.end()
  });
});
  

app.get('/searchSymbol/', function (req, res) {
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  searchKey = req.query.searchKey.toString()
  console.log(searchKey)
  TradingView.searchMarket(searchKey).then((rs) => {
    console.log('Found Markets:', rs);
    res.send(rs);
    client.end();
  })

  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.error("Chart error: ===================>", ...err)
    res.status(500).send(err.message)
    client.end()
  });

});


app.get('/resolveSymbol/', function (req, res) {
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  symbol = req.query.symbol.toString()
  chart.setMarket(symbol, {
    timeframe:'D'
  });
  chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
    console.log(`Market "${symbol}" loaded ! RESOLVE & SENDING SYMBOL INFO`);
    res.send(chart.infos)
    client.end()
  })
  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.error("Chart error: ===================>", ...err)
    res.status(500).send(err.message)
    client.end()
  });
});



app.get('/searchIndicator/', function (req, res) {

  //const client = new TradingView.Client(); // Creates a websocket client
  //const chart = new client.Session.Chart(); // Init a Chart session

  searchterm = req.query.symbol.toString()

  TradingView.searchIndicator(searchterm).then((rs) => {
    console.log('Found Indicators:', rs);
    res.send(rs);
  });
});



app.get('/getFVG/', function (req, res) {
  symbol = req.query.symbol.toString();
  tf = req.query.tf.toString();
  barCount = parseInt(req.query.barCount);
  toTime = parseInt(req.query.to);
  console.log("FVG CALL", symbol, tf);
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  chart.setMarket(symbol, {
    timeframe: tf,
    range: 10000,
    to: toTime
  });
  chart.onError((...err) => {
    console.log('CHART error:', ...err);
    res.send(...err);
  });
  TradingView.getIndicator('PUB;JnCafhpmkXatAEM8sXHV9dPJ12whp0at', 'last').then((indic) => {
    indic.setOption(20, 1000);
    const FVG = new chart.Study(indic);
    FVG.onError((...err) => {
      console.log('Study error:', ...err);
      res.send(...err);
    });
    FVG.onReady(() => {
      console.log(`STD '${JSON.stringify(FVG.instance)}' Loaded !`);
    });
    FVG.onUpdate((v) => {
      if (!v[0]) return;
      res.send(FVG.graphic);
      client.end();
      console.log('Graphic data:', FVG.graphic.boxes.length, FVG.graphic.boxes[0].id, FVG.graphic.boxes[FVG.graphic.boxes.length-1].id, v);
    });
  })
  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.error("Chart error: ===================>", ...err)
    res.status(500).send(err.message)
    client.end()
  });
});


app.get('/getQML/', function (req, res) {
  const symbol = req.query.symbol.toString();
  const tf = req.query.tf.toString();
  const barCount = parseInt(req.query.barCount);
  const toTime = parseInt(req.query.to);
  console.log("QML CALL", symbol, tf);
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  chart.setMarket(symbol, {
    timeframe: tf,
    range: 10000,
    to: toTime
  });
  TradingView.getIndicator('PUB;c44be7dc7f704e5080ca4b4d53e21119', 'last').then((indic) => {
    indic.setOption(0, 5);
    const QML = new chart.Study(indic);
    QML.onReady(() => {
      console.log(`STD '${JSON.stringify(QML.instance)}' Loaded !`);
    });
    QML.onUpdate((v) => {
      if (!v[0]) return;
      res.send(QML.graphic)
      client.end()
      console.log('Graphic data:', QML.graphic);
    });
  }).catch((err)=>{
    res.send(err.message)
    client.end();
  });
  chart.onError((...err) => {
    console.log('CHART error:', ...err);
    res.send(...err)
  });
});

app.get('/getDFXT/', function (req, res) {
  const symbol = req.query.symbol.toString();
  const tf = req.query.tf.toString();
  const barCount = parseInt(req.query.barCount);
  const toTime = parseInt(req.query.to);
  console.log("DFXT CALL", symbol, tf);
  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session
  chart.setMarket(symbol, {
    timeframe: tf,
    range: 10000,
    to: toTime
  });
  TradingView.getIndicator('PUB;83e1f1ebd7644c08a746acfc4261e8cb', 'last').then((indic) => {
    // indic.setOption(0, 5);
    const DFXT = new chart.Study(indic);
    DFXT.onReady(() => {
      console.log(`DFXT' Loaded !`);
    });
    DFXT.onUpdate((v) => {
      if (!v[0]) return;
      console.log('Graphic data:', DFXT.graphic.length);
      res.send(DFXT.graphic)
      client.end()
    });
    DFXT.onError((...err) => {
      console.log('Study error:', ...err);
      res.send(...err)
    });
  }).catch((err)=>{
    res.send(err.message)
    client.end();
  });
  chart.onError((...err) => {
    console.log('CHART error:', ...err);
    res.send(...err)
  });
});


server.listen(() => console.log('WebSocket listening at', 8888));
app.listen(process.env.PORT || 8080, console.log("Http server listening at", 8000));