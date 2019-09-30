
var creds = require('./creds.js');
var mysql = require('mysql');

var connection;
var db_config = {
    host        : 'localhost',
    user        : creds.sql_user,
    password    : creds.sql_password,
    database    : creds.sql_database,
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

// Use to prevent saving of MQTT when database not connected
var is_db_connected = false;

function mysql_reconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.

    connection.connect(function(err) {  
        if(!err) {
            console.log("Database is connected ...");
            is_db_connected = true;  
        } else {
            console.log("Error connecting to database:\n", err);  
            is_db_connected = false;
            setTimeout(mysql_reconnect, 2000); // We introduce a delay before attempting to reconnect
        }
    });

    connection.on('error', function(err) {
        console.log('Database error: \n', err);
        is_db_connected = false;  
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            mysql_reconnect(); 
        }else{
            throw err; 
        }
    });
}
mysql_reconnect(); // Do initial connection


// Exports for this module
exports.isConnected = function (){
    return is_db_connected;
}
exports.getConnection = function () {
    return connection;
};