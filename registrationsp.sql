use forma4

CREATE OR ALTER PROCEDURE sp_RegisterUser(
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
        RAISERROR('USERNAME_ALREADY_EXISTS', 16, 1);
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM [forma4].[USER_SIGNUPS] WHERE email = @Email)
    BEGIN
        RAISERROR('EMAIL_ALREADY_EXISTS', 16, 1);
        RETURN;
    END;

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
    END TRY

    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrState INT = ERROR_STATE();
        RAISERROR(@ErrMsg, @ErrSeverity, @ErrState);
    END CATCH
END
GO
