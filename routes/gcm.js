/**
 * Created by Absoluteplay on 18/4/2559.
 */
'use strict';
var express=require('express');
var router=express.Router();
var config=require('../config/gcmconfig').gcmconfig;

/* Android Notification */

var gcm = require('node-gcm');
var message = new gcm.Message();

var GcmLog = require('../app/models/gcm_log');

// Set up the sender with you API key
var sender = new gcm.Sender(config.api_key);

router.route('/push/:token_device')
    .post(function (req, res) {

        var gcm_log = new GcmLog();

        var device_token = req.params.token_device;
        var registrationTokens = [];
        registrationTokens.push(device_token);

// as object
        message.addNotification({
            title: req.body.alert_msg,
            body: req.body,
            icon: 'ic_launcher'
        });

        sender.sendNoRetry(message, {registrationTokens: registrationTokens}, function (err, response) {
            if (err) {
                gcm_log.createAt = new Date();
                gcm_log.message = err;
                gcm_log.deviceToken = device_token;
                gcm_log.status = 'got error';
                gcm_log.save();

                res.json({success: false,msg: err});
            }
            else {

                gcm_log.createAt = new Date();
                gcm_log.message = response;
                gcm_log.deviceToken = device_token;
                gcm_log.status = 'send push';
                gcm_log.save();
                res.status(200).send({data: req.body.data});

            }

        });

    });
router.route('/broadcast')
    .post(function (req, res) {

        var gcm_log = new GcmLog();

        var device_token = req.body.device_token;
        var registrationTokens = [];
        device_token.forEach(function(token,idex){
            registrationTokens.push(token);
        });


// as object
        message.addNotification({
            title: req.body.alert_msg,
            body: req.body.data,
            icon: 'ic_launcher'
        });

        sender.sendNoRetry(message, {registrationTokens: registrationTokens}, function (err, response) {
            if (err) {
                gcm_log.createAt = new Date();
                gcm_log.message = err;
                gcm_log.deviceToken = device_token;
                gcm_log.status = 'got error';
                gcm_log.save();

                res.json({success: false,msg: err});
            }
            else {

                gcm_log.createAt = new Date();
                gcm_log.message = response;
                gcm_log.deviceToken = device_token;
                gcm_log.status = 'send push';
                gcm_log.save();
                res.status(200).send({data: req.body.data});

            }

        });

    });

module.exports=router;