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
    $("#description").on('keyup', function(){
        var description = $("#description").val();
        var descCharsRemaining = 200 - description.length;
        $("#descriptionCounter").html(descCharsRemaining + "/200"); 
    });
    $("#description").trigger("keyup",null);
    
    $("#customerName").on('keyup', function(){
        var customerName = $("#customerName").val();
        var custNameCharsRemaining = 120 - customerName.length;
        $("#customerNameCounter").html(custNameCharsRemaining + "/120"); 
    });
    $("#customerName").trigger("keyup",null);

	$("#jobName").on('keyup', function(){
        var JobName = $("#jobName").val();
        var JobNameCharsRemaining = 20 - JobName.length;
        $("#jobNameCounter").html(JobNameCharsRemaining + "/20"); 
    });
    $("#jobName").trigger("keyup",null);

	$("#jobId").on('keyup', function(){
        var jobID = $("#jobId").val();
        var jobIDCharsRemaining = 20 - jobID.length;
        $("#jobIdCounter").html(jobIDCharsRemaining + "/20"); 
    });
    $("#jobId").trigger("keyup",null);
});

function setUpKeyPress(JobId){
	$(".jobDetail").keypress(function(e) {
		var keycode = (e.keycode ? e.keycode : e.which)
		if (keycode == 13){
			saveRecord(JobId);
		}
	});
}

function enableTimePeriod(name="")
{
	if($("#useDate" + name + "Range").is(':checked'))
	{
		$("#date" + name + "StartInput").prop("disabled",false)
		$("#date" + name + "EndInput").prop("disabled",false)
	}
	else
	{
		$("#date" + name + "StartInput").prop("disabled",true)
		$("#date" + name + "EndInput").prop("disabled",true)
	}
}

function getJobName(JobId){
	// loads the job name for the given job Id.
	$.ajax({
		url:"../scripts/server/transfer_work_log.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"getJobName",
			"jobId":JobId
		},
		success:function(result){
			console.log(result);
			var resultJson = $.parseJSON(result);

			if(resultJson["status"] != "success"){
				console.log("Failed to fetch job record: " + resultJson["result"]);
				return;
			}
			else {
				var jobName = resultJson.result;
				return jobName;
			}
		}
	})
}

function loadJobRecord(JobId){
	// load the route names first, then load everythnig else.
	// This is needed because the route names select needs to
	// be populated before it is set to a value.
	$.ajax({
        url:"../scripts/server/job_details.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getAllRouteNames"
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                console.log("Failed to fetch job record: " + resultJson["result"]);
				return;
			}
			
			var routeNames = resultJson.result;
			$("#routeName").empty();
			var placeHolder = $("<option>")
						.text("Select a route...")
						.attr("value", "");
			$("#routeName").append(placeHolder);
			for(var i = 0; i < routeNames.length; i++){
				var newOption = $("<option>")
					.text(routeNames[i])
					.attr("value", routeNames[i]);
				$("#routeName").append(newOption);
			}

			$.ajax({
				url:"../scripts/server/job_details.php",
				type:"GET",
				dataType:"text",
				data:{
					"request":"getJobRecord",
					"jobId":JobId
				},
				success:function(additionalResult){
					console.log(additionalResult);
					resultJson = $.parseJSON(additionalResult);

					if(resultJson["status"] != "success"){
						console.log("Failed to fetch job record: " + resultJson["result"]);
						return;
					}
					
					var record = resultJson.result;
                    
                    //Check if a record was returned
                    if(record.currentStatus == null){
                        $("#btnMarkComplete").attr("disabled", true);
                        $("#btnDelete").attr("disabled", true);
						$("#btnDuplicate").attr("disabled", true);
                        $("#btnSaveChanges").attr("disabled", true);
						$("#btnAddStoppage").attr("disabled", true);
                        $("#currentStatus").html("RECORD NOT FOUND");
                        $("#downloadLinkContainer").html("RECORD NOT FOUND");
                        console.log("Record not found. stopping");
                        return;
                    }
					
					// fill route stages box
					
					if(record.routeDescription != null && record.routeDescription != ""){
						$("#routeStage").empty();
						var routeParts = record.routeDescription.split(",");
						for(var i = 0; i < routeParts.length; i++){
							var newOption = $("<option>")
								.text(routeParts[i])
								.attr("value", routeParts[i]);
							$("#routeStage").append(newOption);
						}
					}
					
					$("#currentStatus").html(record.currentStatus);
					$("#productId").html(record.productId);
					$("#routeName").val(record.routeName);
					$("#routeStage")[0].selectedIndex = record.routeCurrentStageIndex-1;
					
					$("#jobId").val(JobId);
					var jobIdCount = 20 - JobId.length;
					$("#jobIdCounter").html(jobIdCount + "/20");

					$("#jobName").val(record.jobName);
					var jobNameCount = 20 - record.jobName.length;
					$("#jobNameCounter").html(jobNameCount + "/20");

					$("#description").val(record.description);
                    var descCharsRemaining = 200 - record.description.length;
                    $("#descriptionCounter").html(descCharsRemaining + "/200");
                    
                    $("#customerName").val(record.customerName);
					var custNameCharsRemaining = 120 - record.customerName.length;
					$("#customerNameCounter").html(custNameCharsRemaining + "/120");
                    
					$("#numUnits").val(record.numberOfUnits);
					$("#totalParts").val(record.totalParts);
					
					if(record.dueDate == "9999-12-31")
						$("#dueDate").val("");
					else
						$("#dueDate").val(record.dueDate);
					
					if(record.expectedDuration == 0)
						$("#expectedDuration").val("");
					else
						$("#expectedDuration").val(record.expectedDuration);
					
					$("#workedTime").html(record.workedDuration);
					$("#overtime").html(record.overtimeDuration);
					$("#chargeToCustomer").val(record.chargeToCustomer / 100);
					$("#chargeGenerated").html(record.chargePerMinute);
					$("#priority").val(record.priority);
					$("#recordAdded").html(record.recordAdded);
					              
					$("#btnMarkComplete").attr("disabled", false);
					if(record.currentStatus == "Complete")
					{
						$("#btnMarkComplete").val("Mark Job in Progress");
					}
					else
					{
						$("#btnMarkComplete").val("Mark Job Complete");
					}
						

					$("#btnDelete").attr("disabled",false); 
					$("#btnDuplicate").attr("disabled",false);
					$("#btnAddStoppage").attr("disabled",false);

					jobName = record.jobName;

					var url = new URL(window.location.origin + "/timelogger/scripts/server/getQrCode.php?request=getDownloadJobIdQrCode&jobId=" + JobId);
                	var a = $('<a/>')
                    	.attr('href', url)
                    	.html('Click here to download - ' + jobName + ' - ID - QR Code');
                	$("#downloadLinkContainer").empty().append(a);
					
					$("#notesField").val(record.notes);
					$("#stoppagesField").val(record.stoppages);

				}
			});
		}
	});
}

function updateRouteDescription(){
	var routeName = $("#routeName").val();
	
	$.ajax({
        url:"../scripts/server/job_details.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getRouteDescription",
            "routeName":routeName
        },
        success:function(result){
            console.log(result);
            var responseJson = $.parseJSON(result);
            
            if(responseJson['status'] != 'success')
				console.log(responseJson['result']);
			else{
				routeDescription = responseJson.result;
				$("#routeStage").empty();
				
				if(routeDescription != "" && routeDescription != null){
						var routeParts = routeDescription.split(",");
						for(var i = 0; i < routeParts.length; i++){
							var newOption = $("<option>")
								.text(routeParts[i])
								.attr("value", routeParts[i]);
							$("#routeStage").append(newOption);
						}
					}
			}
        }
    });
}

function saveRecord(JobId){
	newJobId = $("#jobId").val();
	if(newJobId != JobId)
	{
		console.log("Change of Job ID");

		if(newJobId.length == 0){
			console.log("Job ID cannot be blank. Stopping");
			$("#saveChangesFeedback").empty().html("Job ID cannot be blank.");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}

		if(newJobId.length > 20){
			console.log("Job ID length exceeds 20 characters. Stopping");
			$("#saveChangesFeedback").empty().html("Job ID's length must not be greater than 20");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}

		if(!(newJobId.startsWith("job_"))){
			console.log("Job ID must start with 'job_'!!");
			$("#saveChangesFeedback").empty().html("Job ID must start with 'job_'!!");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}

		regexp = /^[a-z0-9_]+$/i;
		if(! regexp.test(newJobId)){
			console.log("Job ID entered contains invalid chars. Stopping");
			$("#saveChangesFeedback").empty().html("Job ID must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}		
	}


	jobName = $("#jobName").val();

	if(jobName.length == 0){
		console.log("Job Name cannot be blank. Stopping");
		$("#saveChangesFeedback").empty().html("Job Name cannot be blank.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}

	if(jobName.length > 20){
		console.log("Job Name length exceeds 20 characters. Stopping");
		$("#saveChangesFeedback").empty().html("Job Name's length must not be greater than 20");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	regexp = /^[a-z0-9_]+$/i;
	if(! regexp.test(jobName)){
		console.log("Job Name entered contains invalid chars. Stopping");
		$("#saveChangesFeedback").empty().html("Job Name must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}		


	var priority = $("#priority").val()
	
	var expHours = $("#expectedDuration").val();
	expHoursRegExp= /^\d+:[0-5][0-9]?$/
	if(! expHoursRegExp.test(expHours))
	{
		if ( expHours == "")
		{
			var duration = null;
			console.log("expected hours empty");
		}
		else
		{
			console.log("Expected hours invalid input");
			$("#saveChangesFeedback").empty().html("Expected Time value is invalid, please enter in format HH:MM");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return
		}
	}
	if(expHours.length == 0)
		var duration = null;
	else{
		var timeParts = expHours.split(":");
		if(timeParts.length != 2){
			console.log("Unable to continue. time format is incorrect");
			$("#saveChangesFeedback").empty().html("Estimated Duration must be entered in the format HH:MM");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}

		var duration = (parseInt(timeParts[0],10) * 3600) + (parseInt(timeParts[1],10) * 60);
	}
	
	var dueDate = $("#dueDate").val();
	if(dueDate == ""){
        dueDate = "9999-12-31";
    }
	
	jobTotalCharge = $("#chargeToCustomer").val(); //get the charge into pence
	if(jobTotalCharge < 0){
		console.log("Total charge invalid- negative. Stopping");
		$("#saveChangesFeedback").empty().html("Total charge can not be negative.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	var unitCount = $("#numUnits").val()
	if(unitCount < 0){
		console.log("Unit Count invalid- negative. Stopping");
		$("#saveChangesFeedback").empty().html("Unit Count can not be negative.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	var totalParts = $("#totalParts").val()
	if(totalParts < 0){
		console.log("Total Parts invalid- negative. Stopping");
		$("#saveChangesFeedback").empty().html("Total parts can not be negative.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	description = $("#description").val();
	if(description.length > 200){
		console.log("Description length exceeds 200 characters. Stopping");
		$("#saveChangesFeedback").empty().html("Description's length must not be greater than 200");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	customerName = $("#customerName").val();
	if(customerName.length > 120){
		console.log("customer Name length exceeds 120 characters. Stopping");
		$("#saveChangesFeedback").empty().html("customer Name's length must not be greater than 120");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}

	routeCurrentStageName = $("#routeStage").val();
	if(routeCurrentStageName == null)
	{
		routeCurrentStageName = null;
		routeCurrentStageIndex = -1;
	}
	else
	{
		routeCurrentStageIndex = $("#routeStage")[0].selectedIndex + 1;
	}

	$.ajax({
        url:"../scripts/server/job_details.php",
        type:"POST",
        dataType:"text",
        data:{
			"request":"saveRecordDetails",
			"jobId":JobId,
			"newJobId":newJobId,
			"routeName":$("#routeName").val(),
			"routeCurrentStageName":routeCurrentStageName,
			"routeCurrentStageIndex":routeCurrentStageIndex,
			"description":description,
			"dueDate":dueDate,
			"priority":priority,
			"notes":$("#notesField").val(),
			"expectedDuration":duration,
			"totalChargeToCustomer":jobTotalCharge,
			"numberOfUnits":unitCount,
			"totalParts":totalParts,
			"customerName":customerName,
			"jobName":jobName
		},
		success:function(result, newJobId){
			console.log(result);
			resultJson = $.parseJSON(result);
			
			if(resultJson["status"] != "success"){
				console.log("Failed to fetch job record: " + resultJson["result"]);
				$("#saveChangesFeedback").empty().html(resultJson["result"]);
				setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
				return;
			}
			else{			
				if(resultJson["result"] != "")
				{
					$("#jobId").val(resultJson["result"]);

					$("#saveChangesFeedback").empty().html("Changes saved, page should redirect shortly...");
					
					if('URLSearchParams' in window){
						var searchParams = new URLSearchParams(window.location.search);
						searchParams.set("jobId", resultJson["result"]);
						searchParams.set("idchange", "true");
						window.location.search = searchParams.toString();
					}
				}
				else
				{
					$("#saveChangesFeedback").empty().html("Changes saved");
					setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
				}
			}
		}
	});
}

function addWorkLog(){
	var jobId = $('#jobId').val();
	$.ajax({
		url:"../scripts/server/work_log_event.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"addEmptyWorkLog",
			"jobId":jobId
		},
		success:function(result){
			console.log(result);
			resultJson = $.parseJSON(result);
			window.location.href = 'work_log_event_client.php?workLogRef=' + resultJson['result'];
		}
	});
}

function updateJobLogTable(JobId){
    // get user data, ordered by selected option
    // generate table
    // drop old table and append new one
    
	var startDate = $('#dateStartInput').val();
	var endDate = $('#dateEndInput').val();
	
    $.ajax({
        url:"../scripts/server/job_details.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getTimeLog",
            "collapseRecords":$('#collapseRecords').is(':checked'),
            "jobId":JobId,
            "useDateRange":$('#useDateRange').is(':checked'),
            "startDate":startDate,
            "endDate":endDate
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                console.log("Failed to update table: " + resultJson["result"]);
            }
            else{
				$("#timeLogWorkedTime").html(resultJson.result.workedTime);
				$("#timeLogOvertime").html(resultJson.result.overtime);
                var tableData = resultJson.result.timeLogTableData;
                
				if(tableData.length > 0){
					if($('#collapseRecords').is(':checked')){
						var tableStructure = {
							"rows":
								{
									"linksToPage":false
							},
							"columns":[
								{
									"headingName":"Location Name",
									"dataName":"stationId"
								},
								{
									"headingName":"Record Start Date",
									"dataName":"recordStartDate"
								},
								{
									"headingName":"Record End Date",
									"dataName":"recordEndDate"
								},
								{
									"headingName":"Total Duration until now (HH:MM)",
									"dataName":"workedTime"
								},
								{
									"headingName":"Overtime (HH:MM)",
									"dataName":"overtime"
								},
								{
									"headingName":"Job Status",
									"dataName":"workStatus"
								}
							]
						};
					}
					else{ 
						// full records
						var tableStructure = {
							"rows":{
								"linksToPage":true,
								"link":"work_log_event_client.php",
								"linkParamLabel":"workLogRef",
								"linkParamDataName":"ref"
							},
							"columns":[
								{
									"headingName":"Location Name",
									"dataName":"stationId"
								},
								{
									"headingName":"User Name",
									"dataName":"userName"
								},
								{
									"headingName":"Record Date",
									"dataName":"recordDate"
								},
								{
									"headingName":"Start Time",
									"dataName":"clockOnTime"
								},
								{
									"headingName":"Finish Time",
									"dataName":"clockOffTime"
								},
								{
									"headingName":"Duration (HH:MM)",
									"dataName":"workedTime"
								},
								{
									"headingName":"Overtime (HH:MM)",
									"dataName":"overtime"
								},
								{
									"headingName":"Job Status",
									"dataName":"workStatus"
								}
							]
						};
					}

					if(includeQuantity == true)
					{
						tableStructure["columns"].push(
							{
								"headingName":"Quantity",
								"dataName":"quantityComplete"
							});

						var notNull = function(element){
							//checks whether an element is null
							return element["outstanding"] != null;
						};

						if($('#collapseRecords').is(':checked') 
								&& !$('#useDateRange').is(':checked') 
								&& tableData.some(notNull)){
							tableStructure["columns"].push(
								{
									"headingName":"Outstanding",
									"dataName":"outstanding"
								});
						}
					}

					if($('#collapseRecords').is(':checked')){
						var positive = function(element){
							//checks whether an element is negative
							console.log(element["routeStageIndex"]);
							return element["routeStageIndex"] > 0;
						};

						if (tableData.some(positive)) {
							tableStructure["columns"].push(
								{
									"headingName":"Route Index",
									"dataName":"routeStageIndex"
								}
							);
						}					
					}
					
					if (((!$('#collapseRecords').is(':checked')) && ("clockOnTime" in tableData[0])) 
							|| (($('#collapseRecords').is(':checked')) && ("recordStartDate" in tableData[0])) 
							|| (tableData.length == 0)){

						var table = generateTable("recordsTable", tableData, tableStructure);
						$("#recordsTableContainer").empty().append(table);
						
						// update CSV URL
						urlParams = {
							"request":"getTimeLogCSV",
							"collapseRecords":$('#collapseRecords').is(':checked'),
							"jobId":JobId,
							"useDateRange":$('#useDateRange').is(':checked'),
							"startDate":startDate,
							"endDate":endDate
						};
						var csvUrl = "../scripts/server/job_details.php?" + $.param(urlParams);
						$("#csvDownloadLink").attr("href",csvUrl);
						$("#timeLogWorkedTimeLabel").prop("hidden", false);
						$("#timeLogOvertimeLabel").prop("hidden", false);
						$("#csvDownloadLink").prop("hidden", false);
						$("#timeLogWorkedTime").prop("hidden", false);
						$("#timeLogOvertime").prop("hidden", false);
					}
				}
				else{
					$("#timeLogWorkedTimeLabel").prop("hidden", true);
					$("#timeLogOvertimeLabel").prop("hidden", true);
					$("#csvDownloadLink").prop("hidden", true);
					$("#timeLogWorkedTime").prop("hidden", true);
					$("#timeLogOvertime").prop("hidden", true);
					if ($("#useDateRange").is(":checked")){
						var messageSpan = $("<span id='noWorkMessage'>").html('! There is no work record found for this job within the selected date range !');
						$("#recordsTableContainer").empty().append(messageSpan);
					} 
					else {
						var messageSpan = $("<span id='noWorkMessage'>").html('! There is no work record for this job !');
						$("#recordsTableContainer").empty().append(messageSpan);
					}

				}
          	}
        }
    });
}

function updateStoppagesLogTable(JobId){
    // generate table
    // drop old table and append new one
    $.ajax({
        url:"../scripts/server/job_details.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getStoppagesLog",
            "jobId":JobId
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                console.log("Failed to update table: " + resultJson["result"]);
            }
            else{
				var tableData = resultJson.result.stoppagesLog;
                
                var tableStructure = {
                    "rows":{
                        "linksToPage":false
                    },
                    "columns":[
                        {
                            "headingName":"Location Name",
                            "dataName":"stationId"
                        },
                        {
                            "headingName":"Reason",
                            "dataName":"stoppageReasonName"
                        },
                        {
                            "headingName":"Description",
                            "dataName":"description"
                        },
                        {
                            "headingName":"Date",
                            "dataName":"startDate"
                        },
                        {
                            "headingName":"Time",
                            "dataName":"startTime"
                        },
                        {
                            "headingName":"Status",
                            "dataName":"status",
							"functionToRun":resolveStoppage,
                            "functionParamDataName":"ref",
                            "functionParamDataLabel":"ref",
                            "functionButtonText":"resolve"
                        }
                    ]
                };
                               
                
                var table = generateTable("stoppagesLogTable", tableData, tableStructure);
                $("#stoppagesLogTableContainer").empty().append(table);

				if($("#stoppagesLogTable").length)//check table exists
				{
					$("#stoppagesLogTableContainer").width($("#stoppagesLogTable").width() + 15);
				}

				for(var i = 0; i < tableData.length; i++)
				{
					buttonName = "#status_btn_" + i.toString();
					if (tableData[i]["status"]=="unresolved")
						$(buttonName).val("resolve");
					else 
					{
						$(buttonName).val(tableData[i]["status"]);
						$(buttonName).attr("disabled", true);
					}
				}				

				var stoppageReasons = resultJson.result.stoppageReasons;
				var clientList = resultJson.result.clientList;

				$("#addStoppageReasonDropDown").empty();
				var placeHolder = $("<option>")
							.text("Select a reason...")
							.attr("value", "");
				$("#addStoppageReasonDropDown").append(placeHolder);
				for(var i = 0; i < stoppageReasons.length; i++){
					var newOption = $("<option>")
						.text(stoppageReasons[i].stoppageReasonName)
						.attr("value", stoppageReasons[i].stoppageReasonId);
					$("#addStoppageReasonDropDown").append(newOption);
				}

				if(stoppageReasons.length == 1)
				{
					console.log(stoppageReasons[0])
					$("#addStoppageReasonDropDown").val(stoppageReasons[0].stoppageReasonId);
				}

				$("#addStoppageStationDropDown").empty();
				var placeHolder = $("<option>")
							.text("Select Location...")
							.attr("value", "");
				$("#addStoppageStationDropDown").append(placeHolder);
				var placeHolder = $("<option>")
							.text("Admin")
							.attr("value", "Admin");
				$("#addStoppageStationDropDown").append(placeHolder);
				
				
				// this has been tweaked to get the full list of available names.
				// At some point this entire section of the system could do to be 
				// reworked slightly
				$.ajax({
					url:"../scripts/server/scanners.php",
					type:"GET",
					dataType:"text",
					data:{
						"request":"getAllScannerNames"
					},
					success:function(result){
						resultJson = $.parseJSON(result);
						clientList = resultJson.result;
						for(var i = 0; i < clientList.length; i++){
							var newOption = $("<option>")
								.text(clientList[i])
								.attr("value", clientList[i]);
							$("#addStoppageStationDropDown").append(newOption);
						}
					}
				});
            }
        }
    });
}

function markJobComplete(JobId){
	if ($("#btnMarkComplete").val() == "Mark Job Complete")
	{
		//Mark job as Complete
		$.ajax({
		    url:"../scripts/server/job_details.php",
		    type:"GET",
		    dataType:"text",
		    data:{
		        "request":"markJobComplete",
		        "jobId":JobId
		    },
		    success:function(result){
		        console.log(result);
		        var responseJson = $.parseJSON(result);
		        
		        if(responseJson['status'] == 'success'){
					$("#btnMarkComplete").attr("disabled", true);
					loadJobRecord(JobId);
		            updateJobLogTable(JobId);
				}
		        else
		            console.log(responseJson['result']);
		    }
		});
	}
	else
	{
		//Mark job as Incomplete, Work in Progress
		$.ajax({
		    url:"../scripts/server/job_details.php",
		    type:"GET",
		    dataType:"text",
		    data:{
		        "request":"markJobIncomplete",
		        "jobId":JobId
		    },
		    success:function(result){
		        console.log(result);
		        var responseJson = $.parseJSON(result);
		        
		        if(responseJson['status'] == 'success'){
					$("#btnMarkComplete").attr("disabled", true);
					loadJobRecord(JobId);
		            updateJobLogTable(JobId);
				}
		        else
		            console.log(responseJson['result']);
		    }
		});
	}
}



function deleteJob(JobId){
	let JobName = $("#jobName").val();
	if(confirm("Are you sure you want to permantly delete job '" + JobName + "' and all associated logs?")){
		$.ajax({
			url:"../scripts/server/job_details.php",
			type:"GET",
			dataType:"text",
			data:{
				"request":"deleteJob",
				"jobId":JobId
			},
			success:function(result){
				console.log(result);
				var responseJson = $.parseJSON(result);

				if(responseJson['status'] == 'success'){
					$("#currentStatus").html("Deleted");
                    $("#btnMarkComplete").attr("disabled", true);
                    $("#btnDelete").attr("disabled", true);
					$("#btnDuplicate").attr("disabled", true);
                    $("#btnSaveChanges").attr("disabled", true);
					$("#btnAddStoppage").attr("disabled", true);
					$("#saveChangesFeedback").empty().html("Job Deleted");
				}
				else
					console.log(responseJson['result']);
			}
		});
	}
}

function generateNewJobName(jobName){
	$.ajax({
		url:"../scripts/server/job_details.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"getNewJobName",
			"jobName":jobName
		},
		success:function(result){
			console.log(result);
			let resultJson = $.parseJSON(result);
		if(resultJson.status == "success") {
				var newJobName = resultJson['result']
				return newJobName;
		}
	}
	})
}

function duplicateJob(JobId){
	// Save the new job to the database via a server script.
    var requestjobID = "";
    var description = $("#description").val();
	var routeName = $("#routeName").val();
    var dueDate = $("#dueDate").val();
	var jobTotalCharge = Math.round($("#chargeToCustomer").val() * 100); // get the value into pence
	var unitCount = $("#numUnits").val();
	var expHours = $("#expectedDuration").val();
	var priority = $("#priority").val();
	var customerName = $("#customerName").val();
	var JobName = $("#jobName").val();

	var newJobName = "";
	if (JobName != ""){
		newJobName = generateNewJobName(JobName);
	} else {
		alert("JobName must not be blank");
		return;
	}


	//check if user has attempted to change job ID with an invalid ID
	//in which case change to ID would be lost if duplicte was caried out
	newJobId = $("#jobId").val();
	if(newJobId != JobId)
	{		
		regexp = /^[a-z0-9_]+$/i;
		if(! regexp.test(newJobId)){
			return;
		}		
	}
	
	if(routeName == "")
		routeName = null;
	if(dueDate == "")
		dueDate = "9999-12-31";
	
	if(description.length > 200){
		console.log("Description length exceeds 200 characters. Stopping");
		$("#saveChangesFeedback").empty().html("Description's length must not be greater than 200");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	if(expHours.length == 0)
		var duration = null;
	else{
		var timeParts = expHours.split(":");
		if(timeParts.length != 2){
			console.log("Unable to continue. time format is incorrect");
			$("#saveChangesFeedback").empty().html("Time must be entered in the format HH:MM");
			setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			return;
		}

		var duration = (parseInt(timeParts[0],10) * 3600) + (parseInt(timeParts[1],10) * 60);
	}
	
	if(jobTotalCharge < 0){
		console.log("Total charge invalid- negative. Stopping");
		$("#saveChangesFeedback").empty().html("Total charge can not be negative.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	if(unitCount < 0){
		console.log("Unit Count invalid- negative. Stopping");
		$("#saveChangesFeedback").empty().html("Unit Count can not be negative.");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	if(customerName.length > 120){
		console.log("customer Name length exceeds 120 characters. Stopping");
		$("#saveChangesFeedback").empty().html("customer Name's length must not be greater than 120");
		setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
		return;
	}
	
	$.ajax({
		url:"../scripts/server/add_job.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"addJob",
			"jobName":newJobName,
			"jobId":requestjobID,
			"expectedDuration":duration,
			"description":description,
			"dueDate":dueDate,
			"routeName":routeName,
			"totalChargeToCustomer":jobTotalCharge,
			"unitCount":unitCount,
			"productId":$("#productId").html(),
			"customerName":customerName
		},
		success:function(result){
			console.log(result);
			var res = $.parseJSON(result);
			console.log(res);
			if(res["status"] == "success"){
				$("#saveChangesFeedback").empty().html("Page should redirect shortly...");
				setTimeout(function(){$("#saveChangesFeedback").empty();},10000);

				if('URLSearchParams' in window){
					var searchParams = new URLSearchParams(window.location.search);
					console.log(res["result"]["jobId"]);
					searchParams.set("jobId", res["result"]["jobId"]);
					window.location.search = searchParams.toString();
				}
			}
			else{
				$("#saveChangesFeedback").empty().html(res["result"]);
				setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			}
		}
	});
}

function checkIdChanged(){
	url = new URL(window.location.href);

	if(url.searchParams.get('idchange') == "true")
	{
		console.log("ID Change Found");
		$("#saveChangesFeedback").empty().html("Job ID Changed!! NEW QR CODE GENERATED, RE-PRINT!!");

		if('URLSearchParams' in window){
			var searchParams = new URLSearchParams(window.location.search);
			searchParams.delete("idchange");
			var newRelativePathQuery = window.location.pathname + "?" + searchParams.toString();
			history.pushState(null, '', newRelativePathQuery);
		}
		
	}
}

function getJobId(){
	var searchParams = new URLSearchParams(window.location.search);
	return searchParams.get('jobId');
}

function addStoppageBtnPress(jobId){
	var stoppageReasonId = $("#addStoppageReasonDropDown").val();
	var stationId = $("#addStoppageStationDropDown").val();
	var stoppageDescription = $("#stoppageDescription").val();

	if(stoppageReasonId=="" || stationId=="")
	{
		console.log("Station ID or Stoppage Reason not selected.");
		$("#addStoppageFeedback").empty().html("Please select station and stoppage reason.");
		setTimeout(function(){$("#addStoppageFeedback").empty();},10000);
	}
	else
	{
		addStoppage(jobId, stoppageReasonId, stationId, stoppageDescription);
	}		
}

function addStoppage(jobId, stoppageId, stationId, stoppageDescription, status="unresolved"){
	$.ajax({
		url:"../scripts/server/client_input.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"recordStoppage",
			"jobId":jobId,
			"stoppageId":stoppageId,
			"stationId":stationId,
			"jobStatus":status,
			"description":stoppageDescription
		},
		success:function(result){
			console.log(result);
			var res = $.parseJSON(result);
			console.log(res);
			if(res["status"] == "success"){
				updateStoppagesLogTable(jobId);
				stoppageDescription = $("#stoppageDescription").val("");
			}
			else{
				$("#addStoppageFeedback").empty().html(res["result"]);
				setTimeout(function(){$("#addStoppageFeedback").empty();},10000);
			}
		}
	});
}

function resolveStoppage(stoppageRef){
	$.ajax({
		url:"../scripts/server/job_details.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"resolveStoppage",
			"stoppageRef":stoppageRef
		},
		success:function(result){
			console.log(result);
			var res = $.parseJSON(result);
			console.log(res);
			if(res["status"] == "success"){
				updateStoppagesLogTable(getJobId())
			}
			else{
				$("#saveChangesFeedback").empty().html(res["result"]);
				setTimeout(function(){$("#saveChangesFeedback").empty();},10000);
			}
		}
	});
}
