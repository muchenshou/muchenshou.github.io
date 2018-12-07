var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./key/private.pem', 'utf8');
var certificate = fs.readFileSync('./key/file.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate,requestCert: false,
    rejectUnauthorized: false};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
var PORT = 9000;
var SSLPORT = 9001;
var console = require('console');
//app.use(express.static('./'))

httpServer.listen("0.0.0.0:"+ PORT, function() {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen("0.0.0.0:"+SSLPORT, function() {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});

//Welcome
app.get('/', function(req, res) {
    console.log(req);
    if(req.protocol === 'https') {
        res.status(200).send('Welcome to Safety Land!');
    }
    else {
        res.status(200).send('Welcome!');
    }
});