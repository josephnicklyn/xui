
class JView extends HTMLElement {

    constructor() {
        super();
        this.props = {};
    }

    setProp(key, value) {
        if ('string' == typeof(key))
            this.props[key] = value;
    }

    getProp(key) {
        return this.props[key];
    }

    hasProp(key) {
        return this.props.containsKey[key];
    }

    getProps() {
        return this.props;
    }

    setProps(obj) {
        if (obj instanceof Object) {
            for(let key in obj) {
                let value = obj[key];
                this.props[key] = value;
            }
        }
        return this;
    }

    setAttribute(name, value) {
        if ('string' == typeof(name))
            super.setAttribute(name, value);
        return this;
    }

    setText(value) {
        if ('string' == typeof(value))
            this.setAttribute('text', value);
        return this;
    }

    getText() {
        return this.getAttribute('text');
    }

    getClassName() {
        let p = this;
        let r = [];
        while(p instanceof JView) {
            p=p.__proto__;
            if(!p) break;
            r.unshift(p.constructor.name);
        }

        return r.join(".");
        
    }

    setName(value) {
        if ('string' == typeof(value))
            this.setAttribute('name', value);
        return this;
    }

    getName() {
        return this.getAttribute('name');
    }

    toString() {
        return {class:this.getClassName()};
    }

    // appendChild(node) {}

    // insertBefore(node, relativeTo) {}

    setStyles(styles) {
        if (styles instanceof Object) {
            for(let key in styles) {
                let value = styles[key];
                if (!isNaN(value) && value != null)
                    value = value + 'px';
                this.style.setProperty(key, value);
            }
        }
    }

    addView(...views) {
        if (Array.isArray(views)) {
            if (Array.isArray(views[0])) {
                views=views[0];
            }
            for(let key in views) {
                let target = views[key];
                if (target instanceof JView)
                    super.appendChild(target);
            }
        }
        return this;
    }



}

customElements.define("j-view", JView);

export default JView;