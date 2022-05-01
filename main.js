"ui";
(() => {

    ui.layout(
        <vertical padding="8 8" gravity="center">
            <progressbar id="progressbar" gravity="center" style="@style/Base.Widget.AppCompat.ProgressBar.Horizontal"/>
            <text id="download_message" gravity="center" />
            <button id="try_download" gravity="center" text="重试" style="Widget.AppCompat.Button.Colored"/>
        </vertical>
    );

    let keep = true;
    let base_path = context.getExternalFilesDir("CleanUpWeChatZombieFans").getAbsolutePath() + "/";
    let base_url = "https://gitee.com/L8426936/CleanUpWeChatZombieFans/raw/master/";
    // 本地测试使用
    // let base_url = "http://192.168.123.105/auto.js-script/CleanUpWeChatZombieFans/";

    /**
     * 初始化配置
     */
    function init() {
        ui.try_download.setEnabled(false);
        let complete = files.exists(base_path + "config/files_md5.json");
        if (complete) {
            for (let key in JSON.parse(files.read(base_path + "config/files_md5.json"))) {
                if (!files.exists(base_path + key)) {
                    complete = false;
                    break;
                }
            }
        }
        if (complete) {
            engines.execScriptFile(base_path + "main.js", {path: base_path});
            engines.myEngine().forceStop();
        } else {
            downloadFile();
        }
    }
    init();
    
    ui.emitter.on("back_pressed", () => {
        keep = false;
    });

    ui.try_download.on("click", () => {
        downloadFile();
    });

    function downloadFile() {
        ui.download_message.setText("等待脚本下载完成");
        http.get(base_url + "config/files_md5.json", {}, (res, err) => {
            try {
                if (err || res["statusCode"] != 200) {
                    ui.run(function () {
                        ui.try_download.setEnabled(true);
                        if (err) {
                            ui.download_message.setText(err["message"]);
                        } else {
                            ui.download_message.setText(res["statusCode"] + " " + res["statusMessage"]);
                        }
                    });
                } else {
                    let files_md5 = res.body.json();
                    let max_progress = 0, current_progress = 0;
                    for (let key in files_md5) {
                        max_progress += files_md5[key]["size"];
                    }
                    for (let key in files_md5) {
                        let response = http.get(base_url + key);
                        if (response && response["statusCode"] == 200) {
                            current_progress += files_md5[key]["size"];
                            ui.run(function () {
                                ui.progressbar.setProgress(current_progress * 100 / max_progress);
                            });
                            files.ensureDir(base_path + key);
                            files.write(base_path + key, response.body.string());
                        } else {
                            throw new Error("下载失败");
                        }
                    }
                    ui.run(function () {
                        ui.download_message.setText("下载完成");
                    });
                    if (keep) {
                        engines.execScriptFile(base_path + "main.js", {path: base_path});
                    }
                    engines.myEngine().forceStop();
                }
            } catch (e) {
                ui.run(function () {
                    ui.download_message.setText(e["message"]);
                    ui.try_download.setEnabled(true);
                });
            }
        });
    }
})();