const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const TradingView = require('@mathieuc/tradingview');

// Create an Express compatible Feathers application
const app = express(feathers());

// Serve static files
app.use('/', express.static('public'));

// Enable REST and Socket.IO services
app.configure(express.rest());
app.configure(socketio());

// Set up routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
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

// Store subscriptions
const subscriptions = new Map();

// Socket.IO logic
app.on('connection', (connection) => {
  const socket = connection;

  socket.on('subscribe', ({ symbol, timeframe, to, indicator }) => {
    // Add subscription to the map
    const subscription = { symbol, timeframe, to, indicator };
    const userSubscriptions = subscriptions.get(socket.id) || [];
    userSubscriptions.push(subscription);
    subscriptions.set(socket.id, userSubscriptions);

    // Fetch indicator data and send to user
    fetchIndicatorData(subscription, socket);
  });

  socket.on('unsubscribe', ({ symbol, timeframe, to, indicator }) => {
    // Remove subscription from the map
    const userSubscriptions = subscriptions.get(socket.id) || [];
    const updatedSubscriptions = userSubscriptions.filter((sub) => {
      return (
        sub.symbol !== symbol ||
        sub.timeframe !== timeframe ||
        sub.to !== to ||
        sub.indicator !== indicator
      );
    });
    subscriptions.set(socket.id, updatedSubscriptions);
  });
});

// Function to fetch indicator data and send to user
function fetchIndicatorData({ symbol, timeframe, to, indicator }, socket) {
  const client = new TradingView.Client();
  const chart = new client.Session.Chart();

  // Set the chart for a market
  chart.setMarket(symbol, {
    timeframe,
    range: 10000,
    to,
  });

  // Load the indicator to the chart to collect its data
  TradingView.getIndicator(indicator, 'last').then((indic) => {
    indic.setOption(20, 1000);
    const study = new chart.Study(indic);

    study.onError((...err) => {
      console.log('Study error:', ...err);
    });

    study.onReady(() => {
      console.log(`Study '${JSON.stringify(study.instance)}' Loaded!`);
    });

    study.onUpdate((v) => {
      if (!v[0]) return;
      socket.emit('indicator data', { indicator, data: study.graphic });
      client.end();
      console.log('Indicator data:', study.graphic.boxes.length, study.graphic.boxes[0].id, study.graphic.boxes[study.graphic.boxes.length - 1].id, v);
    });
  });
}

// Start the server
const port = 9001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
