/**
 * Created by Absoluteplay on 8/4/2559.
 */
var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var debug = require('debug');
var passport = require('passport');
var passportConfig = require('./config/passport');
var cookieParser = require('cookie-parser');
//var redis = require('redis');
var ioRedis = require('ioredis');


var localhost = process.env.NODE_HOST;

if (!process.env.NODE_HOST) {
    localhost = '127.0.0.1';
}
var clientRedis = new ioRedis({port: 6379, host: localhost, db: 3});

// Create a readable stream (object mode)
//var stream = clientRedis.scanStream({
//    match: 'channel:*'
//});
//stream.on('data', function (keys) {
//    // `keys` is an array of strings representing key names
//    if (keys.length) {
//        var pipeline = clientRedis.pipeline();
//        keys.forEach(function (key) {
//            pipeline.del(key);
//        });
//        pipeline.exec();
//    }
//});
//stream.on('end', function () {
//    console.log('reset all viewer done');
//});


passportConfig(passport);


var app = express();

var server = require('http').Server(app);

//var restAPI = require('./routes/api');
//var users = require('./routes/users');
var apn = require('./routes/apn');
var gcm = require('./routes/gcm');

var socket = require('./routes/socket')(server, localhost);

//var server = require('http').Server(app);
//var socketIO = require('socket.io');
//var io = socketIO(server, {
//    log: false,
//    agent: false,
//    origins: '*:*'
//    //,
//    //transports: ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling','polling']
//});

//var appRootDir = path.dirname(require.main.filename);
//var ENV = require('node-env-file')(path.join(appRootDir, "private", ".env"));


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//app.use(cookieParser);
app.use(morgan('dev'));

var port = process.env.PORT || 5555;

var router = express.Router();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/test', function (req, res) {
    res.sendFile(__dirname + '/index2.html');
});

//app.use('/api', restAPI);
//app.use('/users', users);
app.use('/apn', apn);
app.use('/gcm', gcm);

app.use('/socket', socket);


server.listen(port);
console.log('Start on port ' + port);


clientRedis.on('error', function (err) {
    console.log('redis is not running');

});


