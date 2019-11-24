//文件下载
let fs = require("fs");
let path = require("path");
let request = require("request");
let util = require("./util");
let cellDicts = JSON.parse(fs.readFileSync(path.join(__dirname, './fetch/cell_dict.json'), 'utf-8'));

if (!cellDicts || cellDicts.length == 0) {
    return console.log('please run `node fetch` first.');
}

let total = cellDicts.length;

//创建文件夹目录
let downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

function DownloadQueue(cellDicts, total, errorList, maxDownloadPerQueue) {
    //maxDownloadPerQueue防止调用栈溢出
    
    function _run(times = 1) {
        return new Promise(function (resolve, reject) {
            if (cellDicts.length == 0) return resolve();
            if (times > maxDownloadPerQueue) return resolve();
            let current = cellDicts.shift();
            let index = total - cellDicts.length;

            let fileName = current.path;
            let filePath = path.join(downloadsDir, fileName)
            if (fs.existsSync(filePath)) {
                console.log(`cell dict of[${current.path}] exists, progress: ${index} of ${total}`);
                return resolve(_run(times + 1));
            }

            let pathDir = path.join(downloadsDir, fileName.replace(/\/[^\/]+\.scel$/g, ''));
            if (!fs.existsSync(pathDir)) {
                util.mkdirsSync(pathDir);
            }

            let stream = fs.createWriteStream(filePath);
            try {
                request(current.downloadUrl).pipe(stream).on("close", function (err) {
                    if (err) {
                        errorList.push(current);
                        return resolve(_run(times + 1));
                    }
                    console.log(`cell dict of[${current.path}] downloads success, progress: ${index} of ${total}`);
                    resolve(_run(times + 1));
                });
            } catch (e) {
                console.log('request error', e);
                errorList.push(current);
                return resolve(_run(times + 1));
            }
        });
    }

    return {
        run() {
            function call() {
                return _run().then(() => {
                    if (cellDicts.length) {
                        return call();
                    }
                })
            }

            return call();
        }
    }
}

let i = 3;
let all = [];
let errorList = [];
let maxDownloadPerQueue = 100;
while (i--) {
    let j = i + 1;
    all.push(new DownloadQueue(cellDicts, total, errorList, maxDownloadPerQueue).run());
};

Promise.all(all).then(() => {
    console.log(`downloading finished, error count: ${errorList.length}`);

    if (errorList.length) {
        fs.writeFile(path.join(__dirname, 'download_error_list.json'), JSON.stringify(errorList, null, '\t'), function (err) {
        });
    }
})