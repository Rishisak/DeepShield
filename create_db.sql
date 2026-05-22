CREATE DATABASE DeepShieldDB;
GO

USE DeepShieldDB;
GO

CREATE TABLE users (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    email      NVARCHAR(255)  NOT NULL UNIQUE,
    name       NVARCHAR(255)  NOT NULL,
    password   NVARCHAR(255)  NOT NULL,   -- bcrypt hash
    role       NVARCHAR(50)   DEFAULT 'user',
    created_at DATETIME       DEFAULT GETDATE()
);
GO

CREATE TABLE scan_history (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT            NOT NULL,
    filename   NVARCHAR(255)  NOT NULL,
    verdict    NVARCHAR(50)   NOT NULL,
    confidence FLOAT          NOT NULL,
    scan_date  DATETIME       DEFAULT GETDATE(),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
GO
