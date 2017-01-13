# homebridge-doorbird

`homebridge-doorbird` is a plugin for Homebridge.

## Installation

If you are new to Homebridge, please first read the Homebridge [documentation](https://www.npmjs.com/package/homebridge).
If you are running on a Raspberry, you will find a tutorial in the [homebridge-punt Wiki](https://github.com/cflurin/homebridge-punt/wiki/Running-Homebridge-on-a-Raspberry-Pi).

1 Install homebridge:
```sh
sudo npm install -g homebridge
```
2 Install homebridge-doorbird:
```sh
sudo npm install -g git+https://github.com/Samfox2/homebridge-doorbird.git
```
3 Configure plugin:
```sh
 Update your configuration file. See sample-config.json in this repository for a sample. 
```
## Configuration

Add the platform in `config.json` in your home directory inside `.homebridge`.

```js
    {
      "platform": "Doorbell",
      "doorbells": [
        {
          "name": "DoorBird",
          "username": "",
          "password": "",
          "doorbird_ip": "",
          "check_request": "/bha-api/monitor.cgi?check=doorbell"
        }
       ]
      }
```

## Note
If placed in a room with a camera it sends a notification with a snapshot/stream to your ios device after user pushes the doorbell button.
