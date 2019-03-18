"use strict";
var _Vungle = require("./Vungle");

var http = require('http');

var hostName = '127.0.0.1';
var port = 3000;
var server = http.createServer(function (req, res) {
  res.statusCode = 200;
  res.setHeader('Content-type', 'text/plan');
  res.end('Yay Me\n'); // console.log(vungle.getSessionId());
  // console.log(vungle.getConfig());
});
server.listen(port, hostName, function () {
  console.log("Server running at http:// ".concat(hostName, ":").concat(port, "/"));
});