/**
 * Created by Absoluteplay on 8/4/2559.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BearSchema=new Schema({
    createAt:Date,
    name:String
});

module.exports=mongoose.model('Bear',BearSchema);