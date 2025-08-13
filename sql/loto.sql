-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 13, 2025 at 03:19 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `loto`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `customer_id` varchar(30) NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`customer_id`, `balance`) VALUES
('323ff186-d6c6-4c99-907f-068bd8', 79.00);

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `action` varchar(120) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
  `id` int(11) NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `severity` enum('LOW','MEDIUM','HIGH') DEFAULT 'LOW',
  `message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cash_transactions`
--

CREATE TABLE `cash_transactions` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `type` enum('FLOAT','PICKUP','DROPOFF','PAYOUT') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `pin_hash` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `phone`, `pin_hash`, `created_at`, `email`) VALUES
('1', 'cashier1', '1234567890', '$2a$10$l661z2FLVxlCyHpfRdEvEurxHoR4PcmLnyAbc0spVykCJHxVmH44q', '2025-08-13 10:58:55', 'cashier1@example.com'),
('323ff186-d6c6-4c99-907f-068bd8', 'user', '1234567820', '$2a$10$abHG.CS0IdaZBYVwMxM7DO8TvS7d7KgPjEAdkKzDOqSeog1okRWZq', '2025-08-13 11:28:36', 'cashier1@example.com');

-- --------------------------------------------------------

--
-- Table structure for table `discounts`
--

CREATE TABLE `discounts` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `bet_type` varchar(20) NOT NULL,
  `percent` decimal(5,2) NOT NULL,
  `min_bet` decimal(12,2) NOT NULL DEFAULT 0.00,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_credits`
--

CREATE TABLE `discount_credits` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `ticket_id_source` int(11) DEFAULT NULL,
  `amount_remaining` decimal(12,2) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draws`
--

CREATE TABLE `draws` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `draw_date` datetime NOT NULL,
  `main_numbers` varchar(64) NOT NULL,
  `bonus_number` varchar(8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `number_range_min` int(11) NOT NULL,
  `number_range_max` int(11) NOT NULL,
  `main_draw_count` int(11) NOT NULL,
  `bonus_draw_count` int(11) NOT NULL DEFAULT 0,
  `schedule` varchar(120) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(200) NOT NULL,
  `role` enum('ADMIN','MANAGER','CASHIER') NOT NULL DEFAULT 'CASHIER',
  `store_id` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `username`, `password_hash`, `role`, `store_id`, `active`, `created_at`) VALUES
(5, 'cashier1', '$2a$10$zeLDPrsj0rgXeKD5GvUMxeBVGA66NEsMH1khxQat59QbzkwYdnQZe', 'CASHIER', NULL, 1, '2025-08-13 07:48:53'),
(8, 'USER1', '$2a$10$QL3wKxq.jvGkFIaThjK8K.frNRJ3mOX23NLikFrAd9txbGjRpftOq', '', NULL, 1, '2025-08-13 07:59:01');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `serial` varchar(40) NOT NULL,
  `customer_id` varchar(30) NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `game_id` int(11) NOT NULL,
  `draw_id` int(11) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `status` enum('PENDING','WON','LOST','VOID','EXCHANGED') NOT NULL DEFAULT 'PENDING',
  `is_copy` tinyint(1) NOT NULL DEFAULT 0,
  `purchase_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `serial`, `customer_id`, `store_id`, `staff_id`, `game_id`, `draw_id`, `total_amount`, `status`, `is_copy`, `purchase_time`) VALUES
(6, 'T1755089449967324', '323ff186-d6c6-4c99-907f-068bd8', 1, 5, 1, NULL, 3.00, 'PENDING', 0, '2025-08-13 12:50:49'),
(7, 'T1755089582066289', '323ff186-d6c6-4c99-907f-068bd8', 1, 5, 1, NULL, 18.00, 'PENDING', 0, '2025-08-13 12:53:02');

-- --------------------------------------------------------

--
-- Table structure for table `ticket_lines`
--

CREATE TABLE `ticket_lines` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `bet_type` enum('C1','C2','C3','C2C3','C4','JACKPOT','BONUS','PICK2','PICK3') NOT NULL,
  `numbers` varchar(80) NOT NULL,
  `stake` decimal(12,2) NOT NULL,
  `payout_multiplier` decimal(12,2) DEFAULT 0.00,
  `status` enum('PENDING','WIN','LOSE','VOID') NOT NULL DEFAULT 'PENDING',
  `win_amount` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ticket_lines`
--

INSERT INTO `ticket_lines` (`id`, `ticket_id`, `bet_type`, `numbers`, `stake`, `payout_multiplier`, `status`, `win_amount`) VALUES
(1, 6, 'C1', '1', 1.00, 0.00, 'PENDING', 0.00),
(2, 6, 'C2', '2,3', 2.00, 0.00, 'PENDING', 0.00),
(3, 7, 'C1', '1', 9.00, 0.00, 'PENDING', 0.00),
(4, 7, 'C2', '2,3', 9.00, 0.00, 'PENDING', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `topups`
--

CREATE TABLE `topups` (
  `id` int(11) NOT NULL,
  `customer_id` varchar(30) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` varchar(20) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `store_id` int(11) DEFAULT NULL,
  `receipt_id` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `topups`
--

INSERT INTO `topups` (`id`, `customer_id`, `amount`, `method`, `staff_id`, `store_id`, `receipt_id`, `created_at`) VALUES
(6, '323ff186-d6c6-4c99-907f-068bd8', 50.00, 'CASH', 5, NULL, 'RCPT123', '2025-08-13 11:35:52'),
(7, '323ff186-d6c6-4c99-907f-068bd8', 50.00, 'CASH', 5, NULL, 'RCPT123', '2025-08-13 11:38:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cash_transactions`
--
ALTER TABLE `cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `manager_id` (`manager_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indexes for table `discount_credits`
--
ALTER TABLE `discount_credits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indexes for table `draws`
--
ALTER TABLE `draws`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `serial` (`serial`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `draw_id` (`draw_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `ticket_lines`
--
ALTER TABLE `ticket_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Indexes for table `topups`
--
ALTER TABLE `topups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alerts`
--
ALTER TABLE `alerts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cash_transactions`
--
ALTER TABLE `cash_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discounts`
--
ALTER TABLE `discounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discount_credits`
--
ALTER TABLE `discount_credits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draws`
--
ALTER TABLE `draws`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `ticket_lines`
--
ALTER TABLE `ticket_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `topups`
--
ALTER TABLE `topups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
