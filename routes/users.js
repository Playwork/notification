/**
 * Created by Absoluteplay on 12/4/2559.
 */
var express = require('express');
var router = express.Router();
var User = require('../app/models/user');
var jwtconfig = require('../config/jwtconfig').jwtconfig;
var jwt = require('jwt-simple');

router.post('/signup', function (req, res) {
    if (!req.body.name || !req.body.password) {
        res.json({success: false, msg: 'Please pass name and password'});
    } else {
        var newUser = new User({
            name: req.body.name,
            password: req.body.password
        });


        newUser.save(function (err) {

            if (err) {
                //console.log(err);
               if(err.code==11000){
                   return res.json({success: false, msg: 'Duplicate User Name'});
               }
                return res.json({success: false, msg: err});
            }
            res.json({success: true, msg: 'Successfully created a User'});
        });
    }
});

router.post('/authenticate', function (req,res) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;

        if (!user) {
            res.status(401).send({msg: 'Authentication failed. User not found'});
        } else {
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    var iat = new Date().getTime() / 1000;
                    var exp = iat + jwtconfig.tokenExpirationTime;
                    var payload = {
                        aud: jwtconfig.audience,
                        iss: jwtconfig.issuer,
                        iat: iat,
                        exp: exp,
                        sub: user.name
                    };

                    var token = jwt.encode(payload, jwtconfig.secret);

                    user.token = 'JWT ' + token;
                    user.save();

                    res.json({success: true, token: 'JWT ' + token});
                } else {
                    res.status(401).send({success: false, msg: 'Authentication failed. Wrong password'});
                }
            });
        }

    });
});

module.exports=router;