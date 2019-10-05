
const mqtt  = require('mqtt');
const mysql = require('./mysql_connection.js');

// Default configuration options
let config_defaults = {
   mqtt_broker:         "mqtt.example.com",           // URL for MQTT broker
   mqtt_username:       "",                           // Username for MQTT subscriber user
   mqtt_password:       "",                           // Password for MQTT subscriber user
   mqtt_port:           8083,                         // Port for MQTT connection (note default is to use secure web sockets)

   sql_host:            "localhost",                  // Hostname for MySQL server
   sql_username:        "",                           // Username for MySQL connection
   sql_password:        "",                           // Password for MySQL connection
   sql_database:        "",                           // MySQL database name

   topic:               "penthouse/temp/+",            // MQTT subscription topic

   save_topic:          true,                         // If true, will save full topic path to 'topic' field
   topic_fields:        ["location","type","device"], // Array of table fields to save parts of topic path to
   topic_save_interval: 60*5,                         // How many seconds to wait between db saves on the same topic
};

// Main log class
class log {

   constructor(user_config) {

      // Save configuration
      this.config = extendDefaults(config_defaults,user_config);

      // Create array for tracking last save intervals
      this.last_saves = {};
      
      // Begin MySQL connection
      mysql.startConnection(
         this.config.sql_host,
         this.config.sql_username,
         this.config.sql_password,
         this.config.sql_database
      );

      // Connect to MQTT broker
      let mqtt_client = mqtt.connect('wss://'+this.config.mqtt_broker+':'+this.config.mqtt_port+'/ws',{
         username: this.config.mqtt_username,
         password: this.config.mqtt_password,
         port:     this.config.mqtt_port,
         clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      });

      // MQTT topic subscriber
      const subscriber_topic = this.config.topic;
      mqtt_client.on('connect', function() { // When connected
         console.log("Connected to MQTT");
         // Subscribe to the topic
         mqtt_client.subscribe(subscriber_topic, function(err) {
            if(err){
               console.log(err);
            }
         });
      });

      // When a message arrives, handle it
      let that = this;
      mqtt_client.on('message', function(topic, message, packet) {
         that.handleMsg(topic,message,packet);
      });
      
      // MQTT subscriber error handler
      mqtt_client.on('error', function(err) {
         console.log(err);
      });
   }

   handleMsg(topic,message,packet){

      if(mysql.isConnected()){

         // If we haven't seen this device before, create a record for saving it
         if(this.last_saves[topic] == undefined){
            this.last_saves[topic] = 0;
         }

         // Get timestamp
         var ts_now = Math.floor(new Date() / 1000);

         // Debug statement
         console.log(`MQTT received [${topic}]: ${message}`);

         // Should we save it?
         if(ts_now > this.last_saves[topic]+this.config.topic_save_interval){
            
            // Save query       
            var sql = "INSERT INTO log (id,topic,value,ts) VALUES (NULL, :topic, :message, :ts)";
            var sql_data = {
                  "topic"    : topic,
                  "message"  : message,
                  "ts"       : ts_now
            };

            let that = this;
            mysql.getConnection().query(sql,sql_data, function (error, results, fields) {
                  if (error) throw error;
                  console.log(` -> Saved ${results.affectedRows} row(s) to database!`);
                  that.last_saves[topic] = ts_now;
            });
         }
      }
   }

   printMsg() {
      console.log(this.config.mqtt_broker);
   }
}

// Export log class
module.exports.log = log;





 // Utility method to extend defaults with user options
var extendDefaults = function ( defaults, options ) {
   var extended = {};
   var prop;
   for (prop in defaults) {
       if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
           extended[prop] = defaults[prop];
       }
   }
   for (prop in options) {
       if (Object.prototype.hasOwnProperty.call(options, prop)) {
           extended[prop] = options[prop];
       }
   }
   return extended;
};