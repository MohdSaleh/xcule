"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.RouteNode = void 0;
const commons_1 = require("@feathersjs/commons");
class RouteNode {
    constructor(name, depth) {
        this.name = name;
        this.depth = depth;
        this.children = {};
        this.placeholders = [];
    }
    get hasChildren() {
        return Object.keys(this.children).length !== 0 || this.placeholders.length !== 0;
    }
    insert(path, data) {
        if (this.depth === path.length) {
            if (this.data !== undefined) {
                throw new Error(`Path ${path.join('/')} already exists`);
            }
            this.data = data;
            return this;
        }
        const current = path[this.depth];
        const nextDepth = this.depth + 1;
        if (current.startsWith(':')) {
            // Insert a placeholder node like /messages/:id
            const placeholderName = current.substring(1);
            let placeholder = this.placeholders.find((p) => p.name === placeholderName);
            if (!placeholder) {
                placeholder = new RouteNode(placeholderName, nextDepth);
                this.placeholders.push(placeholder);
            }
            return placeholder.insert(path, data);
        }
        const child = this.children[current] || new RouteNode(current, nextDepth);
        this.children[current] = child;
        return child.insert(path, data);
    }
    remove(path) {
        if (path.length === this.depth) {
            return;
        }
        const current = path[this.depth];
        if (current.startsWith(':')) {
            const placeholderName = current.substring(1);
            const placeholder = this.placeholders.find((p) => p.name === placeholderName);
            placeholder.remove(path);
            this.placeholders = this.placeholders.filter((p) => p !== placeholder);
        }
        else if (this.children[current]) {
            const child = this.children[current];
            child.remove(path);
            if (!child.hasChildren) {
                delete this.children[current];
            }
        }
    }
    lookup(path, info) {
        if (path.length === this.depth) {
            return this.data === undefined
                ? null
                : {
                    ...info,
                    data: this.data
                };
        }
        const current = path[this.depth];
        const child = this.children[current];
        if (child) {
            const lookup = child.lookup(path, info);
            if (lookup !== null) {
                return lookup;
            }
        }
        // This will return the first placeholder that matches early
        for (const placeholder of this.placeholders) {
            const result = placeholder.lookup(path, info);
            if (result !== null) {
                result.params[placeholder.name] = current;
                return result;
            }
        }
        return null;
    }
}
exports.RouteNode = RouteNode;
class Router {
    constructor(root = new RouteNode('', 0)) {
        this.root = root;
    }
    getPath(path) {
        return (0, commons_1.stripSlashes)(path).split('/');
    }
    insert(path, data) {
        return this.root.insert(this.getPath(path), data);
    }
    remove(path) {
        return this.root.remove(this.getPath(path));
    }
    lookup(path) {
        if (typeof path !== 'string') {
            return null;
        }
        return this.root.lookup(this.getPath(path), { params: {} });
    }
}
exports.Router = Router;
//# sourceMappingURL=router.js.map