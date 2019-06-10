class ListStorage {
    constructor() {
        this.reset();
    }

    reset() {
        this.storage = {};
    }

    add(id, obj) {
        this.storage[id] = obj;
    }

    set(id, field, value) {
        if (id in this.storage)
            this.storage[id][field] = value;
    }

    get(id, field) {
        return this.storage[id] ? this.storage[id][field] : void 0;
    }

    getData(id) {
        return this.storage[id];
    }

    del(id) {
        delete this.storage[id];
    }

    sync(items) {
        this.reset();
        items.forEach(item => this.add(item.id, item));
    }

    asArray() {
        // this.storage.val
    }
}