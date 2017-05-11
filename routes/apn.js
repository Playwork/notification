'use strict';
var express = require('express');
var router = express.Router();

var config = require('../config/apnconfig').apnconfig;

/* Apple Notification */
var apn = require('apn');
//var ApnLog = require('../app/models/apn_log');

var ioRedis = require('ioredis');


var localhost = process.env.NODE_HOST;

if (!process.env.NODE_HOST) {
    localhost = '127.0.0.1';
}
var clientRedis = new ioRedis({port: 6379, host: localhost, db: 3});

var options = {
    cert: config.cert,
    key: config.key,
    passphrase: config.passphrase,
    production: false,
    connectionTimeOut: config.connectionTimeOut || 10000
};

var apnConnection = new apn.Connection(options);

router.post('/push/:token_device', function (req, res) {

    //console.log(req.body);

    /*Device*/
    var deviceToken = req.params.token_device;

    console.log(deviceToken);
    //var deviceToken='fb0123280e65563ae0c6e0bce68405aa40362a5e46984a6a1aa268bae531cd59';
    var myDevice = new apn.Device(deviceToken);

    /* Notification */
    var noti = new apn.Notification();

    noti.expiry = Math.floor(Date.now() / 1000) + 36000;
    noti.badge = 1;
    noti.sound = "ping.aiff";
    noti.alert = req.body.alert_msg;
    noti.payload = 
    {
        aps: {
            title: req.body.alert_msg,
            sound: 'default',
            body: req.body
        }
    };

    apnConnection.pushNotification(noti, myDevice);

    res.status(200).send({data: req.body.data});

});

router.post('/broadcast',function(req,res){
    //console.log(req.body);

    /*Device*/
    var deviceToken = req.body.device_token;

    //var deviceToken='fb0123280e65563ae0c6e0bce68405aa40362a5e46984a6a1aa268bae531cd59';
    //var myDevice = new apn.Device(deviceToken);
    //var deviceToken = ["fb0123280e65563ae0c6e0bce68405aa40362a5e46984a6a1aa268bae531cd59", "fb0123280e65563ae0c6e0bce68405aa40362a5e46984a6a1aa268bae531cd59"];

    /* Notification */
    var noti = new apn.Notification();

    noti.expiry = Math.floor(Date.now() / 1000) + 36000;
    noti.badge = 1;
    noti.sound = "ping.aiff";
    noti.alert = req.body.alert_msg;
    noti.payload = req.body.data;

    apnConnection.pushNotification(noti, deviceToken);

    res.status(200).send({data: req.body.data});
});


///* Feedback Options */
var feedbackOptions = {
    cert: config.cert,
    key:config.key,
    passphrase: config.passphrase,
    production: config.production,
    batchFeedback: true,
    interval: 10
};

var feedback = new apn.feedback(feedbackOptions);

feedback.on('feedback', handleFeedback);
feedback.on('feedbackError',handleFeedbackError);

function handleFeedback(feedbackData) {
    var apn_log = {};
    var time, device;
    for (var row in feedbackData) {
        time = feedbackData[row].time;
        device = feedbackData[row].device;

        apn_log.createAt = new Date();
        apn_log.message = 'handle Feedback';
        apn_log.deviceToken = device;
        apn_log.feedbackTime = time;
        apn_log.feedbackOptions=feedbackOptions;
        clientRedis.sadd('apn:log:'+device,JSON.stringify(apn_log));
        //console.log("Device: " + device.toString('hex') + " has been unreachable, since: " + time);
    }
}

function handleFeedbackError(feedbackData){
    var apn_log = {};
    var time, device;
    for (var row in feedbackData) {
        time = feedbackData[row].time;
        device = feedbackData[row].device;

        apn_log.createAt = new Date();
        apn_log.message = 'Feedback Error';
        apn_log.deviceToken = device;
        apn_log.feedbackTime = time;
        apn_log.feedbackOptions=feedbackOptions;
        clientRedis.sadd('apn:log:'+device,JSON.stringify(apn_log));
        //console.log("Device: " + device.toString('hex') + " has been unreachable, since: " + time);
    }
}

module.exports = router;