module.exports = {
    baseUrl: 'https://pinyin.sogou.com/',
    fetch_dict_nav_url: '/dict/cate/index/167',
    getCateIdFromUrl(url) {
        let m = url.match(/([0-9]+)$/g);
        return parseInt(m[0]);
    },
    isCityNav(id) {
        return id == 167;
    },
    buildPageUrl(cateUrl, page) {
        return `${cateUrl}/defaut/${page}`;
    }
};
