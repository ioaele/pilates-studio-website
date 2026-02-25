CREATE DATABASE forma4;
USE forma4;

CREATE TABLE [forma4].[SESSION] (
    [session_id] INT          IDENTITY (1, 1) NOT NULL,
    [level]      VARCHAR (20) NOT NULL,
    [time_start] DATETIME     NOT NULL,
    [time_end]   DATETIME     NOT NULL,
    [status]     VARCHAR (20) NOT NULL,
    [date]       DATE         NOT NULL,
    [capacity]   INT          NOT NULL,
    PRIMARY KEY CLUSTERED ([session_id] ASC)
);

CREATE TABLE [forma4].[USER_SIGNUPS] (
    [users_id]        INT            IDENTITY (1, 1) NOT NULL,
    [username]        VARCHAR (50)   NOT NULL,
    [First Name]      NVARCHAR (30)  NULL,
    [Last Name]       NVARCHAR (30)  NULL,
    [email]           VARCHAR (50)   NOT NULL,
    [password_hashed] VARBINARY (64) NOT NULL,
    [time_create]     DATETIME       DEFAULT (sysdatetime()) NOT NULL,
    [phone_number]    VARCHAR (30)   NULL,
    [datebirth]       DATE           NOT NULL,
    PRIMARY KEY CLUSTERED ([users_id] ASC),
    UNIQUE NONCLUSTERED ([email] ASC),
    UNIQUE NONCLUSTERED ([phone_number] ASC),
    UNIQUE NONCLUSTERED ([username] ASC)
);

CREATE TABLE [forma4].[BOOKING] (
    [booking_id]   INT          IDENTITY (1, 1) NOT NULL,
    [time_created] DATETIME     DEFAULT (getdate()) NOT NULL,
    [status]       VARCHAR (20) NOT NULL,
    [users_id]     INT          NOT NULL,
    [session_id]   INT          NOT NULL,
    PRIMARY KEY CLUSTERED ([booking_id] ASC),
    CONSTRAINT [fk_bookings_session] FOREIGN KEY ([session_id]) REFERENCES [forma4].[SESSION] ([session_id]) ON DELETE CASCADE,
    CONSTRAINT [fk_bookings_user] FOREIGN KEY ([users_id]) REFERENCES [forma4].[USER_SIGNUPS] ([users_id]) ON DELETE CASCADE
);

CREATE TABLE [forma4].[LOGIN] (
    [login_id]    INT           IDENTITY (1, 1) NOT NULL,
    [login_time]  DATETIME      NOT NULL,
    [browser]     VARCHAR (100) NULL,
    [ip_address]  VARCHAR (45)  NULL,
    [logout_time] DATETIME      NULL,
    [users_id]    INT           NOT NULL,
    PRIMARY KEY CLUSTERED ([login_id] ASC),
    CONSTRAINT [fk_login_user_signup] FOREIGN KEY ([users_id]) REFERENCES [forma4].[USER_SIGNUPS] ([users_id])
);

CREATE PROCEDURE [forma4].[GetDaySessions]
@date DATE 
AS
BEGIN
        SELECT S.session_id,S.level,S.time_start,S.time_end,S.status,S.capacity,S.date,
        S.capacity - ISNULL( (SELECT COUNT(*) FROM BOOKING B WHERE B.session_id = S.session_id AND B.status = 'confirmed'), 0) AS spots_left
        FROM SESSION S
        WHERE S.date = @date AND S.status = 'open'
        ORDER BY S.time_start 

END

GO

CREATE PROCEDURE [forma4].[getHashedPassword]
@username NVARCHAR(100)

AS BEGIN

SELECT  users_id,username,password_hashed
FROM USER_SIGNUPS
WHERE username=@username
END
GO

CREATE PROCEDURE [forma4].[GetOpenDaySessions]
@date DATE 
AS
BEGIN
        SELECT S.session_id,S.level,S.time_start,S.time_end,S.status,S.capacity,S.date,
        S.capacity - ISNULL( (SELECT COUNT(*) FROM BOOKING B WHERE B.session_id = S.session_id AND B.status = 'confirmed'), 0) AS spots_left
        FROM SESSION S
        WHERE S.date = @date
        ORDER BY S.time_start 
END
GO

CREATE   PROCEDURE [forma4].[sp_DeleteAccount]
(
    @Username VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE username = @Username)
    BEGIN
        RAISERROR('USER_NOT_FOUND', -1, -1);
        SELECT -1 AS result;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM [forma4].[USER_SIGNUPS]
        WHERE username = @Username;

        COMMIT;
        SELECT 1 AS result;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        RAISERROR('DELETE_FAILED', -1, -1);
        SELECT -2 AS result;
        RETURN;
    END CATCH
END
GO

CREATE   PROCEDURE [forma4].[sp_DeleteUser]
(
    @UserId INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE  users_id = @UserId)
    BEGIN
        RAISERROR('USER_NOT_FOUND', -1, -1);
        SELECT -1 AS result;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM [forma4].[USER_SIGNUPS]
        WHERE users_id = @UserId;

        COMMIT;
        SELECT 1 AS result;  -- Success

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SELECT -2 AS result; -- Error
        RETURN;
    END CATCH
END
GO

CREATE PROCEDURE [forma4].[sp_login](
@username varchar(50),
@browser varchar(100) NULL,
@ip varchar(45) NULL
)as
SET NOCOUNT ON
begin 
declare @res int =-1;
if ( not exists (select * from USER_SIGNUPS where username = @username))
begin
select @res as [result];
return;
end
 BEGIN TRANSACTION;
insert into LOGIN([login_time],[browser],[ip_address],[users_id])
select
GETDATE(),@browser,@ip,t.[users_id] 
from USER_SIGNUPS t where t.[username] = @username
commit;
set @res = (select [users_id] from USER_SIGNUPS where [username] = @username);

select @res  as [result];
end
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [forma4].[sp_logout](
@uid int
)as
SET NOCOUNT ON
begin 
update [LOGIN]
set [logout_time] = GETDATE()
where [users_id] = @uid and [logout_time] is null;
end

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROCEDURE [forma4].[sp_RegisterUser](
    @Username        VARCHAR(50),
    @First_Name      NVARCHAR(30) = NULL,
    @Last_Name       NVARCHAR(30) = NULL,
    @Email           VARCHAR(50),
    @Password_hashed   VARCHAR(64),
    @Phone           VARCHAR(30) = NULL,
    @Date_Of_Birth   DATE
)AS
BEGIN

    SET NOCOUNT ON;
    DECLARE @Password_hashedS  VARBINARY(64);
    set @Password_hashedS= CONVERT(VARBINARY(200),@Password_hashed);
    -- UNIQUENESS VALIDATION
    IF EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE username = @Username)
    BEGIN
       raiserror('USERNAME_ALREADY_EXISTS',-1,-1);
        select -1 as result;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE email = @Email)
    BEGIN
        raiserror('EMAIL_ALREADY_EXISTS',-1,-1);
        select -2 as result;
        RETURN;
    END;
    IF EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE [phone_number] = @Phone)
    BEGIN
        raiserror('PHONE_ALREADY_EXISTS',-1,-1);
        select -3 as result;
        RETURN;
    END;
    declare @uid int = 0;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- INSERT ACCOUNT
        INSERT INTO [forma4].[USER_SIGNUPS] (
            username, [First Name], [Last Name], email, password_hashed,
            phone_number,datebirth
        )
        VALUES (
            @Username,  @First_Name,  @Last_Name, @Email, @Password_hashedS,
            @Phone, @Date_of_Birth
        );

        COMMIT;
   set @uid = SCOPE_IDENTITY();
    END TRY

    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
   select -4 as result;
   return;
    END CATCH
     select @uid  as result;
END
GO





