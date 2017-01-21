var Service, Characteristic;
var requst = require('superagent');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-doorbird", "Doorbell", DoorBirdPlatform);
}

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
}

function DoorBirdAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.doorbird_ip = config["doorbird_ip"];
  this.homebridge_ip = config["homebridge_ip"];	
  this.check_request = config["notification_url"];
  this.url = "http://" + this.doorbird_ip + this.check_request + "&url=" + this.homebridge_ip
  this.binaryState = 0; // switch state, default is OFF
  this.log("Starting a homebridge-doorbird device with name '" + this.name + "'...");
  this.service;
  this.timeout = 2;
  this.lastState = 0
}

DoorBirdAccessory.prototype.request = function() {
  // register for DooBird push notification
  request
    .get(this.url)
    .end(function(err, res){
      if(err || !res.ok) {
        this.log('DoorBird connection error: ' + err)
      } else {
          this.log('DoorBird response: ' + res.text);
        });
    }
	 
  //incoming request received fire off the doorbell
  setTimeout(function() {
      this.log("Doorbell pressed");
      this.service.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(res.thisState);
  }.bind(this), 10000);
}

DoorBirdAccessory.prototype.getState = function(callback) {
  var powerOn = this.binaryState > 0;
  this.log("Power state for the '%s' is %s", this.name, this.binaryState);
  callback(null, powerOn);
}

DoorBirdAccessory.prototype.setPowerOn = function(powerOn, callback) {
  var self = this;
  this.binaryState = powerOn ? 1 : 0;
  this.log("Set power state on the '%s' to %s", this.name, this.binaryState);
  callback(null);

  if(powerOn) {
    setTimeout(function() {
      self.log("BEEP! BOOP!");
      self.service.getCharacteristic(Characteristic.On).setValue(0);
      setInterval(self.request.bind(self), 100)
    }, this.timeout * 1000);
  }
}


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
}

DoorBirdAccessory.prototype.getServices = function() {

    this.service = new Service.Doorbell(this.name);

    this.service
      .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
      .on('get', this.getState.bind(this));

    var targetChar = this.service
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent);

return [this.service];
}
