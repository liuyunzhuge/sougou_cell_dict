let request = require('request');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');
let config = require("../../config");

class DictCateResource {
    constructor(model, parent, cellDictResource) {
        this._model = model;
        this._children = [];
        this._parent = parent;
        this._cellDictResource = cellDictResource;
    }

    get model() {
        return this._model;
    }

    get cellDictResource() {
        return this._cellDictResource;
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

    get parent() {
        return this._parent;
    }

    set parent(parent) {
        this._parent = parent;
    }

    get path() {
        return this._parent.path + '/' + this.model.name;
    }

    incrementDictTotal(count) {
        this.model.dictTotal += count;
        this.parent.incrementDictTotal(count);
    }

    async load() {

        if (this.model.isLeaf === false) {
            for (let child of this.children) {
                await child.load();
            }
        } else {
            await this.loadPage(1);
            console.log(`finish loading cell dicts of ${this.path}`)
        }
    }

    loadPage(page) {
        return new Promise((resolve, reject) => {
            request.get({ url: config.buildPageUrl(this.model.fullUrl, page), encoding: null }, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                let buf = iconv.decode(body, 'utf-8');
                let $ = cheerio.load(buf);

                //判断有无分页
                let $page_list = $("#dict_page_list");
                let has_page_list = $page_list.length > 0;
                let is_last_page = has_page_list && $page_list.find('li').last().text() != '下一页';
                let last_page = page;
                if (has_page_list && !is_last_page) {
                    last_page = parseInt($page_list.find('li').last().prev().text());
                }

                $("#dict_detail_list .dict_dl_btn a").each((index, element) => {
                    let $downloadA = $(element);
                    let downloadUrl = $downloadA.attr('href');
                    let name = new URL(downloadUrl).searchParams.get("name") + '.scel';


                    this.incrementDictTotal(1);

                    // if (!this.model.cell_dicts) {
                    //     this.model.cell_dicts = [];
                    // }

                    // this.model.cell_dicts.push({
                    //     name,
                    //     downloadUrl,
                    //     path: `${this.path}/${name}`
                    // });

                    this.cellDictResource.addCellDict({
                        name,
                        downloadUrl,
                        path: `${this.path}/${name}`
                    });
                });

                console.log(`finish loading cell dicts of ${this.path}, page(${page}/${last_page})`)

                //如果有分页并且不是最后一页，则请求下一页
                if (has_page_list && !is_last_page) {
                    resolve(this.loadPage(page + 1));
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = DictCateResource;