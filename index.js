var Service, Characteristic;
var request = require('request');
var pollingtoevent = require('polling-to-event');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-doorbird", "Doorbell", DoorBirdPlatform);
};

function DoorBirdPlatform(log, config) {
  // global vars
  this.log = log;

  // configuration vars
  this.devices = config["doorbells"];

  log("Starting discovery...");
}

DoorBirdPlatform.prototype = {
  accessories: function(callback) {
    var foundAccessories = [];
    var count = this.devices.length;

    for(index = 0; index < count; index++){
		  var accessory  = new DoorBirdAccessory(this.log, this.devices[index]);
		  foundAccessories.push(accessory);
	  }

	  callback(foundAccessories);
  }
};

function DoorBirdAccessory(log, config) {
  self = this;
  this.log = log;
  this.name = config["name"];
  this.username = config["doorbird_username"];
  this.password = config["doorbird_password"];
  this.ip = config["doorbird_ip"];
  this.url = config["doorbird_url"];
  this.binaryState = 0; // switch state, default is OFF
  this.log("Starting a homebridge-doorbird device with name '" + this.name + "'...");
  this.service;
  this.timeout = 2;

  var emitter = pollingtoevent(function(done) {
  this.httpRequest("http://" + this.ip + this.url + "&http-user=" + this.username + "&http-password=" + this.password, "GET", function(error, response, responseBody) {
      if (error) {
        self.log('DoorBird get status failed: %s', error.message);
     	callback(error);
      } else {
	done(null, responseBody);
      }
   });
   
   }.bind(this), 
			       
   {longpolling:true,interval:500,longpollEventName:"longpoll"});

    emitter.on("longpoll", function(data) {       
        var binaryState = parseInt(data.split(/[= ]+/).pop());
        this.log("DoorBird doorbell state is currently ", binaryState);
	
	clearTimeout(this.timeout);
	this.timeout = setTimeout(function() {
      	   this.service.getCharacteristic(Characteristic.On).setValue(binaryState);
    	}.bind(this), 1000);
    }.bind(this));
}	       

DoorBirdAccessory.prototype.getState = function(callback) {
  var powerOn = this.binaryState > 0;
  this.log("Power state for the '%s' is %s", this.name, this.binaryState);
  callback(null, powerOn);
};

DoorBirdAccessory.prototype.setPowerOn = function(powerOn, callback) {
  var self = this;
  this.binaryState = powerOn ? 1 : 0;
  this.log("Set power state on the '%s' to %s", this.name, this.binaryState);
  callback(null);

  if(powerOn) {
    setTimeout(function() {
      self.log("BEEP! BOOP!");
      self.service.getCharacteristic(Characteristic.On).setValue(0);
      setInterval(self.request.bind(self), 100);
    }, this.timeout * 1000);
  }
};

DoorBirdAccessory.prototype.httpRequest = function(url, body, method, callback) {
   request({
	url: url,
	method: method,
	body: body,
	
	function(error, response, body) {
		callback(error, response, body);
	},
   });
};

DoorBirdAccessory.prototype.identify = function(callback) {
    this.log("Identify requested!");

    var targetChar = this.service
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent);

    this.log("targetChar:", targetChar);

    if (targetChar.value == "1"){
	     targetChar.setValue(0);
	     this.log("Toggle state to 0");
    }
    else{
	     targetChar.setValue(1);
	     this.log("Toggle state to 1");
    }
    callback();
};

DoorBirdAccessory.prototype.getServices = function() {

    this.service = new Service.Doorbell(this.name);

    this.service
      .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
      .on('get', this.getState.bind(this));

    var targetChar = this.service
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent);

return [this.service];
};
