/**
 * Created by Absoluteplay on 8/4/2559.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GcmLogSchema = new Schema({
    createAt: Date,
    message:Schema.Types.Mixed,
    deviceToken:String,
    status:String
});

module.exports = mongoose.model('GcmLog', GcmLogSchema);