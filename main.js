"ui";
(() => {

    ui.layout(
        <vertical padding="8 8" gravity="center">
            <progressbar id="progressbar" gravity="center" style="@style/Base.Widget.AppCompat.ProgressBar.Horizontal"/>
            <text id="download_message" gravity="center" />
            <button id="try_download" gravity="center" text="重试" style="Widget.AppCompat.Button.Colored"/>
        </vertical>
    );

    let base_path = files.getSdcardPath() + "/Android/data/" + context.getPackageName() + "/CleanUpWeChatZombieFans/";
    let base_url = "https://gitee.com/L8426936/CleanUpWeChatZombieFans/raw/master/";
    // 本地测试使用
    // let base_url = "http://192.168.123.105/auto.js-script/CleanUpWeChatZombieFans/";

    /**
     * 初始化配置
     */
    function init() {
        if (files.exists(base_path + "main.js")) {
            engines.execScriptFile(base_path + "main.js", {path: base_path});
            engines.myEngine().forceStop();
        } else {
            downloadFile();
        }
    }
    init();

    ui.try_download.on("click", () => {
        downloadFile();
    });

    function downloadFile() {
        ui.download_message.setText("等待脚本下载完成");
        ui.try_download.setEnabled(false);
        http.get(base_url + "config/files_md5.json", {}, (res, err) => {
            try {
                if (err || res["statusCode"] != 200) {
                    ui.run(function () {
                        ui.download_message.setText(err["message"] || res["statusCode"] + " " + res["statusMessage"] || "下载失败");
                        ui.try_download.setEnabled(true);
                    });
                } else {
                    let files_md5 = res.body.json();
                    let completed_all_file = true, max_progress = 0, current_progress = 0;
                    for (let key in files_md5) {
                        max_progress += files_md5[key]["size"];
                    }
                    for (let key in files_md5) {
                        let response = http.get(base_url + key);
                        if (response["statusCode"] == 200) {
                            current_progress += files_md5[key]["size"];
                            ui.run(function () {
                                ui.progressbar.setProgress(current_progress * 100 / max_progress);
                            });
                            files.ensureDir(base_path + ".download_files/" + key);
                            files.write(base_path + ".download_files/" + key, response.body.string());
                        } else {
                            completed_all_file = false;
                            break;
                        }
                    }
                    if (completed_all_file) {
                        for (let key in files_md5) {
                            if (!files.copy(base_path + ".download_files/" + key, base_path + key)) {
                                completed_all_file = false;
                                break;
                            }
                        }
                    }
                    files.removeDir(base_path + ".download_files");
                    if (completed_all_file) {
                        ui.run(function () {
                            ui.download_message.setText("下载完成");
                        });
                        engines.execScriptFile(base_path + "main.js", {path: base_path});
                        engines.myEngine().forceStop();
                    } else {
                        ui.run(function () {
                            ui.download_message.setText("下载失败");
                            ui.try_download.setEnabled(true);
                        });
                    }
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