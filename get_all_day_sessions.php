<?php
// Dilwnoume oti to apotelesma tha einai JSON gia to frontend (JavaScript fetch)
header('Content-Type: application/json');

// stoixia to databse mou
require_once 'database_connect.php';

try {
    // dimiourgo antikimeno database gia na mporo na syndethw
    // Edo ftiaxnoume neo instance tis klasis Database pou exei mesa tin sundesi me tin vasi
    $database = new Database();
    // Pernoume to connection object (PDO) gia na kanoume queries
    $conn = $database->getConnection();
        
    // Diavazoume apo to URL to 'date' param (get_all_day_sessions.php?date=YYYY-MM-DD)
    // An den mas stelnei h klisi imerominia, xrisimopoioume tin simerini (date('Y-m-d'))
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    
    //  stored procedure to get all the date's sessions
    $sql =  "{CALL GetOpenDaySessions(?)}";
    
  
    // Etoimazoume to query me prepared statement gia asfalia (SQL injection protection)
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        // An gia kapoio logo den borese na etoimastei to statement, petame exception
        throw new Exception("Prepare failed");
    }
    

    // Desmeuoume tin metavliti $date sto placeholder :date me tipo string
    $stmt->bindParam(1, $date);
    
      
    // Execute
    // Trexoume to query sti vasi
    if (!$stmt->execute()) {
        // An to execute epistrepsei false, pernume plirofories lathous apo $stmt->errorInfo()
        throw new Exception("Execute failed: " . implode(", ", $stmt->errorInfo()));
    }
    
    // Get results
    // Pinakas pou tha gemisoume me ola ta sessions gia tin imerominia
    $sessions = array();
    
    // Diavazoume kathe grammi apotelesmatos san associatve array
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Apothikevoume tis times se topikes metavlites gia na tis metatrepsoume se string
        $timeStart = $row['time_start'];
        $timeEnd = $row['time_end'];
        $dateValue = $row['date'];
        
        
         //PINAKAS POU MAS EPISTREFEI TO QUERY SELECT 
        // Ftiaxnoume ena associative array gia kathe session pou tha paei ston JSON
        $sessions[] = array(
            'session_id'   => (int)$row['session_id'],    // metatropi se integer gia pio katharo JSON
            'level'        => $row['level'],              // epipedo mathimatos
            'time_start'   => $timeStart,                 // ora enarksis se ISO format
            'time_end'     => $timeEnd,                   // ora lixis se ISO format
            'status'       => $row['status'],             // katastasi session (open / close)
            'capacity'     => (int)$row['capacity'],      // megistos arithmos theseon
            'spots_left'   => (int)$row['spots_left'],    // poses theseis apomenoun
            'date'         => $dateValue                  // imerominia se morfi YYYY-MM-DD
        );
    }
    
    // Apodesmevoume to statement
    $stmt = null;
    
    // An ola pigan kala, epistrefoume success = true kai ton pinaka me ta sessions
    echo json_encode(array(
        'success' => true,
        'sessions' => $sessions
    ));
    
} catch (Exception $e) {
    // Se periptosi opoioudipote lathous pio panw
    // epistrefoume JSON me success = false kai minima lathous
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
?>