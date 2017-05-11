 /**
 * Created by Playwork <thanayut@playwork.co.th> on 13/5/2016.
 */

 var app = require('express')();
 var bodyParser = require('body-parser');
 var port = process.env.PORT || 8888;

 app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


var mongoose = require('mongoose');
mongoose.connect('mongodb://192.168.120.204/ving-api');
mongoose.connection.on('error',  console.error.bind(console, 'connection error:'));

var mongojs = require('mongojs');
var db = mongojs('mongodb://192.168.120.204/ving-api', ['VODPackageMember']);

var token = mongoose.model('TokenPackage', { packegeId: String, token: String, phone:String, status:String });

	var otpGenerator = require('otp-generator')
	var sinchAuth = require('sinch-auth');
	var sinchSms = require('sinch-messaging');
	var auth = sinchAuth("cd1fe297-b520-47d5-bda2-dffac7201f0d", "e6EpcBb2Wkqgh9SY0h8oew==");


 app.post('/token/created', function (req, res) {
	
	 console.log(req.body);
  // res.json(req.body);
  var packegeId = req.body.packegeId;
  var phone = req.body.phone;
  var key = otpGenerator.generate(8, { digits: true, alphabets: true, upperCase: true, specialChars: false });
  
  var record = new token();  
  record.packegeId = packegeId;
  record.token = key;
  record.phone = phone;
  record.status = "I";

  record.save(function(err) {
        if (err) { console.log(err); };
        sendsms(phone,key);
  });

  res.json({"status":"OK","Token":key});
	 
	// 
	 
});


 app.post('/token/show', function (req, res) {
	
	 token.find().exec(function (err, tokens) {
	    if (err) {
	      console.log(err);
	    }
	    console.log(tokens);
	    res.json({"status":"OK","data":tokens});
	});


  
	 
	// 
	 
});

 app.post('/token/active', function (req, res) {
	  
	var packegeId;
	console.log(req.body);
	var key = req.body.token;
	var memberId = req.body.memberId;

	console.log(key);
	
		db.on('error', function (err) {
		    console.log('database error', err)
		})

	  token.find({ token:key }).exec(function (err, tokens) {
	    if (err) {
	      console.log(err);
	    }
	    console.log(tokens);
	    if (tokens.length>0){
	    	for (data in tokens) {
        		packegeId = tokens[data].packegeId;    
      		}
      		// vpm.memberId = memberId;
      		// vpm.packageId = packegeId;

      			var json = { memberId: memberId,  packageId: packegeId };

				  db.VODPackageMember.insert(json, function(err, docs) {
				  	if (err) { console.log(err); };
				      	console.log(docs);
			        	res.json({"status":"OK"});
				  });

	    }else{
	    	res.json({"error":'no token'});
	    }
	});

});


	function sendsms(phone,str) {

		// request.post('http://203.121.165.145/bulksms/hybrid/', { form: { 'key': 'Adwdj99q8saasdw1A6dswfv4ppo2r8efgemc',
		// 																	'to': phoneNumber,
		// 																	'content': content,
		// 																	'schedule': schedule 
		// 																}
		// 														},

		// 	function (error, response, body) {
		// 		console.log(response.statusCode);	

		// 		if (error || response.statusCode != 200) {

		// 			console.log("Fail send OTP to phone: " + phoneNumber + " with error: " + error);
		// 			res.send("Fail send OTP.");
		// 			return;
		// 		}
		// 		else {				
		// 			console.log(body);				
		// 		}

		// 	});

		//test sms
		sinchSms.sendMessage(phone, "ving token '"+str+"'");
	}



app.listen(port, function() {
  console.log('Starting node.js on port ' + port);
});


