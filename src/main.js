// アプリケーション作成用のモジュールを読み込み
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const dialog = electron.dialog
const ipc = electron.ipcMain
 
const path = require('path');
const url = require('url');
const fs = require('fs');
 
// メインウィンドウ
let mainWindow;
 
function createWindow () {
  // メインウィンドウを作成します
  mainWindow = new BrowserWindow({width: 1000, height: 700})
 
  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
 
  // デベロッパーツールの起動
//  mainWindow.webContents.openDevTools();

  // 作業用ディレクトリの作成
  try{
	fs.mkdirSync(".\\Images", function (err) {
		if (err){
		alert("作業用ディレクトリの作成に失敗しました");
		return cb(err);
		}
	});
  }catch(e){
	  // 作成済みです
  }

  // 出力用ディレクトリの作成
  try{
	fs.mkdirSync(".\\output", function (err) {
		if (err){
		alert("作業用ディレクトリの作成に失敗しました");
		return cb(err);
		}
	});
  }catch(e){
	  // 作成済みです
  }
 
  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}
 
//  初期化が完了した時の処理
app.on('ready', createWindow);
 
// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', function () {
  // macOSのとき以外はアプリケーションを終了させます
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', function () {
  /// メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow();
  }
});

// フォルダ選択ダイアログを開きます
ipc.on('open-directory-dialog', function (event) {
  dialog.showOpenDialog({
	properties: ['openFile', 'openDirectory']
  }, function (files) {
    if (files){
		 event.sender.send('selected-directory', files)
	}else{
		 event.sender.send('cansel-select', files)
	}
  })
})

// ファイル選択ダイアログを開きます
ipc.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  }, function (files) {
    if (files){
		 event.sender.send('selected-file', files)
	}else{
		 event.sender.send('cansel-select', files)
	}
  })
})

// 確認ダイアログを開きます
ipc.on('open-agree-dialog', function (event) {
	const options = {
		type: 'info',
		title: '確認',
		message: "添付用のZIPファイルを作成します",
		buttons: ['続行', 'キャンセル']
	}

	dialog.showMessageBox(options, function (index) {
		event.sender.send('information-agree-selection', index)
	})
})

// ３Mオーバー確認ダイアログ
ipc.on('open-alert-over3m-dialog', function (event) {
	const options = {
		type: 'warning',
		title: '警告',
		message: "ファイルサイズが3M byteを超えています\nメールで送信できない可能性が高いです\n\n保存しますか？",
		buttons: ['保存', 'キャンセル']
	}

	dialog.showMessageBox(options, function (index) {
		event.sender.send('information-alert-over-selection', index)
	})
})

// 2Mオーバー確認ダイアログ
ipc.on('open-alert-over2m-dialog', function (event) {
	const options = {
		type: 'warning',
		title: '警告',
		message: "ファイルサイズが2M byteを超えています\nメールで送信できないことがあります\n\n保存しますか？",
		buttons: ['保存', 'キャンセル']
	}

	dialog.showMessageBox(options, function (index) {
		event.sender.send('information-alert-over-selection', index)
	})
})

// ZIPファイル保存ダイアログを開きます
ipc.on('save-dialog', function (event) {
	var today = new Date();
	var year = today.getFullYear();
	var month = today.getMonth() + 1;
	var day = today.getDate();
	var timestamp = year + "_" + month + "_" + day;

	var timestamp = 'YYYY_MM_DD';
	timestamp = timestamp.replace(/YYYY/g, today.getFullYear());
	timestamp = timestamp.replace(/MM/g, ('0' + (today.getMonth() + 1)).slice(-2));
	timestamp = timestamp.replace(/DD/g, ('0' + today.getDate()).slice(-2));

	var dir_home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
	var dir_desktop = require("path").join(dir_home, "Desktop");
	var registPath = dir_desktop + "\\jademodels(" + timestamp + ")";

	const options = {
		title: 'Save ZIP',
		defaultPath: registPath,
		filters: [
			{ name: 'ZIP', extensions: ['zip'] }
		]
	}
	dialog.showSaveDialog(options, function (filename) {
		event.sender.send('saved-file', filename)
	})
})