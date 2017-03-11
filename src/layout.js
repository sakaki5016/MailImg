window.onresize = onloadLayout;

function onloadLayout(){
	var sH,s;
	sH = window.innerHeight;

	var fileListDivH = sH - $("#captionDiv").outerHeight(true) - $("#bottomCtrlDiv").outerHeight(true) - 20;
	$("#fileListDiv").height(fileListDivH);
}

function onChangeSizeRadio(){
	if($('input[name=sizeRadio]:checked').val() === 'input'){
		$("#settingSize").prop("disabled", false);

	}else{
		$("#settingSize").prop("disabled", true);
	}
}