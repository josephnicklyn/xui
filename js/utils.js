/**
 * copyObjectWithTemplate: Will copy a (source) object which useses (template). 
 * 
 *  Template defines a set of default values which will:
 *  -> validate types before updating values, 
 *     [note] if types are differnt, the values from (template) will be used.
 * -> (source) arrays will be truncated or replaced with (template's)
 *      if type differs, or length of source's array is lesser than templates
 * 
 * 
 * @param {object} source
 * @param {object} template 
 * @returns object
 */
 function copyObjectWithTemplate(source, template, fromSelf) {
    if (null == source || "object" != typeof source) {
        if (fromSelf)
            return source;
        return copyObjectWithTemplate(template, null, true);
    }
    if (!template) template = source;
    let copy = (template instanceof Array)?[]:{}
    for(let key in template) {
        let temp = template[key];
        let src = source[key];

        if (src == null || src === undefined) {
            copy[key] = temp;
        } else if ((temp.constructor.name) === (src!=null?src.constructor.name:null)) {
                copy[key] = copyObjectWithTemplate(src, temp, true);
        } else {
            copy[key] = copyObjectWithTemplate(temp, null, true);
        }
    }
    return copy;
}
class Rectangle { 
    #rect = {x: 0, y: 0, width: 0, height: 0}

    constructor(x, y, w, h) {
        this.setRect(x, y, w, h);
    }

    setRect(x, y, width, height) {
        if (x instanceof Rectangle) {
            this.setX(x.getX());
            this.setY(x.getY());
            this.setWidth(x.getWidth());
            this.setHeight(x.getHeight());
        } else {
            this.setX(x);
            this.setY(y);
            this.setWidth(width);
            this.setHeight(height);
        }
    }
        
    set(v) {
        this.#rect = UTILS.copyObjectWithTemplate(v, this.#rect);
    }

    getRect() { 
        return this.#rect; 
    }

    setPosition(x, y) {
        this.setX(x);
        this.setY(y);
    }

    updatePosition(x, y) {
        if (x && !isNaN(x)) {
            this.#rect.x+=x;
            this.#rect.width-=(x+x);
        }
        if (y && !isNaN(y)) {
            this.#rect.y+=y;
            this.#rect.height-=(y+y);
        }
    }

    getPosition() { 
        return {
            x:this.#rect.y, 
            y:this.#rect.y
        };
    }

    setSize(width, height) {
        this.setWidth(width);
        this.setHeight(height);
    }

    getSize() { 
        return {
            width:this.getWidth(),
            height:this.getHeight()
        };
    }

    getX() {
        return this.#rect.x;
    }

    setX(v) {
        if (!isNaN(v))
            this.#rect.x = v;
    }

    getY() {
        return this.#rect.y;
    }

    setY(v) {
        if (!isNaN(v))
            this.#rect.y = v;
    }

    getWidth() {
        return this.#rect.width;
    }

    setWidth(v) {
        if (!isNaN(v))
            this.#rect.width = Math.abs(v);
    }

    getHeight() {
        return this.#rect.height;
    }

    setHeight(v) {
        if (!isNaN(v))
            this.#rect.height = Math.abs(v);
    }

    getLeft() {
        return this.getX();
    }

    getTop() {
        return this.getY();
    }

    getRight() { 
        return this.getX() + this.getWidth();
    }

    getBottom() { 
        return this.getY() +this.getHeight();
    }

    pointInRect(x, y) {
        return (
            x >= this.getLeft() &&
            x <= this.getRight() &&
            y >= this.getTop() && 
            y <= this.getBottom());
    }

}

   

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        if(entry.target.onResize instanceof Function) {
            entry.target.onResize(entry.contentRect)
        }
    }
});

function createElement(type, options) {
    let elm = document.createElement(type);
    if ("string" == typeof(options)) {
        elm.className = options;
    } else if (options instanceof Object) {
        for(let key in options) {
            let value = options[key];
            switch (key.toLowerCase()) {
                case 'innerhtml':
                case 'text':
                    elm.innerHTML = value;
                    break;
                case 'classname':
                    elm.className = value;
                    break;
                default:
                    elm.setAttribute(key, value);
                    break;
            }
        }
    }
    return elm;
}

function getParentInstanceOf(elm, inst) {
    let p = elm;
    while(p instanceof HTMLElement) {
        if (p instanceof inst)
            return p;
        p = p.parentNode;
    }
    return null;
}

function toNominal(v) {
    let fractional = false;
    if ("string" == typeof(v)) {
         v = v.replace(/ /g, '');
         fractional = (v.indexOf("%") != -1);
    }

    let size = parseInt(v);
    if (fractional) {
        size = size % 100;
        size = size/100;
    } 

    let farside = size < 0;
    size = Math.abs(size);

    let r = {size, fractional, farside};
    return r;
}

const OUT_T = document.getElementById('out');

function log(...text) {
    
    OUT_T.innerHTML = text.join();
}



export {
    resizeObserver,
    toNominal,
    createElement, 
    getParentInstanceOf,
    log,
    
    Rectangle
}