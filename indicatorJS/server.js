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
  res.send('Xcule Indicator Server!');
});

// Store subscriptions
const subscriptions = new Map();

// Socket.IO logic
app.on('connection', (connection) => {
  app.channel('everybody').join(connection);
});

app.publish(() => app.channel('everybody'));

app.service('indicator').publish('created', (data) => {
  const { indicator, socket } = data;

  // Fetch indicator data and send to user
  fetchIndicatorData(indicator, socket);
});

// Function to fetch indicator data and send to user
function fetchIndicatorData(indicator, socket) {
  const client = new TradingView.Client();
  const chart = new client.Session.Chart();

  // Set the chart for a market (symbol, tf, toTime should be collected from the user)
  chart.setMarket('Symbol', {
    timeframe: '1D',
    range: 10000,
    to: 'toTime',
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
