let request = require('request');
let fs = require('fs');
let path = require('path');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');
let util = require("../util");
let config = require("../config");
let DictNavResource = require("./resource/dictNavResource");
let DictCityNavResource = require("./resource/dictCityNavResource");
let CellDictResource = require("./resource/cellDictResource");

module.exports = {
    loadDictNav() {
        console.log('start load dict nav info...');
        return new Promise((resolve, reject) => {
            request.get({ url: util.join(config.baseUrl, config.fetch_dict_nav_url), encoding: null }, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                let buf = iconv.decode(body, 'utf-8');
                let $ = cheerio.load(buf);
                let navList = [];

                $("#dict_nav_list .nav_list a").each((index, element) => {
                    let dictNavUrl = $(element).attr('href');
                    let id = config.getCateIdFromUrl(dictNavUrl);
                    navList.push({
                        id: config.getCateIdFromUrl(dictNavUrl),
                        fullUrl: util.join(config.baseUrl, dictNavUrl),
                        isRoot: true,
                        parentId: 0,
                        isCate: false,
                        level: 0,
                        dictTotal: 0,
                        isLeaf: false,
                        name: `nav_${id}`//搜狗用的是背景图片，所以无法抓取到文字
                    });
                });

                resolve(navList);
                console.log('dict nav info has loaded.');
            });
        });
    },
    async load() {
        let navList = await this.loadDictNav();
        let cellDictResource = new CellDictResource();

        let navResources = navList.map(nav => {
            if (config.isCityNav(nav.id)) {
                return new DictCityNavResource(nav, cellDictResource);
            }
            return new DictNavResource(nav, cellDictResource);
        });

        for (let navResource of navResources) {
            await navResource.load();
        }

        fs.writeFile(path.join(__dirname, 'dict_nav_cate.json'), JSON.stringify(navList, null, '\t'), function (err) { 
            if (err) {
                return console.error(err);
            }
            console.log("dict nav and cate has been saved.");
        });

        fs.writeFile(path.join(__dirname, 'cell_dict.json'), JSON.stringify(cellDictResource.dataSource, null, '\t'), function (err) { 
            if (err) {
                return console.error(err);
            }
            console.log("cell dict has been saved.");
        });
    }
};