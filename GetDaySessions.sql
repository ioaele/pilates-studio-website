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

