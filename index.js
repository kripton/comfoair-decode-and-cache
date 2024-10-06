#!/usr/bin/env node

const can = require('socketcan');
const child_process = require('child_process');
const http = require('http');

const PDOs = [
  {name: 'away_indicator', id: 16, type: 1, factor: 1},
  {name: 'operatingmode_49', id: 49, type: 1, factor: 1},
  {name: 'operatingmode_56', id: 56, type: 1, factor: 1},
  {name: 'fan_speed_setting', id: 65, type: 1, factor: 1},
  {name: 'bypass_activation_mode', id: 66, type: 1, factor: 1},
  {name: 'temperature_profile', id: 67, type: 1, factor: 1},
  {name: 'fan_exhaust_duty', id: 117, type: 1, factor: 1},
  {name: 'fan_supply_duty', id: 118, type: 1, factor: 1},
  {name: 'fan_exhaust_flow', id: 119, type: 2, factor: 1},
  {name: 'fan_supply_flow', id: 120, type: 2, factor: 1},
  {name: 'fan_exhaust_speed', id: 121, type: 2, factor: 1},
  {name: 'fan_supply_speed', id: 122, type: 2, factor: 1},
  {name: 'power_consumption_actual', id: 128, type: 2, factor: 1},
  {name: 'filter_change_countdown', id: 192, type: 2, factor: 1},
  {name: 'temp_outside_5dayavg_rmot', id: 209, type: 6, factor: 10},
  {name: 'avoided_heating_actual', id: 213, type: 2, factor: 1},
  {name: 'avoided_cooling_actual', id: 216, type: 2, factor: 1},
  {name: 'bypass_state', id: 227, type: 1, factor: 1},
  {name: 'temp_extract_air', id: 274, type: 6, factor: 10},
  {name: 'temp_exhaust_air', id: 275, type: 6, factor: 10},
  {name: 'temp_outdoor_air', id: 276, type: 6, factor: 10},
  {name: 'temp_preheated_outdoor_air', id: 277, type: 6, factor: 10},
  {name: 'temp_supply_air', id: 278, type: 6, factor: 10},
  {name: 'humidity_extract_air', id: 290, type: 1, factor: 1},
  {name: 'humidity_exhaust_air', id: 291, type: 1, factor: 1},
  {name: 'humidity_outdoor_air', id: 292, type: 1, factor: 1},
  {name: 'humidity_preheated_outdoor_air', id: 293, type: 1, factor: 1},
  {name: 'humidity_supply_air', id: 294, type: 1, factor: 1},
];

child_process.execSync('ip link set can0 type can bitrate 50000');
child_process.execSync('ip link set up can0');

const channel = can.createRawChannel("can0", true);

// Log any message
channel.addListener("onMessage", function(msg) {
  console.log('ID: ' + msg.id.toString(16).padStart(8, '0') + ' DATA: ' + msg.data.toString('hex'));
  const pdo = (msg.id >> 14);
  console.log('PDOID: ' + pdo);

  PDOs.forEach((dataType) => {
    if (pdo == dataType.id) {
      console.log('MATCH: ' + dataType.name);
      let val = 0;
      switch (dataType.type) {
        case 1:
          val = msg.data.readUInt8() / dataType.factor;
	  break;
        case 2:
          val = msg.data.readUInt16LE() / dataType.factor;
          break;
        case 6:
          val = msg.data.readInt16LE() / dataType.factor;
          break;
      }
      console.log('VALUE: ' + val);
      dataType.lastValue = val;
      dataType.lastSeen = new Date().toISOString();
    }
  });

});

channel.start();

http.createServer(function (req, res) {
  res.write(JSON.stringify(PDOs));
  res.end();
}).listen(35000);
