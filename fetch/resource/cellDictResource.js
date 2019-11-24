class CellDictResource {
    constructor() {
        this._dataSource = [];
    }

    get dataSource() {
        return this._dataSource;
    }

    addCellDict(cellDict) {
        this._dataSource.push(cellDict);
    }
}

module.exports = CellDictResource;