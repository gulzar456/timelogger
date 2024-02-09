/* Copyright 2022 DigitME2

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

$(document).ready(function(){
    initUserList();

  
});



function initUserList(){
    $.ajax({
        url:"../scripts/server/time_sheet.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getUsers"
        },
        success:function(result){
            console.log(result);
            var resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                var s = $("<span/>");
                s.html("Error: " +  resultJson["message"]);
                return;
            }
            
            var userData = resultJson["result"];
            for(var i  = 0; i < userData.length; i++){
                var userName = userData[i]["userName"];
                var userId = userData[i]["userId"];
                
                var userOption = $("<option/>").attr("value", userId).html(userName);
                
                $("#userIdSelector").append(userOption);
            }
            
            $("#userIdSelector").attr("disabled", false);
            $("#dateStartInput").attr("disabled", false);
            $("#dateEndInput").attr("disabled", false);
        }
    });
}

function validDates(startDate, endDate){
    var isValidDate = true;
    
    if(startDate == ""){
        $("#timesheetContainer").empty().html("Invalid start date");
        isValidDate = false;
    }else if(endDate == ""){
        $("#timesheetContainer").empty().html("Invalid end date");
        isValidDate = false;
    }else{
        
        var startDateParts = startDate.split("-");
        var endDateParts = endDate.split("-");
        
        var startYear = parseInt(startDateParts[0]);
        var startMonth = parseInt(startDateParts[1]);
        var startDay = parseInt(startDateParts[2]);
        var endYear = parseInt(endDateParts[0]);
        var endMonth = parseInt(endDateParts[1]);
        var endDay = parseInt(endDateParts[2]);
        
        if(startYear > endYear){
            $("#timesheetContainer").empty().html("Start date must be before end date");
			isValidDate = false;
        }else if(startYear == endYear && startMonth > endMonth){
            $("#timesheetContainer").empty().html("Start date must be before end date");
			isValidDate = false;            
        }else if(startMonth == endMonth && startDay > endDay){
            $("#timesheetContainer").empty().html("Start date must be before end date");
			isValidDate = false;
        }

		if(startYear <= 2016){
			$("#timesheetContainer").empty().html("Start date prior to system initialization");
			isValidDate = false;
		}
    }
    
    return isValidDate;
}

function getTimesheet(){
    var userId = $("#userIdSelector").val();    
    	
    $("#timesheetContainer").empty().html("Working. Please wait....");
    $("#totalDuration").html("Total worked time (HH:MM): 00:00");
    $("#totalOvertime").html("Total overtime (HH:MM): 00:00");
    
    if(userId == "Select a user"){
        $("#timesheetContainer").empty().html("No user selected");
        return;
    }
    
    inputStartDate = $("#dateStartInput").val();
    inputEndDate = $("#dateEndInput").val();
    
    if (!validDates(inputStartDate, inputEndDate)){
        return;
    }
    
    // $(".controls").attr("disabled", true);
//     if(userId == "Select a user"){
//     $("#timesheetContainer").empty().html("No user selected");
//     return;
//     }
	
    $.ajax({
        url:"../scripts/server/time_sheet.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":	"getTimesheet",
            "userId": 	userId,
            "startDate":inputStartDate,
            "endDate":	inputEndDate
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                var s = $("<span/>");
                s.html("Error: " +  resultJson["result"]);
				$("#timesheetContainer").empty().append(s);
                return;
            }
            
            var timesheetData = resultJson.result;
            
            $("#totalDuration").html("Total worked time (HH:MM): " + timesheetData.totalWorkedTime);
            $("#totalOvertime").html("Total overtime (HH:MM): " + timesheetData.totalOvertime);
            
            var tableData = timesheetData["timesheet"];
            var columns = [{"headingName":"Job IDs", "dataName":"Job IDs"}];
            
            for(var i = 1; i < timesheetData.columnNames.length; i++) 
                columns.push({"headingName":timesheetData.columnNames[i],"dataName":timesheetData.columnNames[i], "link":"job_details_client.php?jobId=" + timesheetData.columnNames[i], "generatePlainLinkCells": true, "headerLink": "job_details_client.php?jobId=" + timesheetData.columnNames[i]});
                            
            var tableStructure = {
                "rows":{
                    "linksToPage":false
                },
                "columns":columns
            };


            var table = generateTable("currentUsersTable", tableData, tableStructure);

            $("#excludeProductIdColumn").change(function(){
                console.log('excludeProductIdColumn');
                excludeProductIdColumn('#currentUsersTable');
            })
        
            $("#excludeAggregateColumn").change(function(){
                console.log('excludeAggregateColumn');
                excludeAggregateColumn('#currentUsersTable');
            })



            $("#timesheetContainer").empty().append(table);
            $('#currentUsersTable').find('tbody').children('tr:nth-child(1)').css
            ({"background-color":"#be0f34", "color":"white"}); //"#be0f34" - Column Red
            $('#currentUsersTable').find('tbody').children('tr:nth-child(2)').css
            ({"background-color":"#be0f34", "color":"white"}); //"#be0f34" - Column Red
            $('#currentUsersTable').find('tbody').children('tr:nth-child(3)').css
            ({"background-color":"#be0f34", "color":"white"}); //"#be0f34" - Column Red
            data ={
				"request":"getTimesheetCSV",
				"userId": userId,
				"startDate":$("#dateStartInput").val(),
				"endDate":$("#dateEndInput").val()
            }
            excludeProductIdColumn('#currentUsersTable');
            excludeAggregateColumn('#currentUsersTable');
            var csvUrl = "../scripts/server/time_sheet.php?" + $.param(data);
            $("#csvDownloadLink").attr("href",csvUrl).show();
            $(".controls").attr("disabled", false);
        }
    });
}

function excludeProductIdColumn(table_id){
    if($("#excludeProductIdColumn").prop("checked")){
        $(table_id).find('tbody').children('tr:nth-child(2)').hide();
    }else{
        $(table_id).find('tbody').children('tr:nth-child(2)').show();
    }
}

function excludeAggregateColumn(table_id){
    if($("#excludeAggregateColumn").prop("checked")){
        $(table_id).find('tbody').children('tr:nth-child(3)').hide();
    }else{
        $(table_id).find('tbody').children('tr:nth-child(3)').show();
    }
   }
