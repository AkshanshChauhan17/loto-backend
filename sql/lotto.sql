-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 20, 2025 at 03:45 PM
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
('323ff186-d6c6-4c99-907f-068bd8', 9913.00),
('cecec135-dec4-43dd-8529-e2ec08', 10000.00);

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
('323ff186-d6c6-4c99-907f-068bd8', 'user', '1234567820', '$2a$10$abHG.CS0IdaZBYVwMxM7DO8TvS7d7KgPjEAdkKzDOqSeog1okRWZq', '2025-08-13 11:28:36', 'cashier1@example.com'),
('cecec135-dec4-43dd-8529-e2ec08', 'user', '8922334433', '$2a$10$XvBvJMo91KCVQWCP4TiFNuttxyaxD1SgCHV.Xxl/nArsblAd0Ngsq', '2025-08-14 09:14:40', 'cashier1@example.com');

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
-- Table structure for table `results`
--

CREATE TABLE `results` (
  `id` int(11) NOT NULL,
  `game_id` int(4) NOT NULL,
  `winning_numbers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`winning_numbers`)),
  `bonus` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `results`
--

INSERT INTO `results` (`id`, `game_id`, `winning_numbers`, `bonus`, `created_at`) VALUES
(10, 1, '[1,2,3,4,5,6]', 4, '2025-08-20 11:10:15'),
(11, 1, '[1,2,3,4,5,6]', 4, '2025-08-20 11:11:32'),
(12, 1, '[1,2,3,4,5,6]', 4, '2025-08-20 11:12:43'),
(18, 1, '[1,2,3,4,5,6]', 4, '2025-08-20 12:27:49'),
(19, 1, '[1]', 4, '2025-08-20 12:42:03'),
(20, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 12:45:50'),
(21, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 12:48:51'),
(22, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 12:58:30'),
(23, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 13:08:58'),
(24, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 13:11:42'),
(25, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 13:15:46'),
(26, 1, '[2,4,1,7,8,5]', 4, '2025-08-20 13:35:29');

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
(6, 'T1755089449967324', '323ff186-d6c6-4c99-907f-068bd8', 1, 5, 1, NULL, 3.00, 'WON', 0, '2025-08-13 12:50:49'),
(7, 'T1755089582066289', '323ff186-d6c6-4c99-907f-068bd8', 1, 5, 1, NULL, 18.00, 'WON', 0, '2025-08-13 12:53:02'),
(8, 'T175515254068115', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 18.00, 'VOID', 1, '2025-08-14 06:22:20'),
(9, 'T1755152779509893', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-14 06:26:19'),
(10, 'T1755153158796424', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-14 06:32:38'),
(11, 'T1755153252390845', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-14 06:34:12'),
(12, 'T1755153394179484', '323ff186-d6c6-4c99-907f-068bd8', 1, 5, 1, NULL, 2.00, 'WON', 0, '2025-08-14 06:36:34'),
(13, 'T1755525493567488', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-18 13:58:13'),
(14, 'T1755525631510613', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-18 14:00:31'),
(15, 'T175552633836281', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 9.00, 'WON', 0, '2025-08-18 14:12:18'),
(16, 'T1755526417571876', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 9.00, 'WON', 0, '2025-08-18 14:13:37'),
(17, 'T1755527842919384', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 4.00, 'WON', 0, '2025-08-18 14:37:22'),
(18, 'T1755528003199600', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 13.00, 'WON', 0, '2025-08-18 14:40:03'),
(19, 'T1755528264708740', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-18 14:44:24'),
(20, 'T175552851392263', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-18 14:48:33'),
(21, 'T1755528537279371', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-18 14:48:57'),
(22, 'T1755530317062712', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 4.00, 'WON', 0, '2025-08-18 15:18:37'),
(23, 'T1755530840965800', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-18 15:27:20'),
(24, 'T1755533766010988', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'LOST', 0, '2025-08-18 16:16:06'),
(25, 'T1755581150711547', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 05:25:50'),
(26, 'T1755581289135191', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 6.00, 'WON', 0, '2025-08-19 05:28:09'),
(27, 'T1755585678672520', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 3.00, 'WON', 0, '2025-08-19 06:41:18'),
(28, 'T1755586853665379', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:00:53'),
(29, 'T175558763280883', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:13:52'),
(30, 'T175558891835945', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'LOST', 0, '2025-08-19 07:35:18'),
(31, 'T1755589097333965', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:38:17'),
(32, 'T1755589199961244', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:39:59'),
(33, 'T1755589213690478', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:40:13'),
(34, 'T1755589299407975', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 07:41:39'),
(35, 'T1755594301593993', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:05:01'),
(36, 'T1755595054282332', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:17:34'),
(37, 'T1755595194908836', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:19:54'),
(38, 'T175559522476848', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:20:24'),
(39, 'T1755595398128313', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:23:18'),
(40, 'T1755595412796157', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:23:32'),
(41, 'T1755595461895859', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:24:21'),
(42, 'T1755595770514607', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:29:30'),
(43, 'T1755595957111828', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 3.00, 'LOST', 0, '2025-08-19 09:32:37'),
(44, 'T1755596121577892', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 09:35:21'),
(45, 'T1755602406552762', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 11:20:06'),
(46, 'T1755604270399430', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 11:51:10'),
(47, 'T1755604285133465', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 11:51:25'),
(48, 'T1755604322898669', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 1.00, 'WON', 0, '2025-08-19 11:52:02'),
(49, 'T1755604498710289', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 73.00, 'WON', 0, '2025-08-19 11:54:58'),
(50, 'T1755682384058405', '323ff186-d6c6-4c99-907f-068bd8', 1, 323, 1, NULL, 2.00, 'WON', 0, '2025-08-20 09:33:04');

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
(1, 6, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(2, 6, 'C2', '2,3', 2.00, 0.00, 'LOSE', 0.00),
(3, 7, 'C1', '1', 9.00, 0.00, 'WIN', 45.00),
(4, 7, 'C2', '2,3', 9.00, 0.00, 'LOSE', 0.00),
(5, 8, 'C1', '1', 9.00, 0.00, 'VOID', 0.00),
(6, 8, 'C2', '2,3', 9.00, 0.00, 'VOID', 0.00),
(7, 9, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(8, 9, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(9, 10, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(10, 10, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(11, 11, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(12, 11, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(13, 12, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(14, 12, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(15, 13, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(16, 13, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(17, 14, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(18, 14, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00),
(19, 15, 'C1', '1', 0.33, 0.00, 'WIN', 1.65),
(20, 15, 'C1', '2', 0.33, 0.00, 'WIN', 1.65),
(21, 15, 'C1', '3', 0.33, 0.00, 'LOSE', 0.00),
(22, 15, 'C1', '1', 4.00, 0.00, 'WIN', 20.00),
(23, 15, 'C1', '2', 4.00, 0.00, 'WIN', 20.00),
(24, 16, 'C1', '1', 0.33, 0.00, 'WIN', 1.65),
(25, 16, 'C1', '2', 0.33, 0.00, 'WIN', 1.65),
(26, 16, 'C1', '3', 0.33, 0.00, 'LOSE', 0.00),
(27, 16, 'C1', '1', 4.00, 0.00, 'WIN', 20.00),
(28, 16, 'C1', '2', 4.00, 0.00, 'WIN', 20.00),
(29, 17, 'C1', '1', 2.00, 0.00, 'WIN', 10.00),
(30, 17, 'C1', '2', 2.00, 0.00, 'WIN', 10.00),
(31, 18, 'C1', '1', 6.50, 0.00, 'WIN', 32.50),
(32, 18, 'C1', '2', 6.50, 0.00, 'WIN', 32.50),
(33, 19, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(34, 20, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(35, 21, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(36, 22, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(37, 22, 'C1', '2', 1.00, 0.00, 'WIN', 5.00),
(38, 22, 'C1', '3', 1.00, 0.00, 'LOSE', 0.00),
(39, 22, 'C1', '4', 1.00, 0.00, 'WIN', 5.00),
(40, 23, 'C1', '1', 0.25, 0.00, 'WIN', 1.25),
(41, 23, 'C1', '2', 0.25, 0.00, 'WIN', 1.25),
(42, 23, 'C1', '3', 0.25, 0.00, 'LOSE', 0.00),
(43, 23, 'C1', '4', 0.25, 0.00, 'WIN', 1.25),
(44, 23, 'BONUS', '1', 1.00, 0.00, 'LOSE', 0.00),
(45, 24, 'C3', '1', 1.00, 0.00, 'LOSE', 0.00),
(46, 24, '', '1', 1.00, 0.00, 'LOSE', 0.00),
(47, 25, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(48, 26, 'C1', '1', 3.00, 0.00, 'WIN', 15.00),
(49, 26, 'C1', '2', 3.00, 0.00, 'WIN', 15.00),
(50, 27, 'C1', '1', 3.00, 0.00, 'WIN', 15.00),
(51, 28, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(52, 29, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(53, 30, 'BONUS', '1', 1.00, 0.00, 'LOSE', 0.00),
(54, 31, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(55, 32, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(56, 33, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(57, 34, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(58, 35, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(59, 36, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(60, 37, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(61, 38, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(62, 39, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(63, 40, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(64, 41, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(65, 42, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(66, 43, 'C2', '1', 3.00, 0.00, 'LOSE', 0.00),
(67, 44, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(68, 45, 'C1', '1', 0.10, 0.00, 'WIN', 0.50),
(69, 45, 'C1', '2', 0.10, 0.00, 'WIN', 0.50),
(70, 45, 'C1', '3', 0.10, 0.00, 'LOSE', 0.00),
(71, 45, 'C1', '4', 0.10, 0.00, 'WIN', 0.50),
(72, 45, 'C1', '5', 0.10, 0.00, 'WIN', 0.50),
(73, 45, 'C1', '6', 0.10, 0.00, 'LOSE', 0.00),
(74, 45, 'C1', '7', 0.10, 0.00, 'WIN', 0.50),
(75, 45, 'C1', '8', 0.10, 0.00, 'WIN', 0.50),
(76, 45, 'C1', '9', 0.10, 0.00, 'LOSE', 0.00),
(77, 45, 'C1', '10', 0.10, 0.00, 'LOSE', 0.00),
(78, 46, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(79, 47, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(80, 48, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(81, 49, 'C1', '1', 73.00, 0.00, 'WIN', 365.00),
(82, 50, 'C1', '1', 1.00, 0.00, 'WIN', 5.00),
(83, 50, 'C2', '2,3,4,5', 1.00, 0.00, 'LOSE', 0.00);

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
-- Indexes for table `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `ticket_lines`
--
ALTER TABLE `ticket_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `topups`
--
ALTER TABLE `topups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
