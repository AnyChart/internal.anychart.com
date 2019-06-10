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
-- Dumping data for table `project`
--

INSERT INTO `project` (`id`, `name`, `last_modified`, `deleted`) VALUES
(5, 'Test12345', 1559712844774, 0),
(8, 'remove', 1559722172410, 1),
(9, 'qwer', 1559712850006, 1);

-- --------------------------------------------------------

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
-- Dumping data for table `task`
--

INSERT INTO `task` (`id`, `name`, `actualStart`, `actualEnd`, `baselineStart`, `baselineEnd`, `progressValue`, `parent`, `project`, `last_modified`, `assignee`, `deleted`, `url`) VALUES
(58, 'Group', NULL, NULL, NULL, NULL, NULL, NULL, 5, 1560157482204, NULL, 0, NULL),
(59, 'Sub1', 1559347200000, 1559606399999, 1559433600000, 1560124799999, '0.30', 58, 5, 1560157511742, 1, 0, NULL),
(60, 'Sub2', 1560211200000, 1560556799999, NULL, NULL, '0.40', 58, 5, 1560157691935, 1, 0, NULL),
(61, 'Sub3', 1559606400000, 1560556799999, NULL, NULL, '0.40', 58, 5, 1560157731464, 4, 0, NULL);

-- --------------------------------------------------------

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
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `avatar`, `deleted`, `last_modified`) VALUES
(1, 'Test User', 'https://cdn.shopify.com/s/files/1/0344/6469/products/Hippie_Kitty_Sunglasses_grande.jpg', 0, 1559716061558),
(2, 'Test User24444', '/images/banana.png', 0, 1559715653290),
(3, 'Test User215', 'https://vignette.wikia.nocookie.net/sanrio-hello-kitty/images/b/b7/Mymelody.jpg', 0, 1559715776099),
(4, 'one more user1', 'https://www.funny-emoticons.com/files/funny-animals/hello-kitty-emoticons/995-shy-kitty.png', 0, 1559716032503),
(7, 'empty', '/images/banana.png', 0, 1559890586169);

--
-- Indexes for dumped tables
--

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
