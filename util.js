let fs = require("fs");
let path = require("path");

module.exports = {
    join(baseUrl, relativeUrl) {
        return baseUrl.replace(/\/$/g, '') + '/' + relativeUrl.replace(/^\//g, '');
    },
    //递归创建目录 同步方法  
    mkdirsSync: function mkdirsSync(dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }
}