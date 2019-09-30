# mqtt-sql-logger
💿 MQTT Subscriber to save data to MySQL database

Assumes an SQL table `log` with structure as shown:

```sql
mysql> describe log;
+----------+-------------+------+-----+---------+----------------+
| Field    | Type        | Null | Key | Default | Extra          |
+----------+-------------+------+-----+---------+----------------+
| id       | int(11)     | NO   | PRI | NULL    | auto_increment |
| location | varchar(20) | YES  |     | NULL    |                |
| device   | varchar(20) | YES  |     | NULL    |                |
| value    | varchar(20) | YES  |     | NULL    |                |
| ts       | int(11)     | YES  |     | NULL    |                |
+----------+-------------+------+-----+---------+----------------+
```