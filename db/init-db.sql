CREATE DATABASE IF NOT EXISTS getproject_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE getproject_db;

CREATE TABLE IF NOT EXISTS Users (
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    fullName VARCHAR(255) NOT NULL,
    personalNum VARCHAR(7) NOT NULL UNIQUE, 
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('participant', 'leader') NOT NULL,
    skills VARCHAR(255) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Projects (
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    projectName VARCHAR(255) NOT NULL,
    projectDesc TEXT NOT NULL,
    imagePath VARCHAR(255), 
    participantsCount INT(11) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    leaderId INT(11),
    skills VARCHAR(255),
    FOREIGN KEY (leaderId) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Applications (
    userId INT(11),    
    projectId INT(11),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    PRIMARY KEY (userId, projectId),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (projectId) REFERENCES Projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;