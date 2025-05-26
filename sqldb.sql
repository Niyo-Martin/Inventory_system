-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema inventory_system
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema inventory_system
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `inventory_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `inventory_system` ;

-- -----------------------------------------------------
-- Table `inventory_system`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`categories` (
  `category_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE INDEX `category_id` (`category_id` ASC) VISIBLE,
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 22
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`purchase_orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`purchase_orders` (
  `po_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `supplier_id` INT NULL DEFAULT NULL,
  `ordered_by` INT NULL DEFAULT NULL,
  `status` VARCHAR(20) NULL DEFAULT 'pending',
  `order_date` DATE NULL DEFAULT curdate(),
  `expected_delivery` DATE NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`po_id`),
  UNIQUE INDEX `po_id` (`po_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`users` (
  `user_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id` (`user_id` ASC) VISIBLE,
  UNIQUE INDEX `username` (`username` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`po_status_history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`po_status_history` (
  `history_id` INT NOT NULL AUTO_INCREMENT,
  `po_id` BIGINT UNSIGNED NOT NULL,
  `old_status` VARCHAR(20) NULL DEFAULT NULL,
  `new_status` VARCHAR(20) NOT NULL,
  `changed_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `changed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  INDEX `po_id` (`po_id` ASC) VISIBLE,
  INDEX `changed_by` (`changed_by` ASC) VISIBLE,
  CONSTRAINT `po_status_history_ibfk_1`
    FOREIGN KEY (`po_id`)
    REFERENCES `inventory_system`.`purchase_orders` (`po_id`),
  CONSTRAINT `po_status_history_ibfk_2`
    FOREIGN KEY (`changed_by`)
    REFERENCES `inventory_system`.`users` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`products` (
  `product_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `sku` VARCHAR(50) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `category_id` INT NULL DEFAULT NULL,
  `supplier_id` INT NULL DEFAULT NULL,
  `reorder_level` INT NULL DEFAULT '0',
  `unit_cost` DECIMAL(10,2) NULL DEFAULT '0.00',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `category_code` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  UNIQUE INDEX `product_id` (`product_id` ASC) VISIBLE,
  UNIQUE INDEX `sku` (`sku` ASC) VISIBLE,
  INDEX `idx_products_category_code` (`category_code` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`purchase_order_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`purchase_order_items` (
  `po_item_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_id` INT NULL DEFAULT NULL,
  `product_id` INT NULL DEFAULT NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(10,2) NULL DEFAULT NULL,
  `warehouse_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`po_item_id`),
  UNIQUE INDEX `po_item_id` (`po_item_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`report_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`report_logs` (
  `log_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_name` VARCHAR(100) NOT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `generated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `parameters` JSON NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  UNIQUE INDEX `log_id` (`log_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`returns`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`returns` (
  `return_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL DEFAULT NULL,
  `warehouse_id` INT NULL DEFAULT NULL,
  `return_type` VARCHAR(20) NULL DEFAULT NULL,
  `quantity` INT NOT NULL,
  `reason` TEXT NULL DEFAULT NULL,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`return_id`),
  UNIQUE INDEX `return_id` (`return_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`stock`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`stock` (
  `stock_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL DEFAULT NULL,
  `warehouse_id` INT NULL DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT '0',
  PRIMARY KEY (`stock_id`),
  UNIQUE INDEX `stock_id` (`stock_id` ASC) VISIBLE,
  UNIQUE INDEX `product_id` (`product_id` ASC, `warehouse_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`warehouses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`warehouses` (
  `warehouse_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `location` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`warehouse_id`),
  UNIQUE INDEX `warehouse_id` (`warehouse_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`stock_alerts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`stock_alerts` (
  `alert_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `warehouse_id` BIGINT UNSIGNED NOT NULL,
  `current_quantity` INT NOT NULL,
  `threshold` INT NOT NULL,
  `alert_type` ENUM('low_stock', 'out_of_stock') NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `is_resolved` TINYINT(1) NULL DEFAULT '0',
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`alert_id`),
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  INDEX `warehouse_id` (`warehouse_id` ASC) VISIBLE,
  CONSTRAINT `stock_alerts_ibfk_1`
    FOREIGN KEY (`product_id`)
    REFERENCES `inventory_system`.`products` (`product_id`),
  CONSTRAINT `stock_alerts_ibfk_2`
    FOREIGN KEY (`warehouse_id`)
    REFERENCES `inventory_system`.`warehouses` (`warehouse_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`suppliers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`suppliers` (
  `supplier_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `contact_name` VARCHAR(100) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `address` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  UNIQUE INDEX `supplier_id` (`supplier_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 12
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `inventory_system`.`transactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`transactions` (
  `transaction_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL DEFAULT NULL,
  `warehouse_id` INT NULL DEFAULT NULL,
  `transaction_type` VARCHAR(20) NOT NULL,
  `quantity` INT NOT NULL,
  `note` TEXT NULL DEFAULT NULL,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  UNIQUE INDEX `transaction_id` (`transaction_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

USE `inventory_system` ;

-- -----------------------------------------------------
-- Placeholder table for view `inventory_system`.`view_daily_flow`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`view_daily_flow` (`date` INT, `transaction_type` INT, `total_quantity` INT);

-- -----------------------------------------------------
-- Placeholder table for view `inventory_system`.`view_inventory_valuation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`view_inventory_valuation` (`product_id` INT, `name` INT, `quantity` INT, `unit_cost` INT, `total_value` INT, `warehouse` INT);

-- -----------------------------------------------------
-- Placeholder table for view `inventory_system`.`view_product_movement`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`view_product_movement` (`product_name` INT, `total_in` INT, `total_out` INT);

-- -----------------------------------------------------
-- Placeholder table for view `inventory_system`.`view_stock_summary`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_system`.`view_stock_summary` (`stock_id` INT, `product_name` INT, `warehouse` INT, `quantity` INT, `reorder_level` INT, `stock_status` INT);

-- -----------------------------------------------------
-- procedure sp_inventory_valuation
-- -----------------------------------------------------

DELIMITER $$
USE `inventory_system`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_inventory_valuation`(
    IN warehouse_id_param INT,
    IN low_stock_only BOOLEAN
)
BEGIN
    IF warehouse_id_param IS NULL AND low_stock_only = FALSE THEN
        -- Use existing view if no filters
        SELECT * FROM view_inventory_valuation;
    ELSE
        -- Apply filters for warehouse and/or low stock
        SELECT 
            p.product_id,
            p.name,
            s.quantity,
            p.unit_cost,
            (s.quantity * p.unit_cost) AS total_value,
            w.name AS warehouse
        FROM 
            stock s
        JOIN 
            products p ON p.product_id = s.product_id
        JOIN 
            warehouses w ON w.warehouse_id = s.warehouse_id
        WHERE 
            (warehouse_id_param IS NULL OR s.warehouse_id = warehouse_id_param)
            AND (low_stock_only = FALSE OR s.quantity <= p.reorder_level);
    END IF;
    
    -- Log report generation
    INSERT INTO report_logs (report_name, parameters)
    VALUES ('inventory_valuation', JSON_OBJECT(
        'warehouse_id', warehouse_id_param,
        'low_stock_only', low_stock_only
    ));
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure sp_product_movement
-- -----------------------------------------------------

DELIMITER $$
USE `inventory_system`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_product_movement`(
    IN product_id_param INT,
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    -- If all parameters are NULL, use the view
    IF product_id_param IS NULL AND start_date IS NULL AND end_date IS NULL THEN
        SELECT * FROM view_product_movement;
    ELSE
        -- Apply filters
        SELECT
            p.name AS product_name,
            SUM(CASE WHEN t.transaction_type = 'in' THEN t.quantity ELSE 0 END) AS total_in,
            SUM(CASE WHEN t.transaction_type = 'out' THEN t.quantity ELSE 0 END) AS total_out,
            SUM(CASE 
                WHEN t.transaction_type = 'in' THEN t.quantity 
                WHEN t.transaction_type = 'out' THEN -t.quantity
                ELSE 0
            END) AS net_change
        FROM transactions t
        JOIN products p ON p.product_id = t.product_id
        WHERE
            (product_id_param IS NULL OR t.product_id = product_id_param)
            AND (start_date IS NULL OR DATE(t.created_at) >= start_date)
            AND (end_date IS NULL OR DATE(t.created_at) <= end_date)
        GROUP BY p.name;
    END IF;
    
    -- Log report generation
    INSERT INTO report_logs (report_name, parameters)
    VALUES ('product_movement', JSON_OBJECT(
        'product_id', product_id_param,
        'start_date', start_date,
        'end_date', end_date
    ));
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure sp_purchase_order_analysis
-- -----------------------------------------------------

DELIMITER $$
USE `inventory_system`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_purchase_order_analysis`(
    IN supplier_id_param INT,
    IN start_date DATE,
    IN end_date DATE,
    IN status_param VARCHAR(20)
)
BEGIN
    SELECT
        po.po_id,
        s.name AS supplier_name,
        po.order_date,
        po.expected_delivery,
        po.status,
        COUNT(poi.po_item_id) AS item_count,
        SUM(poi.quantity * poi.unit_cost) AS total_value,
        u.username AS ordered_by
    FROM
        purchase_orders po
    JOIN
        suppliers s ON po.supplier_id = s.supplier_id
    JOIN
        purchase_order_items poi ON po.po_id = poi.po_id
    JOIN
        users u ON po.ordered_by = u.user_id
    WHERE
        (supplier_id_param IS NULL OR po.supplier_id = supplier_id_param)
        AND (start_date IS NULL OR po.order_date >= start_date)
        AND (end_date IS NULL OR po.order_date <= end_date)
        AND (status_param IS NULL OR po.status = status_param)
    GROUP BY
        po.po_id, s.name, po.order_date, po.expected_delivery, po.status, u.username
    ORDER BY
        po.order_date DESC;
    
    -- Log report generation
    INSERT INTO report_logs (report_name, parameters)
    VALUES ('purchase_order_analysis', JSON_OBJECT(
        'supplier_id', supplier_id_param,
        'start_date', start_date,
        'end_date', end_date,
        'status', status_param
    ));
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure sp_stock_status
-- -----------------------------------------------------

DELIMITER $$
USE `inventory_system`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_stock_status`(
    IN category_id_param INT,
    IN supplier_id_param INT,
    IN status_filter VARCHAR(20)
)
BEGIN
    SELECT
        s.stock_id,
        p.product_id,
        p.name AS product_name,
        p.sku,
        c.name AS category,
        sup.name AS supplier,
        w.name AS warehouse,
        s.quantity,
        p.reorder_level,
        CASE 
            WHEN s.quantity = 0 THEN 'OUT_OF_STOCK'
            WHEN s.quantity <= p.reorder_level THEN 'LOW_STOCK'
            ELSE 'OK'
        END AS stock_status
    FROM 
        stock s
    JOIN 
        products p ON p.product_id = s.product_id
    JOIN 
        warehouses w ON w.warehouse_id = s.warehouse_id
    LEFT JOIN
        categories c ON c.category_id = p.category_id
    LEFT JOIN
        suppliers sup ON sup.supplier_id = p.supplier_id
    WHERE
        (category_id_param IS NULL OR p.category_id = category_id_param)
        AND (supplier_id_param IS NULL OR p.supplier_id = supplier_id_param)
        AND (status_filter IS NULL 
             OR (status_filter = 'LOW_STOCK' AND s.quantity <= p.reorder_level AND s.quantity > 0)
             OR (status_filter = 'OUT_OF_STOCK' AND s.quantity = 0)
             OR (status_filter = 'OK' AND s.quantity > p.reorder_level));
    
    -- Log report generation
    INSERT INTO report_logs (report_name, parameters)
    VALUES ('stock_status', JSON_OBJECT(
        'category_id', category_id_param,
        'supplier_id', supplier_id_param,
        'status_filter', status_filter
    ));
END$$

DELIMITER ;

-- -----------------------------------------------------
-- View `inventory_system`.`view_daily_flow`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `inventory_system`.`view_daily_flow`;
USE `inventory_system`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventory_system`.`view_daily_flow` AS select cast(`inventory_system`.`transactions`.`created_at` as date) AS `date`,`inventory_system`.`transactions`.`transaction_type` AS `transaction_type`,sum(`inventory_system`.`transactions`.`quantity`) AS `total_quantity` from `inventory_system`.`transactions` group by cast(`inventory_system`.`transactions`.`created_at` as date),`inventory_system`.`transactions`.`transaction_type` order by `date` desc;

-- -----------------------------------------------------
-- View `inventory_system`.`view_inventory_valuation`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `inventory_system`.`view_inventory_valuation`;
USE `inventory_system`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventory_system`.`view_inventory_valuation` AS select `p`.`product_id` AS `product_id`,`p`.`name` AS `name`,`s`.`quantity` AS `quantity`,`p`.`unit_cost` AS `unit_cost`,(`s`.`quantity` * `p`.`unit_cost`) AS `total_value`,`w`.`name` AS `warehouse` from ((`inventory_system`.`stock` `s` join `inventory_system`.`products` `p` on((`p`.`product_id` = `s`.`product_id`))) join `inventory_system`.`warehouses` `w` on((`w`.`warehouse_id` = `s`.`warehouse_id`)));

-- -----------------------------------------------------
-- View `inventory_system`.`view_product_movement`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `inventory_system`.`view_product_movement`;
USE `inventory_system`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventory_system`.`view_product_movement` AS select `p`.`name` AS `product_name`,sum((case when (`t`.`transaction_type` = 'in') then `t`.`quantity` else 0 end)) AS `total_in`,sum((case when (`t`.`transaction_type` = 'out') then `t`.`quantity` else 0 end)) AS `total_out` from (`inventory_system`.`transactions` `t` join `inventory_system`.`products` `p` on((`p`.`product_id` = `t`.`product_id`))) group by `p`.`name`;

-- -----------------------------------------------------
-- View `inventory_system`.`view_stock_summary`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `inventory_system`.`view_stock_summary`;
USE `inventory_system`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventory_system`.`view_stock_summary` AS select `s`.`stock_id` AS `stock_id`,`p`.`name` AS `product_name`,`w`.`name` AS `warehouse`,`s`.`quantity` AS `quantity`,`p`.`reorder_level` AS `reorder_level`,(case when (`s`.`quantity` <= `p`.`reorder_level`) then 'LOW STOCK' else 'OK' end) AS `stock_status` from ((`inventory_system`.`stock` `s` join `inventory_system`.`products` `p` on((`p`.`product_id` = `s`.`product_id`))) join `inventory_system`.`warehouses` `w` on((`w`.`warehouse_id` = `s`.`warehouse_id`)));
USE `inventory_system`;

DELIMITER $$
USE `inventory_system`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `inventory_system`.`after_po_status_change`
AFTER UPDATE ON `inventory_system`.`purchase_orders`
FOR EACH ROW
BEGIN
    -- Only log when status changes
    IF OLD.status <> NEW.status THEN
        INSERT INTO po_status_history 
            (po_id, old_status, new_status, changed_by, notes)
        VALUES 
            (NEW.po_id, OLD.status, NEW.status, NEW.ordered_by, 
             CONCAT('Status changed from ', OLD.status, ' to ', NEW.status));
    END IF;
END$$

USE `inventory_system`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `inventory_system`.`after_stock_insert`
AFTER INSERT ON `inventory_system`.`stock`
FOR EACH ROW
BEGIN
    DECLARE threshold INT;
    
    -- Get the reorder level from the product
    SELECT reorder_level INTO threshold 
    FROM products 
    WHERE product_id = NEW.product_id;
    
    -- Check if the new stock is already below threshold
    IF NEW.quantity <= threshold AND NEW.quantity > 0 THEN
        -- Create low stock alert
        INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type)
        VALUES 
            (NEW.product_id, NEW.warehouse_id, NEW.quantity, threshold, 'low_stock');
    ELSEIF NEW.quantity = 0 THEN
        -- Create out of stock alert
        INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type)
        VALUES 
            (NEW.product_id, NEW.warehouse_id, 0, threshold, 'out_of_stock');
    END IF;
END$$

USE `inventory_system`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `inventory_system`.`after_stock_update`
AFTER UPDATE ON `inventory_system`.`stock`
FOR EACH ROW
BEGIN
    DECLARE threshold INT;
    
    -- Get the reorder level from the product
    SELECT reorder_level INTO threshold 
    FROM products 
    WHERE product_id = NEW.product_id;
    
    -- Check if stock has fallen below threshold
    IF NEW.quantity <= threshold AND NEW.quantity > 0 AND (OLD.quantity > threshold OR OLD.quantity IS NULL) THEN
        -- Create low stock alert
        INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type)
        VALUES 
            (NEW.product_id, NEW.warehouse_id, NEW.quantity, threshold, 'low_stock');
    ELSEIF NEW.quantity = 0 AND OLD.quantity > 0 THEN
        -- Create out of stock alert
        INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type)
        VALUES 
            (NEW.product_id, NEW.warehouse_id, 0, threshold, 'out_of_stock');
    END IF;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
