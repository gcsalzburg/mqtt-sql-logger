'use strict';

// Globals
global.DEBUG = false;

// Imports
const mysql = require('mysql');

// Use to prevent saving of MQTT when database not connected
let is_db_connected = false;

// Main connection function, with reconnect on timeout included
let connection;
function mysql_reconnect(db_config) {
    connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.

    connection.connect(function(err) {  
        if(!err) {
            if(DEBUG) console.log("Database is connected ...");
            is_db_connected = true;  
        } else {
            if(DEBUG) console.log("Error connecting to database:\n", err);  
            is_db_connected = false;
            setTimeout(mysql_reconnect,2000,db_config); // We introduce a delay before attempting to reconnect
        }
    });

    connection.on('error', function(err) {
         if(DEBUG) console.log('Database error: \n', err);
         is_db_connected = false;  
         if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            mysql_reconnect(db_config); 
         }else{
            throw err; 
         }
    });
}

// Exports for this module
module.exports.startConnection = function(host,username,password,database,set_debug=true){

   DEBUG = set_debug;
   const db_config = {
      host        : host,
      user        : username,
      password    : password,
      database    : database,
      queryFormat : function (query, values) {
          if (!values) return query;
          return query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
              return this.escape(values[key]);
            }
            return txt;
          }.bind(this));
      }
   };
   mysql_reconnect(db_config);  // Do initial connection
};
module.exports.isConnected = function (){
    return is_db_connected;
};
module.exports.getConnection = function () {
    return connection;
};