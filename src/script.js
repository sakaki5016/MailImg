var $ = jQuery = require("./js/jquery-3.1.1.min.js");
var blockUI = require("./js/jquery.blockUI.js");

const ipc = require('electron').ipcRenderer

var fs = require('fs');
var base64 = require('urlsafe-base64');
var getDirName = require("path").dirname;
var archiver = require('archiver');

const tmpZipName = 'output\\Images.zip';
var imgLeadingStr = "jadeModels";

// documentにドラッグされた場合
document.ondragover = function(e){
	// イベントの伝搬を止めて、アプリケーションのHTMLとファイルが差し替わらないようにする
	e.preventDefault();
}

/** documentにドロップされた場合 */
document.ondrop = function(e) {
	e.preventDefault(); // イベントの伝搬を止めて、アプリケーションのHTMLとファイルが差し替わらないようにする

	var files = e.dataTransfer.files;
	var fileSize = files.length;
	for(var fileIdx=0; fileIdx<fileSize; fileIdx++){
		var path = files[fileIdx].path;
		if(	fs.statSync(path).isFile() 
			&& (/.*\.jpg$/.test(path) || /.*\.jpeg$/.test(path) || /.*\.JPG$/.test(path) || /.*\.JPEG$/.test(path))
		){
			addImage(path);
		
		}else if(fs.statSync(path).isDirectory()){
			selectDir(path);
			break;
		}
	}

	return false;
};

// フォルダー選択
function onClickFolderSelect(){
	// 読み込み中の表示
	$.blockUI({
		message: '選択中',
		css: {
			border: 'none',
			padding: '10px',
			backgroundColor: '#333',
			opacity: .5,
			color: '#fff'
		},
		overlayCSS: {
			backgroundColor: '#000',
			opacity: 0.6
		}
	});

	ipc.send('open-directory-dialog')
}

// フォルダー選択後の処理（画像の読み込み）
ipc.on('selected-directory', function (event, path) {
	var selDir = path[0];
	selectDir(selDir);

	// 読み込み中を非表示
	$.unblockUI();
})

// ファイル選択
function onClickFileSelect(){
	// 読み込み中の表示
	$.blockUI({
		message: '選択中',
		css: {
			border: 'none',
			padding: '10px',
			backgroundColor: '#333',
			opacity: .5,
			color: '#fff'
		},
		overlayCSS: {
			backgroundColor: '#000',
			opacity: 0.6
		}
	});

	ipc.send('open-file-dialog')
}

// ファイル選択後の処理（画像の読み込み）
ipc.on('selected-file', function (event, files) {
	var fileSize = files.length;
	for(var fileIdx=0; fileIdx<fileSize; fileIdx++){
		var path = files[fileIdx];
		if(	fs.statSync(path).isFile() 
			&& (/.*\.jpg$/.test(path) || /.*\.jpeg$/.test(path) || /.*\.JPG$/.test(path) || /.*\.JPEG$/.test(path))
		){
			addImage(path);
		}
	}

	// 読み込み中を非表示
	$.unblockUI();
})

// 選択ダイアログをキャンセル
ipc.on('cansel-select', function (event, files) {
	// 読み込み中を非表示
	$.unblockUI();
})

// フォルダ選択時の処理
function selectDir(selDir){
	fs.readdir(selDir, function(err, files){
		if (err) throw err;
		var fileList = [];
		files.filter(function(file){
			if(	fs.statSync(selDir + "\\" + file).isFile() 
				&& (/.*\.jpg$/.test(file) || /.*\.jpeg$/.test(file) || /.*\.JPG$/.test(file) || /.*\.JPEG$/.test(file))
			){
				return true;
			}else{
				return false;
			}

		}).forEach(function (file) {
			fileList.push(selDir + "\\" + file);
		});
		
		var imgCnt = fileList.length;
		for(var imgIdx=0; imgIdx<imgCnt; imgIdx++){
			var img = fileList[imgIdx];
			addImage(img);
		}
	});
}

// イメージの追加
function addImage(selFile){
	var orgHtml = $("#fileListDiv").html();
	$("#fileListDiv").html(orgHtml + "<img class='loadImg' src='" + selFile + "' style='width:300px;'/>");
}

// クリアボタン
function onImageClearBtn(){
	$("#fileListDiv").html("");
}

var zipFileSize = 0;
// 実行ボタン
function onClickExecBtn(){
	if(!$(".loadImg").length){
		alert("写真が選択されていません！");
		return;
	}

	// 処理中の表示
	$.blockUI({
		message: '処理中',
		css: {
			border: 'none',
			padding: '10px',
			backgroundColor: '#333',
			opacity: .5,
			color: '#fff'
		},
		overlayCSS: {
			backgroundColor: '#000',
			opacity: 0.6
		}
	});

	ipc.send('open-agree-dialog')
}

// 確認ダイアログ後の処理
ipc.on('information-agree-selection', function (event, index) {
	if (index === 0){
		// 作業ディレクトリの初期化
		ClearWorkDir();

		// 画像の圧縮
		if(CompressImage()){
			// ZIPファイルの作成
			makeZipFile();

		}else{
			// 処理中を非表示
			$.unblockUI();
		}
	}else{
		// 処理中を非表示
		$.unblockUI();
	}
})

// ZIPファイルの保存
function checkZipFileSize(){
	var goSave = true;
	if(zipFileSize == 0){
		alert("ZIPファイルの作成に失敗しました");
		goSave = false;

	}else if(zipFileSize > 3145728){
		ipc.send('open-alert-over3m-dialog')

	}else if(zipFileSize > 2097152){
		ipc.send('open-alert-over2m-dialog')

	}else{
		saveZipFile(goSave);
	}
}

// サイズオーバー警告ダイアログ選択後
ipc.on('information-alert-over-selection', function (event, index) {
	var flag = false;
	if (index === 0){
		flag = true;
	}

	saveZipFile(flag);
})

// ZIPファイルの保存
function saveZipFile(flag){
	if(flag){
		// 保存ダイアログの表示
		ipc.send('save-dialog');

	}else{
		// 処理中を非表示
		$.unblockUI();
	}
}

// 作業ディレクトリの初期化
function ClearWorkDir(){
	var workPath = ".\\Images";
	var workRemoveFiles = fs.readdirSync(workPath);
	for (var workFile in workRemoveFiles) {
		fs.unlinkSync(workPath + "\\" + workRemoveFiles[workFile]);
	}

	var outputPath = ".\\output";
	var outputRemoveFiles = fs.readdirSync(outputPath);
	for (var outputFile in outputRemoveFiles) {
		fs.unlinkSync(outputPath + "\\" + outputRemoveFiles[outputFile]);
	}
}

// 画像の圧縮
function CompressImage(){
	var cmpSize = GetCompressSize();
	if(cmpSize == 0){
		alert("サイズを指定してください");
		return false;
	}
	
	$(".loadImg").each(function(i, elem) {
		var orgWidth = $(elem).get(0).naturalWidth;
		var orgHeight = $(elem).get(0).naturalHeight;

		var settingWidth  = cmpSize;
		var settingHeight = cmpSize;

		// 横幅の方が大きい場合
		if(orgWidth > orgHeight){
			settingHeight = orgHeight * (cmpSize / orgWidth);	// 横幅を基準に高さを決める

		// 高さの方が大きい場合
		}else{
			settingWidth = orgWidth * (cmpSize / orgHeight);	// 高さを基準に横派がを決める
		}

		var cmpImg = ImageResize($(elem).get(0), "image/jpeg", settingWidth, settingHeight);

		var tmpimg = cmpImg.split( ',' );
		var b64img = tmpimg[1];
		var img = base64.decode( b64img );

		var imgIdx = i + 1;
		writeFile('.\\Images\\' + imgLeadingStr + '(' + imgIdx + ').jpg', img);
	});

	return true;
}

// 圧縮サイズの取得
function GetCompressSize(){
	var settingSize = 0;
	if($('input[name=sizeRadio]:checked').val() === 'input'){
		settingSize = $("#settingSize").val();

	}else{
		settingSize = parseInt($('input[name=sizeRadio]:checked').val(), 10);
	}

	return settingSize;
}

// 画像のリサイズ処理
function ImageResize(image_src, mime_type, width, height) {
    // New Canvas
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    // Draw (Resize)
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image_src, 0, 0, width, height);
    // Image Base64
    return canvas.toDataURL(mime_type);
}

// リサイズしたファイルの書き出し
function writeFile(path, data) {
	fs.writeFile(path, data, function (error) {
		if (error != null) {
			alert("error : " + error);
			return;
		}
	});
}

// ZIPファイルの作成
function makeZipFile() {
	zipFileSize = 0;

	// create a file to stream archive data to.
	var output = fs.createWriteStream(tmpZipName);
	var archive = archiver('zip', {
		zlib: { level: 9 } // Sets the compression level.
	});


	// listen for all archive data to be written
	output.on('close', function() {
		zipFileSize = archive.pointer();
		console.log(archive.pointer() + ' total bytes');

		checkZipFileSize();
	});

	// good practice to catch this error explicitly
	archive.on('error', function(err) {
		zipFileSize = 0;
		alert("ZIPファイルの作成に失敗しました");

		// 処理中を非表示
		$.unblockUI();

		throw err;
	});

	// pipe archive data to the file
	archive.pipe(output);

	// append files from a directory
	archive.directory('Images\\');

	// finalize the archive (ie we are done appending files but streams have to finish yet)
	archive.finalize();
}

// ZIPファイル保存後の処理
ipc.on('saved-file', function (event, path) {
	if (path){
		fs.createReadStream(tmpZipName).pipe(fs.createWriteStream(path));
	}

	// 処理中を非表示
	$.unblockUI();
})