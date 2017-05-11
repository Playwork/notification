/**
 * Created by Absoluteplay on 12/4/2559.
 */
module.exports.jwtconfig = {
    secret: 'somewhereibelong',
    tokenExpirationTime: 60 * 20,
    audience:'http://localhost:3000',
    issuer:'thoonly@local.com'
};