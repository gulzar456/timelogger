<?php

//  Copyright 2022 DigitME2

//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ------------------------------------------------------------------------------------------------------------------------

// Accepts a POST request from a client station. This is expected to include
// 
// Note that the database conenction is implicitly released when this script 
// terminates
require "db_params.php";
require "common.php";
require_once "kafka.php";

$debug =false;

// Calls a stored procedure in the database to clock the user on or off.
// Whether the user is clocked on or off is determined automatically,
// based on if they already have an open record for this job and station.
function clockUser($DbConn, $UserId, $JobId, $StationId, $JobStatus)
{
	global $productIDCodePrefix;

	//check if the code is a product
	$codePrefixLength = strlen($productIDCodePrefix);
	$productCheck =  substr($JobId, 0, $codePrefixLength);

	if($productCheck == $productIDCodePrefix)
	{
		//if code is a product- remove prefix to get productID then fetch the relevent jobId
		$productId = substr($JobId, $codePrefixLength);
		
		$query = "SELECT currentJobId FROM products WHERE products.productId = ?";
    
		if(!($statement = $DbConn->prepare($query)))
			errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);

		if(!($statement->bind_param('s', $productId)))
			errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);

		if(!$statement->execute())
			errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
			
		$res = $statement->get_result();
		$row = $res->fetch_assoc();

		if($row != null)
			$JobId = $row["currentJobId"];
		else
			return "No Job!";
			

	}

    // call the stored procedure, putting the result into a session-local variable
    $query = "CALL ClockUser(?, ?, ?, ?)";
    
    if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('ssss', $JobId, $UserId, $StationId, $JobStatus)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
    
    $res = $statement->get_result();
	$row = $res->fetch_assoc();
    
	if($row["result"] == "clockedOn" || $row["result"] == "clockedOff")
		$return = array("state"=>$row["result"], "logRef"=>$row["logRef"], "workState"=>$row["workState"], "routeName"=>$row["routeName"], "routeStageIndex"=>$row["routeStageIndex"]);
	else
		$return = array("state"=>$row["result"]);
	
    return $return;
}

// Calls a stored procedure in the database to Record a stoppage.
function recordStoppage($DbConn, $StoppageId, $JobId, $StationId, $JobStatus, $description)
{
	global $productIDCodePrefix;

	//check if the code is a product
	$codePrefixLength = strlen($productIDCodePrefix);
	$productCheck =  substr($JobId, 0, $codePrefixLength);

	if($productCheck == $productIDCodePrefix)
	{
		//if code is a product- remove prefix to get productID then fetch the relevent jobId
		$productId = substr($JobId, $codePrefixLength);
		
		$query = "SELECT currentJobId FROM products WHERE products.productId = ?";
    
		if(!($statement = $DbConn->prepare($query)))
			errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);

		if(!($statement->bind_param('s', $productId)))
			errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);

		if(!$statement->execute())
			errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
			
		$res = $statement->get_result();
		$row = $res->fetch_assoc();

		if($row["currentJobId"] != null)
			$JobId = $row["currentJobId"];
		else
			return 'error';
	}

    // call the stored procedure, putting the result into a session-local variable
    $query = "CALL recordStoppage(-1, ?, ?, ?, ?, ?)";
    
    if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('sssss',  $JobId, $StoppageId, $StationId, $description, $JobStatus)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);

	$res = $statement->get_result();
	$row = $res->fetch_assoc();
    
	if($row["result"] == "stoppageOn" || $row["result"] == "stoppageOff")
		$result = array("state"=>$row["result"]);
	else
		$result = array("state"=>$row["result"]);
	
    return $result;
}

function updateLastSeen($DbConn, $StationId, $version, $isApp, $nameType)
{
    $query = "REPLACE INTO connectedClients (stationId, lastSeen, version, isApp, nameType) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)";
    
    if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('ssis', $StationId, $version, $isApp, $nameType)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
}

function checkForNameUpdate($DbConn, $StationId)
{
	$query = "SELECT newName FROM clientNames WHERE currentName = ?";
    
    if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('s', $StationId)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
		
	$res = $statement->get_result();
	$row = $res->fetch_assoc();
	
	if($row["newName"] != null)
		return $row["newName"];
	
	return "noChange";
	
}

function completeNameUpdate($DbConn, $StationId)
{
	$query = "CALL CompleteStationRenaming(?)";
		
	if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('s', $StationId)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
}

function recordNumberCompleted($DbConn, $logRef, $numberCompleted)
{

	$query = "UPDATE timeLog SET timeLog.quantityComplete=? WHERE timeLog.ref=?";
    
    if(!($statement = $DbConn->prepare($query)))
        errorHandler("Error preparing statement: ($DbConn->errno) $DbConn->error, line " . __LINE__);
    
    if(!($statement->bind_param('is', $numberCompleted, $logRef)))
        errorHandler("Error binding parameters: ($statement->errno) $statement->error, line " . __LINE__);
    
    if(!$statement->execute())
        errorHandler("Error executing statement: ($statement->errno) $statement->error, line " . __LINE__);
}

function main()
{
    global $debug;
        
    global $dbParamsServerName;
    global $dbParamsUserName;
    global $dbParamsPassword;
    global $dbParamsDbName;
    
    $dbConn = initDbConn($dbParamsServerName, $dbParamsUserName, $dbParamsPassword, $dbParamsDbName);
    $dbConn->autocommit(TRUE);

    
    $request = $_GET["request"];
    
    switch($request)
    {
        case "clockUser":   
            $userId     = $_GET["userId"];
            $jobId      = $_GET["jobId"];
            $stationId  = $_GET["stationId"];
            $jobStatus  = $_GET["jobStatus"];
            $result = clockUser($dbConn, $userId, $jobId, $stationId, $jobStatus);

			if (!is_array($result)){
				sendResponseToClient("error", $result);
			}else if ($result["state"] == "unknownId"){
				sendResponseToClient("error", "Unknown ID");
			}
			else{
				// handle jobStatus being coerced to workInProgress if user is clocked on
				if($result["state"] == "clockedOn")
					$jobStatus = "workInProgress";
				kafkaOutputClockUser($userId, $result["state"], $jobId, $stationId, $jobStatus, $result["logRef"]);
				kafkaOutputSetJobProgressState($jobId, $result["workState"], $result["routeName"], $result["routeStageIndex"]);
            	sendResponseToClient("success", array("state" => $result["state"], "logRef" => $result["logRef"]));
			}
            break;

		case "recordStoppage":   
		        $stoppageId = $_GET["stoppageId"];
		        $jobId      = $_GET["jobId"];
		        $stationId  = $_GET["stationId"];
		        $jobStatus  = $_GET["jobStatus"];

				if(isset($_GET["description"]))
					$description = $_GET["description"];
				else
					$description = '';

		        $result = recordStoppage($dbConn, $stoppageId, $jobId, $stationId, $jobStatus, $description);
				if ($result["state"] == "unknownId"){
					sendResponseToClient("error", "Unknown ID");
				}
				else{
		        	sendResponseToClient("success", $result);
					if($result["state"] == "stoppageOn")
						$stoppageActive = TRUE;
					else
						$stoppageActive = FALSE;

					kafkaOutputRecordProblemState($jobId, $stoppageId, $stoppageActive);
					updateJobStoppages($dbConn, $jobId);
				}				
		        break;
      
        case "heartbeat":
    		$stationId = $_GET["stationId"];
			$version = $_GET["version"];
			
			$isApp = 0;
			if(isset($_GET["isApp"]))
			{
				if($_GET["isApp"] == "true")
					$isApp = 1;
			}
				
			if(isset($_GET["nameType"]))
				$nameType = $_GET["nameType"];
			else
				$nameType = "location";
				
	        updateLastSeen($dbConn, $stationId, $version, $isApp, $nameType);
            sendResponseToClient("success");
            break;
			
		case "checkForNameUpdate":
			$stationId = $_GET["stationId"];
			$response = checkForNameUpdate($dbConn, $stationId);
			sendResponseToClient("success", $response);
            break;
			
		case "completeNameUpdate":
			$stationId = $_GET["stationId"];
			completeNameUpdate($dbConn, $stationId);
			sendResponseToClient("success");
            break;

		case "recordNumberCompleted":			
			$logRef = $_GET["logRef"];
			$numberCompleted = $_GET["numberCompleted"];
			recordNumberCompleted($dbConn, $logRef, $numberCompleted);
			kafkaOutputRecordWorkQuantityComplete($numberCompleted, $logRef);
			sendResponseToClient("success");
            break;
            
        default:
            sendResponseToClient("error","Unknown command: $request");
    }
}

main();

?>
