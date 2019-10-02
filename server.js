
var creds = require('./creds.js');
var mysql_conn = require('./log_mqtt_mysql_connect.js');

const mqtt = require('mqtt');
const client = mqtt.connect('wss://'+creds.mqtt_broker+':8083/ws',{
    username: creds.mqtt_user,
    password: creds.mqtt_password,
    port: 8083,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8)
});

var last_saves = {};
var db_save_interval = 60*5; // save at most once every 5 minutes

console.log("ready!");

client.on('connect', function() { // When connected
    console.log("Connected to MQTT");
    // Subscribe to the penthouse temperatures
    client.subscribe('penthouse/temp/+', function() {
        // When a message arrives, do something with it
        client.on('message', function(topic, message, packet) {

            // Split out parts
               var topic_path = topic.split('/');

            // path should be: penthouse/temp/device-name
            if(topic_path[1] != "temp"){
               console.log("Path is not a temperature node: " + topic);
            }else{
               device_name = topic_path[2];
               console.log(device_name + " = "+ message);

               // If we haven't seen this device before, create a record for saving it
               if(last_saves[device_name] == undefined){
                  last_saves[device_name] = 0;
               }

               if(mysql_conn.isConnected()){

                  // Get timestamp
                  var ts_now = Math.floor(new Date() / 1000);

                  // Get building
                  var topic_path = topic.split('/');
                  var location = topic_path[0];
                  var device = topic_path[1];

                  if(ts_now > last_saves[device_name]+db_save_interval){
                     var sql = "INSERT INTO log (id,location,device,value,ts) VALUES (NULL, :location, :device, :device_value, :ts)";
                     var sql_data = {
                           "location"     : location,
                           "device"       : device_name,
                           "device_value" : message,
                           "ts"           : ts_now
                     };

                     mysql_conn.getConnection().query(sql,sql_data, function (error, results, fields) {
                           if (error) throw error;
                           console.log('Saved ' + results.affectedRows + ' row(s) to database!');
                     });
                     last_saves[device_name] = ts_now;
                  }
               }
            }
        });
    });
});

client.on('error', function(err) {
    console.log(err);
});