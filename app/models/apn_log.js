/**
 * Created by Absoluteplay on 8/4/2559.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ApnLogSchema = new Schema({
    createAt: Date,
    message: Schema.Types.Mixed,
    deviceToken:String,
    feedbackTime:String
});

module.exports=mongoose.model('ApnLog',ApnLogSchema);