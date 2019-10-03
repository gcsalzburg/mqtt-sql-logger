# mqtt-sql-logger
💿 MQTT Subscriber to save data to MySQL database

This is a "set and forget" logger, which enables you to save a history of messages sent to a particular topic.

## MQTT Structure

This program was initially set up for home automation testing, so the MQTT path structure is assumed to be:

> `location/type/node`

For instance, a node in the kitchen of the penthouse which sends temperature records would be:

> `penthouse/temp/kitchen`

## SQL

Assumes an SQL table `log` with structure as shown:

```sql
mysql> describe log;
+----------+--------------+------+-----+---------+----------------+
| Field    | Type         | Null | Key | Default | Extra          |
+----------+--------------+------+-----+---------+----------------+
| id       | int(11)      | NO   | PRI | NULL    | auto_increment |
| location | varchar(100) | YES  |     | NULL    |                |
| type     | varchar(100) | YES  |     | NULL    |                |
| device   | varchar(100) | YES  |     | NULL    |                |
| value    | varchar(100) | YES  |     | NULL    |                |
| ts       | int(11)      | YES  |     | NULL    |                |
+----------+--------------+------+-----+---------+----------------+
```

## Future

+ Allow custom field names in SQL and custom table structure
+ Add error checking on db & MQTT connection
+ Adopt a standard MQTT path structure