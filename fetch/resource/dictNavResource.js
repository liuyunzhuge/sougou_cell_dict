let request = require('request');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');
let util = require("../../util");
let config = require("../../config");
let DictCateResource = require("./dictCateResource");

class DictNavResource {
    constructor(model, cellDictResource) {
        this._model = model;
        this._children = [];
        this._cellDictResource = cellDictResource;
    }

    get cellDictResource() {
        return this._cellDictResource;
    }

    get model() {
        return this._model;
    }

    set model(model) {
        this._model = model;
    }

    get children() {
        return this._children;
    }

    addChild(child) {
        this._children.push(child);
        return child;
    }

    get path() {
        return this.model.name;
    }

    incrementDictTotal(count) {
        this.model.dictTotal += count;
    }

    async load() {
        let cateList = await this.loadDictCate();

        let cateResources = cateList.map(cateModel => {
            let resource = new DictCateResource(cateModel, this, this.cellDictResource);
            this.addChild(resource);

            cateModel.children && cateModel.children.forEach(childModel => {
                resource.addChild(new DictCateResource(childModel, resource, this.cellDictResource));
            });

            return resource;
        });

        for (let cateResource of cateResources) {
            await cateResource.load();
        }
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

                $("#dict_cate_show > table > tbody > tr > td").each((index, element) => {
                    let $td = $(element);
                    let $div = $td.find('>div').eq(0);

                    let $cateA = $div.find('a');
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

                    if ($div.hasClass('cate_has_child')) {
                        cateObj.isLeaf = false;
                        cateObj.children = [];

                        $td.find('.cate_children_show a').each((index, element) => {
                            var $element = $(element);
                            let cateDictUrl = $element.attr('href');
                            cateObj.children.push({
                                id: config.getCateIdFromUrl(cateDictUrl),
                                fullUrl: util.join(config.baseUrl, cateDictUrl),
                                isRoot: false,
                                parentId: cateObj.id,
                                isCate: true,
                                level: 2,
                                dictTotal: 0,
                                isLeaf: true,
                                name: $element.text().split('(')[0]
                            });
                        });
                    }
                });

                resolve(cateList);
                console.log(`dict cate info has loaded, id: ${this.model.id}.`);
            });
        });
    }
}

module.exports = DictNavResource;