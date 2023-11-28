import { createElement, resizeObserver, log } from "../utils.js";
import JView from "./view.js";
const GAP_SIZE = 2;
const ON_EDGE_THRESHOLD = 6;

class Regions {
    constructor(parentRegion, name) {
        this.parentRegion = parentRegion instanceof Regions?parentRegion:null;
        this.left = 0;
        this.top = 0;
        this.width = 1;
        this.height = 1;
        this.rect = {};
        this.vertical = true;
        this.sideA = null;
        this.sideB = null;
        this.elm = createElement('div', 'region');
            this.elm.owner = this;
        this.name = ('string' == typeof(name)?name:'root');
        this.elm.setAttribute('title', this.name);
    }

    split(vert) {
        this.sideA = new Regions(this, this.name + ":A");
        this.sideB = new Regions(this, this.name + ":B");

        if (vert) {
            this.sideA.width = 0.5;
            this.sideB.width = 0.5;
            this.sideB.left = 0.5;  //this.width/2;
            
        } else {
            this.sideA.height = 0.5;
            this.sideB.height = 0.5;
            this.sideB.top = 0.5;   //this.height/2;
        }
        this.vertical = vert;

        if (this.elm) 
            this.elm.remove();
        this.elm = null;
        return this;
    }

    
    layoutElements(parentNode, x, y, width, height) {
        let cx = x + this.left * width;
        let cy = y + this.top * height;

        let cw = this.width * width;
        let ch = this.height * height;
        
        this.rect = {left:cx, top:cy, width:cw, height:ch, right:(cx+cw), bottom:(cy+ch)};

        if (this.elm) {
            if (parentNode instanceof HTMLElement) {
                if (this.elm.parentNode != parentNode) {
                    parentNode.appendChild(this.elm);
                }
            }

            if (cw <= 1 || ch <= 1) {
                this.elm.style.display='none';
            } else {
                this.elm.style.display=null;
            }
            this.elm.style.left = cx+4 + 'px';
            this.elm.style.top = cy+4 + 'px';
            this.elm.style.width = cw-8 + 'px';
            this.elm.style.height = ch-8 + 'px';


            if (this.vertical) {
                cx+=cw;
            } else {
                cy+=ch;
            }
        }
        
            
        if (this.sideA)
            this.sideA.layoutElements(parentNode, cx, cy, cw, ch);
        if (this.sideB)
            this.sideB.layoutElements(parentNode, cx, cy, cw, ch);
    }

    get right() {
        return this.left + this.width;
    }

    get bottom() {
        return this.top + this.height;
    }

    pointInRegion(x, y) {
        return x>=this.rect.left && x<=this.rect.right && y>=this.rect.top && y<=this.rect.bottom;
    }

    getInRegion(x, y) {
        if (this.sideA && this.sideA.pointInRegion(x, y)) 
            return this.sideA.getInRegion(x, y);
        else if (this.sideB && this.sideB.pointInRegion(x, y)) 
            return this.sideB.getInRegion(x, y);
        return this;
    }

    getCenter() {
        if (this.sideA) {
            let rect = this.sideA.rect;
            return !this.vertical?rect.bottom:rect.right;
        } else {
            return -1;
        }
    }

    getPosition(x, y) {
        let p = this.vertical?x - this.rect.left:y - this.rect.top;
        let v0 = this.vertical?this.rect.left:this.rect.top;
        let v1 = this.vertical?this.rect.right:this.rect.bottom;
        let s = v1-v0;
        let r0 = p/s;
        if (r0 < 0) r0 = 0;
        if (r0 > 1) r0 = 1;
        let r1 = 1 - r0;
        console.log( r0, r1, p, v0, v1);
        if (this.vertical) {
            this.sideA.width = r0;
            this.sideB.width = r1;
            this.sideB.left = r0;
        } else {
            this.sideA.height = r0;
            this.sideB.height = r1;
            this.sideB.top = r0;
        }
        return true;
    }


    getOnEdge(x, y) {
        
        let p = this.vertical?x:y;
        let v0 = this.getCenter()-4;
        let v1 = v0 + 8;
        
        if (p >= v0 && p <= v1 && this.pointInRegion(x, y)) {
            return this;
        } else {
            
            if (this.sideA) {
                let r = this.sideA.getOnEdge(x, y);
                if (r) return r;    
            } 
            if (this.sideB) {
                let r = this.sideB.getOnEdge(x, y);
                if (r) return r;    
            }
        }
        return null;
    }
    
}

class JDockView extends JView {
    constructor() {
        super();
        this.region = new Regions();
        this.region.split(true);
        this.region.sideB.split(false);
        this.region.sideA.split(true);
        this.test = this.region.sideA.sideB.split(false);
        this.region.sideB.sideA.split(false);
        this.region.sideB.sideB.split(true);
        resizeObserver.observe(this);

        this.onmousedown = this.onMouseDown.bind(this);
        this.onmousemove = this.onMouseMove.bind(this);

        this.onMouseDragBinder = this.onMouseDrag.bind(this);
        this.grabbed = null;
    }

    onMouseDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type == 'mouseup' || e.buttons == 0) {
            window.removeEventListener('mousemove', this.onMouseDragBinder);
            window.removeEventListener('mouseup', this.onMouseDragBinder);
            this.grabbed = null;
        } else {
            let rect = this.getBoundingClientRect();
            let x = e.x - rect.x;
            let y = e.y - rect.y;
            log(x + " : " + y);
            this.grabbed.getPosition(x, y);
            this.region.layoutElements(this, 0, 0, rect.width, rect.height);

        }
    }

    onMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.buttons == 1) {        
            let rect = this.getBoundingClientRect();
            let result = this.region.getOnEdge (
                e.x - rect.x, 
                e.y - rect.y
            );

            if (result) {
                window.addEventListener('mousemove', this.onMouseDragBinder);
                window.addEventListener('mouseup', this.onMouseDragBinder);
                this.grabbed = result;
            }
        }
    }

    onMouseMove(e) {
        // e.preventDefault();
        // e.stopPropagation();
        if (e.buttons == 0 && !this.grabbed) {
            let rect = this.getBoundingClientRect();
            let result = this.region.getOnEdge (
                e.x - rect.x, 
                e.y - rect.y
            );

            if (result instanceof Regions) {
                this.style.cursor =  (result.vertical)?'ew-resize':'ns-resize';
                result = result.name;
            } else {
                this.style.cursor = null;
                result = 'none';
            }
            log(result);
        }
    }

    onResize(rect) {
        this.region.layoutElements(this, 0, 0, rect.width, rect.height);
    }
}

customElements.define("j-dockview", JDockView);

export default JDockView;