/**
 * Created by Absoluteplay on 12/4/2559.
 */
'use strict';

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJWT = require('passport-jwt').ExtractJwt;
var jwt = require('jwt-simple');

var User = require('../app/models/user');
var jwtconfig = require('./jwtconfig').jwtconfig;

module.exports = function (passport) {
    var opts = {};

    opts.secretOrKey = jwtconfig.secret;
    opts.issuer = jwtconfig.issuer;
    opts.audience = jwtconfig.audience;
    opts.jwtFromRequest = ExtractJWT.fromAuthHeader();

    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {

        User.findOne({name: jwt_payload.sub}, function (err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                done(null, user);
            }
            else {
                done(null, false, 'User found in token not found');
            }
        });

    }));

};