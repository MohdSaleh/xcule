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
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const io = new Server(8888, {  cors: {
  origin: '*',
  methods: ["GET", "POST"]
}});
const cors = require('cors');

app.use(cors({credentials: true, origin: true}));

let socketClient =[]
let socketChart=[]

app.get('/', function (req, res){
  res.send("HELLO WORLD")
})
//===============================================
io.sockets.on('connection', (socket) => { 
    console.log("Socket Client Connected On Server", socket.id)
    socket.on('join', function(data) {
        console.log("===>",socket.id," Requested to JOIN ON ", data.uid, " with values of ", data.ticker, data.tf)
        if(socket.rooms.has(data.uid)){
          console.log("OLD USER + ALREADY IN ", data.uid);
        } else{
            newClientSessionInit(data)
            socket.join(data.uid);
            console.log("NEW-USER JOINING ROOM", data.uid);
            //SENDING DATA
            getLiveFeedData({data, socket}, cb => {
              // console.log("LC-NEW("+ data.uid +"): ",cb.time,  cb.close) 
              io.to(data.uid).emit('feed', {"live": cb})
            })
            .catch((err)=>{
              console.error(err)
              socket.leave(data.uid)
            })   
        }
    });

      socket.on('leave', function(data) {
        if(socket.rooms.has(data.uid)){
          socket.leave(data.uid)
          console.log("USER LEFT ROOM", data.uid);
          exitRoomIfNoUser(data)
        }
      });

      socket.on('error', function(error) {
        console.error("USER LEFT DUE TO AN ERROR ", error);
      });

      socket.on('disconnect', function (data) {
          socket.leave()
          console.log("USER LEFT & DISCONNECTED");
      });

 });
//===============================================
const getLiveFeedData = async ({data, socket}, callback) => {
  symbol = data.ticker
  tf = (['1D', '1W', '1M']).includes(data.tf)? data.tf.replace('1', '') : data.tf
  uid = data.uid

  console.log("GET LC OF: ", symbol, tf)
  socketChart[uid].setMarket(symbol, { // Set the market
    timeframe:tf,
  });
  // Call the onUpdate function without a promise
  socketChart[uid].onUpdate(() => { // When price changes
    if (!socketChart[uid].periods[0]) return console.error(new Error("No data"));
    callback(socketChart[uid].periods[0]);
  });

  socketChart[uid].onError((...err) => { // Listen for errors (can avoid crash)
    socketChart[uid].end()
    return console.error(new Error("DATA Error"));
  });

  // chart.onError((...err) => { // Listen for errors (can avoid crash)
  //   console.error('Chart error:', ...err);
  //   // Do something...
  // });
}


 const newClientSessionInit=(data)=>{
  socketClient[data.uid] = new TradingView.Client(); // Creates a websocket client
  socketChart[data.uid] = new socketClient[data.uid].Session.Chart(); // Init a Chart session
  socketChart[data.uid].setTimezone('Asia/Kolkata')
 }

 const exitRoomIfNoUser = async (data) =>{
  sks = await io.of("/").in(data.uid).fetchSockets()
  if(!sks.length){
    console.log("NO USERS & CLOSING THE ROOM ", data.uid)
    socketClient[data.uid].end()
  }
 }

 const User = require("./model/user");
 app.post("/signIn", jsonParser, async (req, res) => {
  // our register logic goes here...
  try {
    // Get user input
    const { username, password } = req.body;

    // Validate user input
    if (!(username && password)) {
      res.status(400).send("All input is required");
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ username });

    if (oldUser) {
      signIn(username, password, res)
      return;
    }

    // //Encrypt user password
    // encryptedPassword = await bcrypt.hash(password, 10);

    // // Create user in our database
    // const user = await User.create({
    //   username: username.toLowerCase(), // sanitize: convert email to lowercase
    //   password: encryptedPassword,
    // });

    // // Create token
    // const token = jwt.sign(
    //   { user_id: user._id, username },
    //   process.env.TOKEN_KEY,
    //   {
    //     expiresIn: "2h",
    //   }
    // );
    // // save user token
    // user.token = token;

    // // return new user
    // res.status(201).json(user);

    res.status(404).send('No Access! Please Request for Access')

  } catch (err) {
    console.log(err);
  }
});

const signIn = async (username, password, res) => {

  // Our login logic starts here
  try {

    if (!(username && password)) {
      res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, username },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      // user
      res.status(200).json(user);
      return;
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
};


app.get('/login', authJWT, async function (req, res) {

// const usr = req.query.username.toString()
// const pwd = req.query.password.toString()

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

  // const client = new TradingView.Client({
  //   token: req.query.usr.toString()
  // }); // Creates a websocket client

  const client = new TradingView.Client(); // Creates a websocket client
  const chart = new client.Session.Chart(); // Init a Chart session

  // chart.setTimezone('Asia/Kolkata')

  symbol = req.query.symbol.toString()
  tf = req.query.tf.toString()
  range = parseInt(req.query.range)
  to = JSON.parse(req.query.to)

  console.log(symbol, tf, to, range)


  chart.setMarket(symbol, { // Set the market
    timeframe:tf,
    range: range,
    to: to,
  });

  
  chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
    console.log(`GET BARS FOR Market "${chart.infos, tf}" loaded !`);
    // chart.fetchMore(-500)
  });


  chart.onUpdate(async () => { // When price changes
    // console.log("GET BARS ON UPDATE OF",range, chart.periods[0]
    // console.log("PACKETS: ", chart.periods.length, chart.periods[0])

    if (!chart.periods[0]) return;

    var periods = Object.values(chart.periods)

    if(chart.periods.length < range){
      // let diff = chart.periods[chart.periods.length - 2].time - chart.periods[chart.periods.length - 1].time
      // let lastCTime = chart.periods[chart.periods.length - 1].time
      // console.log("NT:", chart.periods[chart.periods.length - 1].time, "N+1T: ",  chart.periods[chart.periods.length - 2].time, "DIF: ", diff, "N-1T: ",  lastCTime - diff)
      for (let i = 0; i <= (range - chart.periods.length) ; i++){
        console.log(periods[periods.length - 2], "-", periods[periods.length - 1])
        let diff = periods[periods.length - 2].time - periods[periods.length - 1].time
        let lastCTime = periods[periods.length - 1].time
        const elm = {"time": lastCTime - diff, "open": periods[periods.length - 1].open, "max": periods[periods.length - 1].max, "min": periods[periods.length - 1].min, "close": periods[periods.length - 1].close, "volume": periods[periods.length - 1].volume}
        periods.push(elm)
      }
      periods.pop()
      console.log("=====>", periods.length)
      res.send(periods)
      client.end()
      return;
    }
      console.log("TOTAL SEND PACKETS: ", chart.periods.length)
      res.send(periods)
      client.end()
  });

  chart.onError((...err) => { // Listen for errors (can avoid crash)
    console.log("Chart error: ===================>", ...err)
    res.send(err.message)
    // client.end()
  });


  });

  app.get('/searchSymbol/', function (req, res) {

    const client = new TradingView.Client(); // Creates a websocket client
    const chart = new client.Session.Chart(); // Init a Chart session

    // chart.setTimezone('Asia/Kolkata')
  
    searchKey = req.query.searchKey.toString()
  
    console.log(searchKey)
  
    TradingView.searchMarket(searchKey).then((rs) => {
      console.log('Found Markets:', rs);
      res.send(rs)
      client.end()
    }).catch((err)=>{
      res.send(err)
    })
  });


  app.get('/resolveSymbol/', function (req, res) {

    const client = new TradingView.Client(); // Creates a websocket client

    const chart = new client.Session.Chart(); // Init a Chart session

    // chart.setTimezone('Asia/Kolkata')
  
    symbol = req.query.symbol.toString()
  
    // console.log(symbol)
  
  
    chart.setMarket(symbol, {
      timeframe:'D'
    });
    
    chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
      console.log(`Market "${symbol}" loaded ! RESOLVE & SENDING SYMBOL INFO`);
      res.send(chart.infos)
      client.end()
    });

    chart.onError((...err) => { // Listen for errors (can avoid crash)
      console.error('Chart error:', ...err);
      res.send(err.message)
      client.end()
    });
  
    // res.send(chart.periods)
  
    });


    app.get('/getFVG/', function (req, res) {
    
      symbol = req.query.symbol.toString()
      tf = req.query.tf.toString()
      barCount = parseInt(req.query.barCount)
      toTime = parseInt(req.query.to)

      console.log("FVG CALL", symbol, tf)

      const client = new TradingView.Client(); // Creates a websocket client
  
      const chart = new client.Session.Chart(); // Init a Chart session

      // chart.setSeries(tf);

      chart.setMarket(symbol, {
        timeframe: tf,
        range: 10000,
        to: toTime
      });

      chart.onError((...err) => {
        console.log('CHART error:', ...err);
        res.send(...err)
      });

      TradingView.getIndicator('PUB;JnCafhpmkXatAEM8sXHV9dPJ12whp0at', 'last').then((indic) => {
        // TradingView.getIndicator('PUB;6daafb2cabe6419d98ae25229d2327f8').then((indic) => {
        indic.setOption(20, 1000);
        // console.log("IND", indic.)
        const FVG = new chart.Study(indic);
      
        FVG.onError((...err) => {
          console.log('Study error:', ...err);
          res.send(...err)
        });
      
        FVG.onReady(() => {
          console.log(`STD '${JSON.stringify(FVG.instance)}' Loaded !`);
          // res.send(user)
        });
      
        FVG.onUpdate((v) => {
          // res.send(FVG.graphic)
          if (!v[0]) return;
          res.send(FVG.graphic)
          client.end()
          console.log('Graphic data:', FVG.graphic.boxes.length, FVG.graphic.boxes[0].id, FVG.graphic.boxes[FVG.graphic.boxes.length-1].id, v);
        });

      }).catch((err)=>{
        res.send(err.message)
        client.end();
      });
    
    
    });


    app.get('/getQML/', function (req, res) {
    
      symbol = req.query.symbol.toString()
      tf = req.query.tf.toString()
      barCount = parseInt(req.query.barCount)
      toTime = parseInt(req.query.to)

      console.log("QML CALL", symbol, tf)

      const client = new TradingView.Client(); // Creates a websocket client
  
      const chart = new client.Session.Chart(); // Init a Chart session

      // chart.setSeries(tf);

      chart.setMarket(symbol, {
        timeframe: tf,
        range: 10000,
        to: toTime
      });

      chart.onError((...err) => {
        console.log('CHART error:', ...err);
        res.send(...err)
      });

      TradingView.getIndicator('PUB;c44be7dc7f704e5080ca4b4d53e21119', 'last').then((indic) => {
        // TradingView.getIndicator('PUB;6daafb2cabe6419d98ae25229d2327f8').then((indic) => {
        indic.setOption(0, 5);
        // console.log("IND", indic.)
        const QML = new chart.Study(indic);
      
        QML.onError((...err) => {
          console.log('Study error:', ...err);
          res.send(...err)
        });
      
        QML.onReady(() => {
          console.log(`STD '${JSON.stringify(QML.instance)}' Loaded !`);
          // res.send(user)
        });
      
        QML.onUpdate((v) => {
          // res.send(FVG.graphic)
          if (!v[0]) return;
          res.send(QML.graphic)
          client.end()
          console.log('Graphic data:', QML.graphic);
        });

      }).catch((err)=>{
        res.send(err.message)
        client.end();
      });
    
    
    });


server.listen(() => console.error('WebSocket listening at', 8888));
app.listen(process.env.PORT || 8080, console.log("Http server listening at", 8000));