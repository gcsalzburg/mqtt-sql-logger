# 💿 mqtt-sql-logger

> Very simple "set and forget" logger to store history of MQTT messages in a MySQL database.

## How to use

1. Install package

   ```bash
   > npm install mqtt-sql-logger
   ```

2. Create a table in your MySQL database for the log

   ```sql
   CREATE TABLE IF NOT EXISTS `log` ( `id` INT NOT NULL AUTO_INCREMENT , `topic` VARCHAR(200) NULL , `message` TEXT NULL , `ts` INT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;
   ```

3. In your Node project, import and create a new logger with your credentials:

   ```js
   const mqtt_sql_logger = require('mqtt-sql-logger');

   const log = new mqtt_sql_logger.log({
      mqtt_broker    : 'mqtt.broker-url.com',
      mqtt_username  : 'broker_username',
      mqtt_password  : 'broker_password',

      sql_host       : 'db_hostname',
      sql_username   : 'db_username',
      sql_password   : 'db_password',
      sql_database   : 'db_name',

      topic          : 'your/topic/path/+'
   });
   ```

4. That's it!

## Configuration

Here are all the available options, along with their default values. The only required options are those shown in the `How to use` steps above.

```js
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
   topic_save_interval : 300,  // How many seconds to wait between db saves on the same topic
};
```

### Custom table structures

Sometimes it might be preferrable to save parts of the topic path into a custom table structure.

For example, an MQTT home automation temperature system might sent messages from nodes to topics such as:

```
iot/family-home/temp/garage
iot/holiday-home/temp/kitchen
```

An example SQL table structure is shown:

```sql
mysql> describe log;
+----------+--------------+------+-----+---------+----------------+
| Field    | Type         | Null | Key | Default | Extra          |
+----------+--------------+------+-----+---------+----------------+
| id       | int(11)      | NO   | PRI | NULL    | auto_increment |
| message  | text         | YES  |     | NULL    |                |
| ts       | int(11)      | YES  |     | NULL    |                |
| building | varchar(200) | YES  |     | NULL    |                |
| room     | varchar(200) | YES  |     | NULL    |                |
+----------+--------------+------+-----+---------+----------------+
```

Add the following items to the configuration:

   ```js
   const log = new mqtt_sql_logger.log({
      [...]
      topic        : 'iot/+'
      save_topic   : false,
      topic_fields : ["","building","","room"]
   });
   ```

The resulting log entries will appear as shown:

```sql
mysql> select * from log;
+----+---------+------------+--------------+---------+
| id | message | ts         | building     | room    |
+----+---------+------------+--------------+---------+
|  1 | 18.38   | 1570273857 | family-home  | garage  |
|  2 | 24.17   | 1570273902 | holiday-home | kitchen |
|  3 | 18.18   | 1570273921 | family-home  | garage  |
|  4 | 23.53   | 1570273934 | holiday-home | kitchen |
|  5 | 23.88   | 1570273988 | holiday-home | kitchen |
+----+---------+------------+--------------+---------+
```