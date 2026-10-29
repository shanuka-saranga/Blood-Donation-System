-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 22, 2026 at 10:42 AM
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
-- Database: `blood_donation_db`
--

CREATE DATABASE `blood_donation_db`;
USE `blood_donation_db`;

-- --------------------------------------------------------

--
-- Table structure for table `blood_inventory`
--

CREATE TABLE `blood_inventory` (
  `id` int(11) NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `available_units` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_inventory`
--

INSERT INTO `blood_inventory` (`id`, `blood_group`, `available_units`, `last_updated`) VALUES
(1, 'A+', 0, '2026-10-19 13:54:55'),
(2, 'A-', 0, '2026-10-19 13:54:55'),
(3, 'B+', 0, '2026-10-19 13:54:55'),
(4, 'B-', 0, '2026-10-19 13:54:55'),
(5, 'AB+', 0, '2026-10-19 13:54:55'),
(6, 'AB-', 0, '2026-10-19 13:54:55'),
(7, 'O+', 0, '2026-10-19 13:54:55'),
(8, 'O-', 0, '2026-10-19 13:54:55');

-- --------------------------------------------------------

--
-- Table structure for table `blood_requests`
--

CREATE TABLE `blood_requests` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `units_required` int(11) NOT NULL DEFAULT 1,
  `hospital_name` varchar(150) NOT NULL,
  `city` varchar(100) NOT NULL,
  `contact_number` varchar(15) NOT NULL,
  `urgency_level` enum('Normal','Urgent','Critical') DEFAULT 'Normal',
  `status` enum('Pending','Approved','Fulfilled','Cancelled') DEFAULT 'Pending',
  `required_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `urgency` varchar(20) NOT NULL DEFAULT 'standard',
  `accepted_by` int(11) DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_requests`
--

INSERT INTO `blood_requests` (`id`, `requester_id`, `patient_name`, `blood_group`, `units_required`, `hospital_name`, `city`, `contact_number`, `urgency_level`, `status`, `required_date`, `created_at`, `urgency`, `accepted_by`, `accepted_at`, `updated_at`) VALUES
(6, 3, 'Kamal Perera', 'AB+', 2, 'Teaching Hospital Karapitiya', 'Galle', '0771234567', 'Critical', '', '2026-10-21', '2026-10-20 11:55:14', 'standard', 3, '2026-10-20 12:05:46', '2026-10-20 12:05:46'),
(7, 3, 'Nimali Silva', 'A+', 3, 'National Hospital of Sri Lanka', 'Colombo', '0719876543', 'Urgent', '', '2026-10-22', '2026-10-20 11:55:14', 'standard', 3, '2026-10-21 11:14:23', '2026-10-21 11:14:23'),
(8, 3, 'saeanga', 'B+', 1, 'marae', 'tng', '4525423', 'Critical', 'Pending', '2026-10-29', '2026-10-21 10:04:54', 'standard', NULL, NULL, '2026-10-21 10:04:54'),
(9, 3, 'saranga', 'B+', 1, 'dthdh', 'rgrgr', '435', '', 'Pending', '2026-10-29', '2026-10-21 13:51:36', 'standard', NULL, NULL, '2026-10-21 13:51:36'),
(11, 2, 'bloodmoneeee', 'A+', 1, 'matara', 'matara', '563453', 'Urgent', '', '2026-10-30', '2026-10-21 13:58:00', 'standard', 3, '2026-10-21 15:20:00', '2026-10-21 15:20:00'),
(12, 3, 'dvsdv', 'A+', 1, 'dsvsd', 'dsvds', '853', '', 'Pending', '2026-10-28', '2026-10-21 09:34:37', 'standard', NULL, NULL, '2026-10-21 15:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `donation_camps`
--

CREATE TABLE `donation_camps` (
  `id` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `organizer` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `camp_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `contact_number` varchar(15) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donation_camps`
--

INSERT INTO `donation_camps` (`id`, `created_by`, `title`, `organizer`, `location`, `city`, `camp_date`, `start_time`, `end_time`, `contact_number`, `description`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Ruhuna Technology Blood Donation Campaign', 'Faculty of Technology - University of Ruhuna', 'Faculty Auditorium, Kamburupitiya', 'Matara', '2026-11-05', '08:30:00', '15:00:00', '0771234567', 'Organized by the Technology Faculty Student Council in collaboration with Matara General Hospital Blood Bank.', '2026-10-21 10:09:54', '2026-10-21 10:09:54'),
(2, NULL, 'Colombo National Blood Drive 2026', 'Rotaract Club of Colombo Central', 'Viharamahadevi Park Main Pavilion', 'Colombo', '2026-11-12', '09:00:00', '16:00:00', '0719876543', 'Annual mega blood donation campaign. All eligible donors in Colombo district are welcome.', '2026-10-21 10:09:54', '2026-10-21 10:09:54'),
(3, NULL, 'Kandy Hill Country Blood Care Camp', 'Leo Club of Kandy Royal', 'Kandy City Centre (KCC) Main Hall', 'Kandy', '2026-11-20', '09:00:00', '15:30:00', '0751122334', 'Special blood collection drive for Kandy Teaching Hospital blood bank stock replenishment.', '2026-10-21 10:09:54', '2026-10-21 10:09:54'),
(4, NULL, 'Galle Coastal Heroes Blood Drive', 'Galle Youth Foundation & Karapitiya Blood Bank', 'Town Hall Auditorium', 'Galle', '2026-11-28', '08:00:00', '14:30:00', '0765544332', 'Urgent request for A+ and O- blood groups. Refreshments and certificates will be provided.', '2026-10-21 10:09:54', '2026-10-21 10:09:54'),
(5, 4, 'MAtara donation', 'event blood', 'matara', 'matara', '2026-10-30', '08:37:00', '12:41:00', '53656356354', NULL, '2026-10-21 13:05:32', '2026-10-21 13:05:32');

-- --------------------------------------------------------

--
-- Table structure for table `donation_history`
--

CREATE TABLE `donation_history` (
  `id` int(11) NOT NULL,
  `donor_id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `donated_date` date NOT NULL,
  `units_donated` int(11) DEFAULT 1,
  `hospital_name` varchar(150) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `donation_records`
--

CREATE TABLE `donation_records` (
  `id` int(11) NOT NULL,
  `donor_id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `donated_date` date NOT NULL,
  `units_donated` decimal(4,2) NOT NULL,
  `hospital_name` varchar(150) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donation_records`
--

INSERT INTO `donation_records` (`id`, `donor_id`, `request_id`, `donated_date`, `units_donated`, `hospital_name`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, NULL, '2026-10-20', 1.00, 'matara', 'completed', '2026-10-20 11:40:59', '2026-10-20 11:40:59'),
(2, 3, NULL, '2026-10-06', 1.00, 'rth', 'completed', '2026-10-20 11:44:19', '2026-10-20 11:44:19'),
(3, 2, NULL, '2026-10-20', 1.00, 'sdf', 'completed', '2026-10-20 12:10:08', '2026-10-20 12:10:08'),
(4, 2, NULL, '2026-10-21', 1.00, 'matara', 'completed', '2026-10-21 03:25:11', '2026-10-21 03:25:11'),
(5, 3, NULL, '2026-10-15', 1.00, 'matara', 'completed', '2026-10-21 10:44:48', '2026-10-21 10:44:48'),
(6, 3, NULL, '2026-10-20', 1.00, 'yanbgask', 'completed', '2026-10-21 10:45:07', '2026-10-21 10:45:07'),
(7, 3, NULL, '2026-10-08', 1.00, 'tangall', 'completed', '2026-10-21 10:45:25', '2026-10-21 10:45:25'),
(8, 3, NULL, '2026-10-15', 2.00, 'tangalle', 'completed', '2026-10-21 10:47:33', '2026-10-21 10:47:33'),
(9, 3, NULL, '2026-10-04', 1.00, 'htfy', 'completed', '2026-10-21 10:49:23', '2026-10-21 10:49:23'),
(10, 3, NULL, '2026-10-04', 1.50, 'fb', 'completed', '2026-10-21 10:52:11', '2026-10-21 10:52:11'),
(11, 3, NULL, '2026-10-08', 2.00, 'yjyt', 'completed', '2026-10-21 10:53:32', '2026-10-21 10:53:32'),
(12, 3, NULL, '2026-10-11', 1.50, 'tangalle', 'completed', '2026-10-21 10:55:35', '2026-10-21 10:55:35'),
(13, 3, NULL, '2026-10-09', 1.50, 'mmn', 'completed', '2026-10-21 11:09:49', '2026-10-21 11:09:49'),
(14, 3, NULL, '2026-10-04', 1.00, 'tytyt', 'completed', '2026-10-21 11:13:50', '2026-10-21 11:13:50'),
(15, 3, NULL, '2026-10-01', 1.00, 'gn', 'completed', '2026-10-21 11:18:25', '2026-10-21 11:18:25'),
(16, 3, NULL, '2026-10-01', 1.00, 'hgmfn', 'completed', '2026-10-21 11:21:36', '2026-10-21 11:21:36'),
(17, 3, NULL, '2026-10-10', 1.00, 'hambantota', 'verified', '2026-10-21 11:22:09', '2026-10-21 11:22:09'),
(18, 3, NULL, '2026-10-06', 1.00, 'jhvjfgggg', 'completed', '2026-10-21 11:26:06', '2026-10-21 11:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `donor_details`
--

CREATE TABLE `donor_details` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `blood_group` varchar(5) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `nic` varchar(20) NOT NULL,
  `age` tinyint(3) UNSIGNED NOT NULL,
  `gender` varchar(20) NOT NULL,
  `city` varchar(100) NOT NULL,
  `last_donated_date` date DEFAULT NULL,
  `is_eligible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donor_details`
--

INSERT INTO `donor_details` (`id`, `user_id`, `blood_group`, `phone`, `nic`, `age`, `gender`, `city`, `last_donated_date`, `is_eligible`, `created_at`, `updated_at`) VALUES
(1, 2, 'B+', '54343453345', '56353', 53, 'Male', 'rrrrrrrrrrrrr', '2026-10-21', 0, '2026-10-20 10:59:40', '2026-10-21 03:25:11'),
(11, 3, 'A+', '4524525', '4554', 25, 'Female', 'gf', '2026-10-05', 0, '2026-10-20 11:29:07', '2026-10-21 13:56:58');

-- --------------------------------------------------------

--
-- Table structure for table `donor_profiles`
--

CREATE TABLE `donor_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `phone` varchar(15) NOT NULL,
  `nic` varchar(20) NOT NULL,
  `age` int(11) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `city` varchar(100) NOT NULL,
  `last_donated_date` date DEFAULT NULL,
  `is_eligible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','donor') NOT NULL DEFAULT 'donor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(30) DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `location` varchar(120) DEFAULT NULL,
  `profile_picture` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `phone`, `blood_group`, `location`, `profile_picture`) VALUES
(2, 'Shanuka', 'shanu@gmail.com', '$2b$10$cmaDL.Kc4rDRdu8FcLIGZe.N0mWiJkA4vpFa2VtEKXsF4guBlFJw6', 'donor', '2026-10-19 14:20:42', '54343453345', 'B+', 'rrrrrrrrrrrrr', NULL),
(3, 'shanuka', 'new@gmail.com', '$2b$10$GnrcehEKZlNC.hdtbC5Nr.v0s7twpIWRzUStfLw0VHzgOI.xHTl.i', 'donor', '2026-10-20 11:28:50', '4524525', 'A+', 'gwrg', NULL),
(4, 'admin', 'admin@gmail.com', '$2b$10$yXHT3LpIEcXFcqPW41P33OqkfrZQDlRaTjDbU7vid2v0.Qtq5Ho7W', 'admin', '2026-10-21 12:25:30', NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blood_inventory`
--
ALTER TABLE `blood_inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blood_group` (`blood_group`);

--
-- Indexes for table `blood_requests`
--
ALTER TABLE `blood_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_request_user` (`requester_id`);

--
-- Indexes for table `donation_camps`
--
ALTER TABLE `donation_camps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_camp_admin` (`created_by`);

--
-- Indexes for table `donation_history`
--
ALTER TABLE `donation_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_donation_donor` (`donor_id`),
  ADD KEY `fk_donation_request` (`request_id`);

--
-- Indexes for table `donation_records`
--
ALTER TABLE `donation_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_donation_records_donor` (`donor_id`);

--
-- Indexes for table `donor_details`
--
ALTER TABLE `donor_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `donor_profiles`
--
ALTER TABLE `donor_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nic` (`nic`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blood_inventory`
--
ALTER TABLE `blood_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `blood_requests`
--
ALTER TABLE `blood_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `donation_camps`
--
ALTER TABLE `donation_camps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `donation_history`
--
ALTER TABLE `donation_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `donation_records`
--
ALTER TABLE `donation_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `donor_details`
--
ALTER TABLE `donor_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `donor_profiles`
--
ALTER TABLE `donor_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blood_requests`
--
ALTER TABLE `blood_requests`
  ADD CONSTRAINT `fk_request_user` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `donation_camps`
--
ALTER TABLE `donation_camps`
  ADD CONSTRAINT `fk_camp_admin` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `donation_history`
--
ALTER TABLE `donation_history`
  ADD CONSTRAINT `fk_donation_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_donation_request` FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `donation_records`
--
ALTER TABLE `donation_records`
  ADD CONSTRAINT `fk_donation_records_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `donor_details`
--
ALTER TABLE `donor_details`
  ADD CONSTRAINT `fk_donor_details_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `donor_profiles`
--
ALTER TABLE `donor_profiles`
  ADD CONSTRAINT `fk_donor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
