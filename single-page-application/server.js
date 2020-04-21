'use strict';

const app = require('./app.js');
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

//  Listen for HTTP requests on port 3000
const server = http.listen(port, () => {
  console.log('listening on %d', port);
});

// socket.io used to enable a client side alert on server disconnection
require('socket.io').listen(server);
