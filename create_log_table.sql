CREATE TABLE `log` ( `id` INT(11) NOT NULL AUTO_INCREMENT , `location` VARCHAR(100) NULL , `type` VARCHAR(100) NULL , `device` VARCHAR(100) NULL , `value` VARCHAR(100) NULL , `ts` INT(11) NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;