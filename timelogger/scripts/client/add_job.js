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
    $(".jobDetailsInput").on('keyup', function(){
		var jobName = $("#jobNameInput").val();
        var jobID = $("#jobIdNumberInput").val();
        var expHours = $("#expectedHoursInput").val();
        var description = $("#descriptionInput").val();
        var customerName = $("#customerNameInput").val();
        
		var jobNameCharsRemaining = 20 - jobName.length;
        var jobIdCharsRemaining = 20 - jobID.length;
        var descCharsRemaining = 200 - description.length;
        var custCharsRemaining = 120 - customerName.length;
        $("#jobIdCounter").html(jobIdCharsRemaining + "/20");
		$("#jobNameCounter").html(jobNameCharsRemaining + "/20");
        $("#descriptionCounter").html(descCharsRemaining + "/200"); 
        $("#customerNameCounter").html(custCharsRemaining + "/120"); 
    });
    $(".jobDetailsInput").trigger("keyup",null);
	
	$("#btnUploadCsv").click(function(event){
		event.preventDefault();
		uploadCsv();
	});
	
	loadInitialRoutesData();
	loadProducts();
	
	$(".jobDetailsInput").keypress(function(e) {
		var keycode = (e.keycode ? e.keycode : e.which)
		if (keycode == 13){
			handleNewJob();
		}
	});	
   
	$("#jobNameInput").focus();

	$("#searchPhrase").keypress(function(e) {
		var keycode = (e.keycode ? e.keycode : e.which)
		if (keycode == 13){
			searchJobs();
		}
	});


});

//update the size of the body to the correct width for the table that has been added
function updateBodySize(){	
	if($("#userTable").length)//check table exists
	{
		$("Body").width($("#userTable").width());
	}
}

function loadProducts(){
	$.ajax({
		url:"../scripts/server/products.php",
		type:"GET",
		dataTtype:"text",
		data:{
			"request":"getProductsList"
		},
		success:function(result){
			console.log(result);
			var resultJson = $.parseJSON(result);
			
			if(resultJson.status != "success"){
				$("#spanFeedback").empty().html(resultJson.result);
			}
			else
			{
				var productsList = resultJson["result"];
				$("#productIdDropDown").empty();
				var placeHolder = $("<option>")
						.text("Select a Product...")
						.attr("value", "");
				$("#productIdDropDown").append(placeHolder);
				for(var i = 0; i < productsList.length; i++){
					var newOption = $("<option>")
						.text(productsList[i])
						.attr("value", productsList[i]);
					$("#productIdDropDown").append(newOption);
				}
			}
		}
	});
}

function handleNewJob(){
	clearCsvResults();

	// Save the new job to the database via a server script.
    // Present download link to allow the QR code to be
    // downloaded and printed.
    var jobID = $("#jobIdNumberInput").val();
    jobID = jobID.trim();
	var jobName = $("#jobNameInput").val();
    jobName = jobName.trim();
    var description = $("#descriptionInput").val();
	var routeName = $("#textboxRouteName").val();
    var dueDate = $("#jobDueDateInput").val();
	var jobTotalCharge = $("#jobTotalCharge").val(); // get the value into pence
	var unitCount = $("#unitCount").val();
	var totalParts = $("#totalParts").val();
	var productId = $("#productIdDropDown").val();
	var priority = $("#priority").val();
	var customerName = $("#customerNameInput").val();
	
	if(routeName == "")
		routeName = null;
	if(dueDate == "")
		dueDate = "9999-12-31";

	
	regexp = /^[a-z0-9_]*$/i;
	if(jobName != "" && (! regexp.test(jobName))){
		console.log("Job Name entered contains invalid chars. Stopping");
		$("#saveJobResponseField").empty().html("Job Name must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	if(jobName.length > 20){
		console.log("Job Name length exceeds 20 characters. Stopping");
		$("#saveJobResponseField").empty().html("Job Name's length must not be greater than 20");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	regexp = /^[a-z0-9_]*$/i;
	if(jobID != "" && (! regexp.test(jobID))){
		console.log("Job ID entered contains invalid chars. Stopping");
		$("#saveJobResponseField").empty().html("Job ID must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	if(jobID.length > 20){
		console.log("Job ID length exceeds 20 characters. Stopping");
		$("#saveJobResponseField").empty().html("Job ID's length must not be greater than 20");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	if(description.length > 200){
		console.log("Description length exceeds 200 characters. Stopping");
		$("#saveJobResponseField").empty().html("Description's length must not be greater than 200");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	//check a name was given if a new route description was entered
	if(routeName == null)
	{
		if($("#textboxRouteDesc").val() != "")
		{
			console.log("Route name not given for route description. Stopping");
			$("#saveJobResponseField").empty().html("Route name not given for route description!");
			setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			return;
		}
	}
	else
	{
		regexp = /^[a-z0-9_ ]+$/i;
		if(! regexp.test(routeName)){
			console.log("Route Name entered contains invalid chars. Stopping");
			$("#saveJobResponseField").empty().html("Route Name must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
			setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			return;
		}

		if(routeName.length > 50){
			$("#saveJobResponseField").html("Please enter a route name of less than 50 characters");
			setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			return;
		}
	}
	
	var expHours = $("#expectedHoursInput").val();
	expHoursRegExp= /^\d+:[0-5][0-9]?$/
	if(! expHoursRegExp.test(expHours))
	{
		if ( expHours == "")
		{
			var duration = null;
		}
		else
		{
			console.log("Expected hours invalid input");
			$("#saveJobResponseField").empty().html("Expected Time value is invalid, please enter in format HH:MM");
			setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			return
		}
	}
	else{
		var timeParts = expHours.split(":");
		if(timeParts.length != 2){
			console.log("Unable to continue. time format is incorrect");
			$("#saveJobResponseField").empty().html("Time must be entered in the format HH:MM");
			setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			return;
		}

		var duration = (parseInt(timeParts[0])) +":"+ (parseInt(timeParts[1]));
	}
	
	if(jobTotalCharge < 0){
		console.log("Total charge invalid- negative. Stopping");
		$("#saveJobResponseField").empty().html("Total charge can not be negative.");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}

	if(unitCount < 0){
		console.log("Unit Count invalid- negative. Stopping");
		$("#saveJobResponseField").empty().html("Unit Count can not be negative.");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}

	if(totalParts < 0){
		console.log("Total Parts invalid- negative. Stopping");
		$("#saveJobResponseField").empty().html("Total Parts can not be negative.");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}

	if(productId == "noSelection" || productId == null){
		productId = '';
	}
	
	if(customerName.length > 120){
		console.log("Customer name length exceeds 120 characters. Stopping");
		$("#saveJobResponseField").empty().html("Customer name's length must not be greater than 120");
		setTimeout(function(){$("#saveJobResponseField").empty();},10000);
		return;
	}
	
	$.ajax({
		url:"../scripts/server/add_job.php",
		type:"GET",
		dataType:"text",
		data:{
			"request":"addJob",
			"jobId":jobID,
			"expectedDuration":duration,
			"description":description,
			"dueDate":dueDate,
			"routeName":routeName,
			"totalChargeToCustomer":jobTotalCharge,
			"unitCount":unitCount,
			"totalParts":totalParts,
			"productId":productId,
			"priority":priority,
			"customerName":customerName,
			"jobName":jobName
		},
		success:function(result){
			console.log(result);
			var res = $.parseJSON(result);
		console.log(res);
			if(res["status"] == "success"){
				// save the route. Any existing route of the same name is overwritten silently.
				if(routeName != "")
					saveRoute();

				jobID = res["result"]["jobId"];

				setCodeDownloadLink(jobID, jobName)

                $("#jobIdNumberInput").empty().val(jobID);
			}
			else{
				$("#saveJobResponseField").empty().html(res["result"]);
				setTimeout(function(){$("#saveJobResponseField").empty();},10000);
			}
		}
	});
}

function clearInputs(){
	//return inputs to defualt to enable user to add new job
    $("#jobNameInput").val("");
	$("#jobIdNumberInput").val("");
    $("#descriptionInput").val("");
    $("#expectedHoursInput").val("");
    $("#textboxRouteName").val("");
    $("#jobDueDateInput").val("");
    $("#jobTotalCharge").val("");
    $("#unitCount").val("");
    $("#textboxRouteDesc").val("");
    $("#jobIdCounter").html("20/20");
    $("#descriptionCounter").html("200/200");
    $("#customerNameCounter").html("120/120");
	$("#productIdDropDown").val("");
	$("#customerNameInput").val("");
}

function setCodeDownloadLink(JobID, JobName)
{

	var url = new URL(window.location.origin + "/timelogger/scripts/server/getQrCode.php?request=getDownloadJobIdQrCode&jobId=" + JobID);
                var a = $('<a/>')
                    .attr('href', url)
                    .html('Click here to download - ' + JobName + ' - ID - QR Code');
                $("#saveJobResponseField").empty().append(a);
}

function searchJobs(){
    // requests the overview table data corresponding to the specified search term,
	// and presents it as a table to the user. Basically a cut-down verson of the
	// overview screen's update function.
    
    var searchPhrase = $('#searchPhrase').val();
	
	$(".searchControl").attr("disabled", true);
	$("#searchResults").empty().html("Searching. Please wait....");
    
    $.ajax({
        url:"../scripts/server/overview.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getOverviewData",
            "tableOrdering":"alphabetic",
            "hideCompletedJobs":false,
            "useDateRange":false,
			"useSearchKey":true,
			"searchKey":searchPhrase
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                console.log("Failed to update table: " + resultJson["result"]);
                $("#tablePlaceholder").html(resultJson["result"]);
            }
            else{
                
                
                var tableData = resultJson["result"]["overviewData"];
                var tableStructure = {
                    "rows":{
                        "linksToPage":true,
                        "link":"job_details_client.php",
                        "linkParamLabel":"jobId",
                        "linkParamDataName":"jobId"
                    },
                    "columns":[
                        {
                            "headingName":"Job Name",
                            "dataName":"jobName"
                        },
						{
                            "headingName":"Job ID",
                            "dataName":"jobId"
                        },
                        {
                            "headingName":"Expected Time",
                            "dataName":"expectedTime"
                        },
                        {
							"headingName":"Due Date",
							"dataName":"dueDate"
						},
                        {
                            "headingName":"Description",
                            "dataName":"description"
                        },
						{
							"headingName":"Charge (£)",
							"dataName":"totalCharge"
						},
						{
							"headingName":"Number of Units",
							"dataName":"numberOfUnits"
						},
						{
							"headingName":"Product ID",
							"dataName":"productId"
						},
                        {
                            "headingName":"Job Added",
                            "dataName":"recordAdded"
                        },
						{
                            "headingName":"Job status",
                            "dataName":"currentStatus"
                        },
                        {
                            "headingName":"Worked Time",
                            "dataName":"workedTime"
                        },
                        {
                            "headingName":"Overtime",
                            "dataName":"overtime"
                        },
                        {
                            "headingName":"Efficiency (max 1)",
                            "dataName":"efficiency"
                        }
                    ]
                };
                
                var table = generateTable("userTable", tableData, tableStructure);
                $("#searchResults").empty().append(table);
		updateBodySize();
                
                $(".searchControl").attr("disabled", false);
            }
        }
    });
}

function uploadCsv(){
	console.log("selected file name: " + $("#jobCsvSelection").val());
	
	clearCsvResults();

	if($("#jobCsvSelection").val() == ""){
		$("#csvResponseField").html("Please select a CSV file to upload");
		setTimeout(function(){$("#csvResponseField").empty();},10000);
		return;
	}
	
	// Get form
	var form = $('#fileUploadForm')[0];

	// Create an FormData object 
	var data = new FormData(form);

	// If you want to add an extra field for the FormData
	data.append("request", "processCsvUpload");

	// disabled the submit button
	$("#btnUploadCsv").prop("disabled", true);
	$("#csvResponseField").html("Processing. Please wait...");
	//for (var pair of data.entries())
	//	console.log(pair[0]+', '+pair[1]);

	$.ajax({
		type: "POST",
		enctype: 'multipart/form-data',
		url: "../scripts/server/add_job.php",
		data: data,
		processData: false,
		contentType: false,
		cache: false,
		timeout: 600000,
		success: function (result) {
			console.log(result);
			resultJson = $.parseJSON(result);
			if(resultJson["status"] != "success"){
                console.log("Failed to add jobs: " + resultJson["result"]);
                $("#csvResponseField").html(resultJson["result"]);
            }
            else
			{
				$("#csvResponseField").html(resultJson["result"]["responceText"]);
				displayCsvResultsTable(resultJson["result"]["jobsAdded"]);
			}
			
			$("#btnUploadCsv").prop("disabled", false);
		},
		error: function (e) {
			console.log("ERROR : ", e);
			$("#btnUploadCsv").prop("disabled", false);
			$("#csvResponseField").html("Error");
		}
	});
}

function displayCsvResultsTable(tableData){
    var tableStructure = {
        "rows":{
            "linksToPage":true,
            "link":"job_details_client.php",
            "linkParamLabel":"jobId",
            "linkParamDataName":"jobId",
			"classDeciderFunction":function(RowData){
					if("result" in RowData && RowData.result != "Added")
					   return "highlight csvJobAddFail";
				}
        },
        "columns":[
            {
                "headingName":"Job ID",
                "dataName":"jobId"
            },
            {
                "headingName":"Result",
                "dataName":"result"
            },
            {
                "headingName":"QR Code",
                "linkDataName":setCodeDownloadLink(JobID, JobName),
                "linkIsDownload":true,
                "linkText":"QR code"
            }
        ]
    };
    
    var table = generateTable("csvResultTable", tableData, tableStructure);
    $("#csvResults").empty().append(table);
	updateTableContainerSize();

	if($("#csvResultTable").length)//check table exists
	{
		$("#csvResults").width($("#csvResultTable").width() + 15);
	}
}

function clearCsvResults()
{
	$("#csvResponseField").html("");
	$("#csvResults").empty();
	updateTableContainerSize();
}

function updateTableContainerSize(){	
	if($("#csvResultTable").length)//check table exists
	{
		$("csvResults").width($("#csvResultTable").width());
	}
}
