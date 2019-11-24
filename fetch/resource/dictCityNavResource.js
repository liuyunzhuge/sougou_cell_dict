let request = require('request');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');
let util = require("../../util");
let config = require("../../config");
let DictNavResource = require("./dictNavResource");

class DictCityNavResource extends DictNavResource {
    loadCityCate(model) {
        return new Promise((resolve, reject) => {
            request.get({ url: model.fullUrl, encoding: null }, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                let buf = iconv.decode(body, 'utf-8');
                let $ = cheerio.load(buf);

                $("#dict_cate_show > table > tbody > tr > td").each((index, element) => {
                    let $td = $(element);
                    if ($td.find('.city_list').length) return;

                    let $div = $td.find('>div').eq(0);

                    let $cateA = $div.find('a');
                    let cateDictUrl = $cateA.attr('href');
                    if (!model.children) {
                        model.children = [];
                    }
                    model.isLeaf = false;
                    model.children.push({
                        id: config.getCateIdFromUrl(cateDictUrl),
                        fullUrl: util.join(config.baseUrl, cateDictUrl),
                        isRoot: false,
                        parentId: model.id,
                        isCate: true,
                        level: 2,
                        dictTotal: 0,
                        isLeaf: true,
                        name: $cateA.text().split('(')[0]
                    });
                });

                resolve();
            });
        });
    }

    loadDictCate() {
        console.log(`start load dict cate info, id: ${this.model.id}, is_city: ${config.isCityNav(this.model.id)}`);
        return new Promise((resolve, reject) => {
            request.get({ url: this.model.fullUrl, encoding: null }, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                let buf = iconv.decode(body, 'utf-8');
                let $ = cheerio.load(buf);
                let cateList = [];

                $("#dict_cate_show .city_list a").each((index, element) => {
                    let $cateA = $(element);
                    let cateDictUrl = $cateA.attr('href');
                    let cateObj = {
                        id: config.getCateIdFromUrl(cateDictUrl),
                        fullUrl: util.join(config.baseUrl, cateDictUrl),
                        isRoot: false,
                        parentId: this.model.id,
                        isCate: true,
                        level: 1,
                        dictTotal: 0,
                        isLeaf: true,
                        name: $cateA.text().split('(')[0]
                    };
                    if (!this.model.children) {
                        this.model.children = [];
                    }
                    this.model.children.push(cateObj);
                    cateList.push(cateObj);
                });

                Promise.all(cateList.map(model => this.loadCityCate(model))).then(() => {
                    resolve(cateList);
                });
                console.log(`dict cate info has loaded, id: ${this.model.id}.`);
            });
        });
    }
}

module.exports = DictCityNavResource;