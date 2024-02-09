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
    updateProductTable();
    $(".productInput").on('keyup', function(){
        var productId = $("#newProductId").val();
        productId = productId.trim();
        
        var productIdCharsRemaining = 20 - productId.length;
        $("#newProductIdCounter").html(productIdCharsRemaining + "/20");
    });
    $(".productInput").trigger("keyup",null);

	$("#newProductId").keypress(function(e) {
		var keycode = (e.keycode ? e.keycode : e.which)
		if (keycode == 13){
			addNewProduct();
		}
	});	

	$("#newProductId").focus();

	$("#searchPhrase").keypress(function(e) {
		var keycode = (e.keycode ? e.keycode : e.which)
		if (keycode == 13){
			searchProducts();
		}
	});
});

function updateProductTable(){
    // get product data, ordered by selected option
    // generate table
    // drop old table and append new one
    
	var searchPhrase = $("#searchPhrase").val();
    
    $.ajax({
        url:"../scripts/server/products.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"getProductTableData",
            "searchPhrase":searchPhrase
        },
        success:function(result){
            console.log(result);
            resultJson = $.parseJSON(result);
            
            if(resultJson["status"] != "success"){
                console.log("Failed to update table: " + resultJson["result"]);
                $("#tablePlaceholder").html(resultJson["result"]);
            }
            else{
                var tableData = resultJson["result"];
                
                var tableStructure = {
                    "rows":{
			"linksToPage":false
                    },
                    "columns":[
                        {
                            "headingName":"Product ID",
                            "dataName":"productId",
                            "generatePlainLinkCells": true,
							"link":"job_details_client.php",
							"linkParamLabel":"jobId",
							"linkParamDataName":"currentJobId"
                        },
						{
                            "headingName":"Current Job",
                            "dataName": "jobName",
                            "generatePlainLinkCells": true,
							"link":"job_details_client.php",
							"linkParamLabel":"jobId",
							"linkParamDataName":"currentJobId"
                        },
                        {
                            "headingName":"QR Code",
                            "functionToRun":getDownloadProductIdQrCode,
                            "functionParamDataName":"productId",
                            "functionParamDataLabel":"productId",
                            "functionButtonText":"Download QR Code"

                        },
                        {
                            "headingName":"Delete Product",
                            "functionToRun":deleteProduct,
                            "functionParamDataName":"productId",
                            "functionParamDataLabel":"productId",
                            "functionButtonText":"Delete Product"
                        }
                    ]
                };
                
                var table = generateTable("productTable", tableData, tableStructure);
                $("#existingProductsContainer").empty().append(table);
            }
        }
    });
}

function addNewProduct(){
    var productId = $("#newProductId").val();
    
    if(productId.length == 0){
        $("#addProductResponseField").html("Product ID must not be blank");
        return;
    }
    
    if(productId.length > 20){
        $("#addProductResponseField").html("Product ID must not be longer than 20 characters");
        return;
    }
	
	regexp = /^[a-z0-9_]+$/i;
	if(!regexp.test(productId)){
		$("#addProductResponseField").html("Product ID must only contain letters (a-z, A-Z), numbers (0-9) and underscores (_)");
		return;
	}
	
	if(productId.charAt(0) == ' '){
		$("#addProductResponseField").html("Product ID cannot start with a space.");
		return;
	}
    
    $.ajax({
        url:"../scripts/server/products.php",
        type:"GET",
        dataType:"text",
        data:{
            "request":"addProduct",
            "productId":productId
        },
        success:function(result){
	    console.log(result);
            resultJson = $.parseJSON(result);
            if(resultJson["status"] != "success")
                $("#addProductResponseField").html(resultJson["result"]);
            else{
                $("#addProductResponseField").html("Generating QR code. Please wait...");

                var url = new URL(window.location.origin + "/timelogger/scripts/server/getQrCode.php?request=getDownloadProductIdQrCode&productId=" + productId);
                var a = $('<a/>')
                    .attr('href', url)
                    .html('Click here to download - ' + productId + ' ID - QR Code');
                $("#addProductResponseField").empty().append(a);
                
                // at this point, a new user is present in the system, so update the display
                updateProductTable();
				
				//Empty new user input box
				$("#newProductId").val("");
                $("#newProductIdCounter").html("50/50");
            }
        }
    });
}

function onGetDownloadProductIdQrCodeClick(event){
    getDownloadProductIdQrCode(event.data.ProductId);
}

function getDownloadProductIdQrCode(productId){
    // send a request to download the stoppage qr code. 
    
    var url = new URL(window.location.origin + "/timelogger/scripts/server/getQrCode.php?request=getDownloadProductIdQrCode&productId=" + productId);
    window.location.href = url;
}

function deleteProduct(productId){
    // find nearest element with a productId attached to it
    // send a request to delete that user
    // refresh the table
    if(confirm("Are you sure you want to permantly delete product '" + productId + "'?\nThis will NOT affect any jobs that are for this product.")){
		console.log("Deleting product with ID " + productId);
		
		$.ajax({
		    url:"../scripts/server/products.php",
		    type:"GET",
		    dataType:"text",
		    data:{
		        "request":"deleteProduct",
		        "productId":productId
		    },
		    success:function(result){
			console.log(result);
		        updateProductTable();
		    }
		});
	}
}

function searchProducts(){
	$(".searchControl").attr("disabled", true);
	$("#productTable").empty().html("Searching. Please wait....");
	updateProductTable();
	$(".searchControl").attr("disabled", false);
}
