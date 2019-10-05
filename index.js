'use strict';

// Debug flag
global.DEBUG = false;

// Imports
const mqtt  = require('mqtt');
const mysql = require('./mysql_connection.js');

// Default configuration options
const config_defaults = {
   mqtt_broker         : "",    // URL for MQTT broker
   mqtt_username       : "",    // Username for MQTT subscriber user
   mqtt_password       : "",    // Password for MQTT subscriber user
   mqtt_port           : 8083,  // Port for MQTT connection (note default is to use secure web sockets)

   sql_host            : "",    // Hostname for MySQL server
   sql_username        : "",    // Username for MySQL connection
   sql_password        : "",    // Password for MySQL connection
   sql_database        : "",    // MySQL database name

   sql_table           : "log", // Name of MySQL table

   topic               : "+",   // MQTT subscription topic

   save_topic          : true,  // If true, will save full topic path to 'topic' field
   topic_fields        : "",    // Array of table fields to save parts of topic path to (see below)
   topic_save_interval : 300,   // How many seconds to wait between db saves on the same topic

   debug               : true   // Print console debug messages
};

// Main log class
class log {

   // Constructor
   constructor(user_config) {

      // Save configuration
      this.config = extendDefaults(config_defaults,user_config);
      DEBUG = this.config.debug;

      // Create array for tracking last save intervals
      this.last_saves = {};
      
      // Begin MySQL connection
      mysql.startConnection(
         this.config.sql_host,
         this.config.sql_username,
         this.config.sql_password,
         this.config.sql_database,
         DEBUG
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
         if(DEBUG) console.log("Connected to MQTT");
         // Subscribe to the topic
         mqtt_client.subscribe(subscriber_topic, function(err) {
            if(err){
               if(DEBUG) console.log(err);
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
         if(DEBUG) console.log(err);
      });
   }

   // Main handler for when a new subscribed message arrives
   handleMsg(topic,message,packet){

      // If we haven't seen this device before, create a record for saving it
      if(this.last_saves[topic] == undefined){
         this.last_saves[topic] = 0;
      }

      // Debug statement
      if(DEBUG) console.log(`MQTT received [${topic}]: ${message}`);

      // Only proceed is MySQL is connected
      if(mysql.isConnected()){

         // Get timestamp
         var ts_now = Math.floor(new Date() / 1000);

         // Should we save it?
         if(ts_now > this.last_saves[topic]+this.config.topic_save_interval){

            // Base object for saving the data
            const sql_data = {
               "ts"      : ts_now,
               "topic"   : topic,
               "message" : message,
            };

            // Remove topic if we don't want to save this:
            if(!this.config.save_topic){
               delete sql_data.topic;
            }

            // Add additional fields to save, if they exist:
            if(Array.isArray(this.config.topic_fields)){
               const fields = this.config.topic_fields;
               if(fields.length > 0){
                  // Map values in the fields list to parts of the topic we are subscribed to
                  const topic_parts = topic.split("/");
                  for(let i=0; i < Math.min(fields.length,topic_parts.length); i++){
                     if(fields[i] != ""){
                        sql_data[fields[i]] = topic_parts[i];
                     }
                  }
               }
            }
            
            // Build query       
            const keys = Object.keys(sql_data);  
            var sql = `INSERT INTO ${this.config.sql_table} (${ keys.join(", ") }) VALUES (${ keys.map(i => ':' + i).join(", ") })`;

            // Register response
            let that = this;
            mysql.getConnection().query(sql,sql_data, function (error, results, fields) {
                  if (error) throw error;
                  if(DEBUG) console.log(` -> Saved ${results.affectedRows} row(s) to database!`);
                  that.last_saves[topic] = ts_now;
            });
         }
      }
      
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