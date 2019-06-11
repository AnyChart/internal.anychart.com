-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:18889
-- Generation Time: Jun 10, 2019 at 11:30 AM
-- Server version: 5.6.35
-- PHP Version: 7.0.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `ac_projects`
--

-- --------------------------------------------------------

--
-- Table structure for table `connector`
--

CREATE TABLE `connector` (
  `id` int(11) NOT NULL,
  `fromTask` int(11) NOT NULL,
  `connectTo` int(11) NOT NULL,
  `connType` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` int(11) NOT NULL,
  `name` varchar(1024) NOT NULL,
  `last_modified` bigint(11) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table structure for table `task`
--

CREATE TABLE `task` (
  `id` int(11) NOT NULL,
  `name` varchar(1024) NOT NULL,
  `actualStart` bigint(11) DEFAULT NULL,
  `actualEnd` bigint(11) DEFAULT NULL,
  `baselineStart` bigint(11) DEFAULT NULL,
  `baselineEnd` bigint(11) DEFAULT NULL,
  `progressValue` decimal(10,2) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `project` int(11) NOT NULL,
  `last_modified` bigint(20) NOT NULL,
  `assignee` int(11) DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `url` varchar(1024) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `avatar` varchar(1024) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `last_modified` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for table `connector`
--
ALTER TABLE `connector`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from` (`fromTask`),
  ADD KEY `to` (`connectTo`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `task`
--
ALTER TABLE `task`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent` (`parent`),
  ADD KEY `task` (`project`),
  ADD KEY `assignee` (`assignee`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `connector`
--
ALTER TABLE `connector`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT for table `task`
--
ALTER TABLE `task`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;
--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `connector`
--
ALTER TABLE `connector`
  ADD CONSTRAINT `connector_ibfk_1` FOREIGN KEY (`fromTask`) REFERENCES `task` (`id`),
  ADD CONSTRAINT `connector_ibfk_2` FOREIGN KEY (`connectTo`) REFERENCES `task` (`id`);

--
-- Constraints for table `task`
--
ALTER TABLE `task`
  ADD CONSTRAINT `task_ibfk_1` FOREIGN KEY (`parent`) REFERENCES `task` (`id`),
  ADD CONSTRAINT `task_ibfk_2` FOREIGN KEY (`project`) REFERENCES `project` (`id`),
  ADD CONSTRAINT `task_ibfk_3` FOREIGN KEY (`assignee`) REFERENCES `user` (`id`);
