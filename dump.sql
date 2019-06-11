-- MySQL dump 10.13  Distrib 5.6.35, for osx10.9 (x86_64)
--
-- Host: localhost    Database: ac_projects
-- ------------------------------------------------------
-- Server version	5.6.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `connector`
--

DROP TABLE IF EXISTS `connector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `connector` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fromTask` int(11) NOT NULL,
  `connectTo` int(11) NOT NULL,
  `connType` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `from` (`fromTask`),
  KEY `to` (`connectTo`),
  CONSTRAINT `connector_ibfk_1` FOREIGN KEY (`fromTask`) REFERENCES `task` (`id`),
  CONSTRAINT `connector_ibfk_2` FOREIGN KEY (`connectTo`) REFERENCES `task` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connector`
--

LOCK TABLES `connector` WRITE;
/*!40000 ALTER TABLE `connector` DISABLE KEYS */;
/*!40000 ALTER TABLE `connector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(1024) NOT NULL,
  `last_modified` bigint(11) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
INSERT INTO `project` VALUES (5,'Test12345',1559712844774,0),(8,'remove',1559722172410,1),(9,'qwer',1559712850006,1);
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `url` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent` (`parent`),
  KEY `task` (`project`),
  KEY `assignee` (`assignee`),
  CONSTRAINT `task_ibfk_1` FOREIGN KEY (`parent`) REFERENCES `task` (`id`),
  CONSTRAINT `task_ibfk_2` FOREIGN KEY (`project`) REFERENCES `project` (`id`),
  CONSTRAINT `task_ibfk_3` FOREIGN KEY (`assignee`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
INSERT INTO `task` VALUES (58,'Group',NULL,NULL,NULL,NULL,NULL,NULL,5,1560157482204,NULL,0,NULL),(59,'Sub1',1559347200000,1559692799998,1559433600000,1560211199998,0.30,59,5,1560159851150,1,0,'qwer'),(60,'Sub2',1560211200000,1560556799999,NULL,NULL,0.40,58,5,1560157691935,1,0,NULL),(61,'Sub3',1559606400000,1560556799999,NULL,NULL,0.40,58,5,1560157731464,4,0,NULL);
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `avatar` varchar(1024) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `last_modified` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Test User','https://cdn.shopify.com/s/files/1/0344/6469/products/Hippie_Kitty_Sunglasses_grande.jpg',0,1559716061558),(2,'Test User24444','/images/banana.png',0,1559715653290),(3,'Test User215','https://vignette.wikia.nocookie.net/sanrio-hello-kitty/images/b/b7/Mymelody.jpg',0,1559715776099),(4,'one more user1','https://www.funny-emoticons.com/files/funny-animals/hello-kitty-emoticons/995-shy-kitty.png',0,1559716032503),(7,'empty','/images/banana.png',0,1559890586169);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-06-11 12:46:58
