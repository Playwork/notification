'use strict';

var express = require('express');
var router = express.Router();


router.get('/hello', function (req, res) {
    res.json([{msg: 'Hello World'}, {msg: 'Protected Route'}, {msg: 'Api'}]);
});


module.exports = router;