const packager = require("electron-packager");
// 毎回オプションを書き直すのは面倒くさいのでpackage.jsonから引っ張ってくる
const package = require("./src/package.json");

packager({
    name: package["name"],
    dir: "./src",// ソースフォルダのパス
    out: "./pkg",// 出力先フォルダのパス
    icon: "./src/icon.ico",// アイコンのパス
    platform: "win32",
    arch: "x64",
    electronVersion: "1.6.1",// Electronのバージョン
    overwrite: true,// 上書き
    asar: false,// asarパッケージ化
    "app-version": package["version"],// アプリバージョン
    "app-copyright": "Copyright (C) 2017 Takekazu Sakaki.",// コピーライト
    
    "version-string": {// Windowsのみのオプション
        CompanyName: "jadeModels",
        FileDescription: package["name"],
        OriginalFilename: package["name"]+".exe",
        ProductName: package["name"],
        InternalName: package["name"]
    }
    
}, function (err, appPaths) {// 完了時のコールバック
    if (err) console.log(err);
    console.log("Done: " + appPaths);
});