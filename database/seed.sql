-- =============================================================================
-- Online Book Inventory & Reservation System
-- Sample Seed Data
-- Database: library_db
-- =============================================================================

USE `library_db`;

-- Disable foreign key checks for clean truncation and insertion
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `reservations`;
TRUNCATE TABLE `books`;
TRUNCATE TABLE `authors`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Seed: users
-- Passwords below are standard bcrypt hash placeholders for development:
-- e.g. '$2b$10$e8N8yQ9wE9zY7o9v5VbE6OXzG7.qK0O/F5r6i4D8k9H0G1J2L3M4N'
-- Default dev credentials:
-- admin@library.edu       -> Admin@123 (role: ADMIN)
-- rahul.sharma@college.edu -> Student@123 (role: USER)
-- priya.patel@college.edu  -> Student@123 (role: USER)
-- arun.kumar@college.edu   -> Student@123 (role: USER)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'System Administrator', 'admin@library.edu', '$2b$10$wyUhqpdxK6yoidHlsLuy0.XadBvvA8SzV0xuPP2BNdNGj8TgfkYAa', 'ADMIN', NOW()),
(2, 'Rahul Sharma', 'rahul.sharma@college.edu', '$2b$10$60jLoI9gZoIghCpzItVd2.V15HToDSExb3vCdXQ.RV3j0egTW3a8e', 'USER', NOW()),
(3, 'Priya Patel', 'priya.patel@college.edu', '$2b$10$60jLoI9gZoIghCpzItVd2.V15HToDSExb3vCdXQ.RV3j0egTW3a8e', 'USER', NOW()),
(4, 'Arun Kumar', 'arun.kumar@college.edu', '$2b$10$60jLoI9gZoIghCpzItVd2.V15HToDSExb3vCdXQ.RV3j0egTW3a8e', 'USER', NOW());

-- -----------------------------------------------------------------------------
-- 2. Seed: authors (6 Authors)
-- -----------------------------------------------------------------------------
INSERT INTO `authors` (`id`, `name`, `biography`, `created_at`) VALUES
(1, 'Robert C. Martin', 'Renowned software engineer known as Uncle Bob, co-author of Agile Manifesto and author of Clean Code.', NOW()),
(2, 'Martin Fowler', 'Chief Scientist at ThoughtWorks, author of books on software architecture, refactoring, and enterprise patterns.', NOW()),
(3, 'Thomas H. Cormen', 'Professor Emeritus of Computer Science at Dartmouth College and co-author of Introduction to Algorithms (CLRS).', NOW()),
(4, 'Andrew S. Tanenbaum', 'Professor of Computer Science at Vrije Universiteit Amsterdam, famous for MINIX and computer networking textbooks.', NOW()),
(5, 'Abraham Silberschatz', 'Sidney J. Weinberg Professor of Computer Science at Yale University, widely known for Database System Concepts.', NOW()),
(6, 'Joshua Bloch', 'Software engineer and author who led the design and implementation of numerous Java platform features.', NOW());

-- -----------------------------------------------------------------------------
-- 3. Seed: books (11 Books: 10 with Authors, 1 with NULL author for LEFT JOIN test)
-- -----------------------------------------------------------------------------
INSERT INTO `books` (`id`, `title`, `isbn`, `author_id`, `category`, `total_copies`, `available_copies`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Clean Code', '978-0132350884', 1, 'Software Engineering', 5, 4, 'A handbook of agile software craftsmanship focusing on writing clean, maintainable code.', NOW(), NOW()),
(2, 'Refactoring', '978-0201485677', 2, 'Software Engineering', 4, 4, 'Improving the design of existing code through structured and safe refactoring techniques.', NOW(), NOW()),
(3, 'Introduction to Algorithms', '978-0262033848', 3, 'Algorithms', 6, 5, 'Comprehensive textbook covering a broad range of algorithms in depth with rigorous analysis.', NOW(), NOW()),
(4, 'Computer Networks', '978-0132126953', 4, 'Networking', 5, 4, 'Classic networking textbook covering layered network architectures from physical to application layer.', NOW(), NOW()),
(5, 'Operating System Concepts', '978-1118063330', 5, 'Operating Systems', 6, 6, 'Fundamental operating system principles including process management, memory, storage, and security.', NOW(), NOW()),
(6, 'Database System Concepts', '978-0073523323', 5, 'Databases', 5, 4, 'Foundational guide to relational database architecture, SQL, transaction processing, and concurrency.', NOW(), NOW()),
(7, 'Effective Java', '978-0134685991', 6, 'Programming', 4, 4, 'Essential best-practices guide for Java programming language idioms, concurrency, and OOP design.', NOW(), NOW()),
(8, 'Clean Architecture', '978-0134494166', 1, 'Architecture', 3, 3, 'A craftsman guide to software structure and design rules for building resilient systems.', NOW(), NOW()),
(9, 'Patterns of Enterprise Application Architecture', '978-0321127426', 2, 'Architecture', 3, 3, 'Practical guide to architectural patterns for enterprise software applications.', NOW(), NOW()),
(10, 'Modern Operating Systems', '978-0133591620', 4, 'Operating Systems', 4, 4, 'In-depth exploration of modern operating system implementations, virtualization, and distributed systems.', NOW(), NOW()),
(11, 'Departmental Seminar & Research Guide', '978-9999000011', NULL, 'General', 2, 2, 'Departmental research guide and curriculum reference handbook published by the faculty.', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 4. Seed: reservations
-- -----------------------------------------------------------------------------
INSERT INTO `reservations` (`id`, `user_id`, `book_id`, `reservation_date`, `status`) VALUES
(1, 2, 1, DATE_SUB(NOW(), INTERVAL 14 DAY), 'COMPLETED'),
(2, 3, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), 'APPROVED'),
(3, 2, 6, DATE_SUB(NOW(), INTERVAL 1 DAY), 'PENDING'),
(4, 4, 2, DATE_SUB(NOW(), INTERVAL 5 DAY), 'CANCELLED');

-- -----------------------------------------------------------------------------
-- 5. Seed: transactions
-- Note: available_copies in books table reflect the active 'ISSUED' & 'OVERDUE' records:
-- Book 1: total 5, 1 ISSUED   -> available 4
-- Book 3: total 6, 1 ISSUED   -> available 5
-- Book 4: total 5, 1 OVERDUE  -> available 4
-- Book 6: total 5, 1 ISSUED   -> available 4
-- Book 7: total 4, 1 RETURNED -> available 4
-- -----------------------------------------------------------------------------
INSERT INTO `transactions` (`id`, `user_id`, `book_id`, `reservation_id`, `issue_date`, `due_date`, `return_date`, `status`) VALUES
(1, 2, 1, 1, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), NULL, 'ISSUED'),
(2, 3, 4, NULL, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OVERDUE'),
(3, 2, 7, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 'RETURNED'),
(4, 4, 3, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, 'ISSUED'),
(5, 3, 6, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 11 DAY), NULL, 'ISSUED');
