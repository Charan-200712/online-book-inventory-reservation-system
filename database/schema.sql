-- =============================================================================
-- Online Book Inventory & Reservation System
-- Database Schema Definition
-- Database: library_db
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `library_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `library_db`;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `authors`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: authors
-- -----------------------------------------------------------------------------
CREATE TABLE `authors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `biography` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_authors_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: books
-- -----------------------------------------------------------------------------
CREATE TABLE `books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `isbn` VARCHAR(20) NOT NULL UNIQUE,
  `author_id` INT NULL,
  `category` VARCHAR(50) NOT NULL,
  `total_copies` INT NOT NULL DEFAULT 1,
  `available_copies` INT NOT NULL DEFAULT 1,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_books_author`
    FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `chk_total_copies`
    CHECK (`total_copies` >= 0),
  CONSTRAINT `chk_available_copies`
    CHECK (`available_copies` >= 0),
  CONSTRAINT `chk_copies_valid`
    CHECK (`available_copies` <= `total_copies`),
  INDEX `idx_books_author` (`author_id`),
  INDEX `idx_books_title` (`title`),
  INDEX `idx_books_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: reservations
-- -----------------------------------------------------------------------------
CREATE TABLE `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `reservation_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  CONSTRAINT `fk_reservations_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_book`
    FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX `idx_reservations_user` (`user_id`),
  INDEX `idx_reservations_book` (`book_id`),
  INDEX `idx_reservations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: transactions
-- -----------------------------------------------------------------------------
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `reservation_id` INT NULL,
  `issue_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATE NOT NULL,
  `return_date` DATE NULL,
  `status` ENUM('ISSUED', 'RETURNED', 'OVERDUE') NOT NULL DEFAULT 'ISSUED',
  CONSTRAINT `fk_transactions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_transactions_book`
    FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_transactions_reservation`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX `idx_transactions_user` (`user_id`),
  INDEX `idx_transactions_book` (`book_id`),
  INDEX `idx_transactions_reservation` (`reservation_id`),
  INDEX `idx_transactions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
