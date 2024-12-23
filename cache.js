class Cache {
    constructor(ttl = 300000) { // default TTL:5mins in milliseconds
        this.cache = new Map();
        this.ttl = ttl;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value) {
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });
    }

    has(key) {
        return this.get(key) !== null;
    }
}

module.exports = new Cache();
