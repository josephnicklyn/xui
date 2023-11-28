import { resizeObserver } from "../utils.js";
const SPLIT_BAR_SIZE = 2;

function createElement(className, parentNode, innerHTML, type) {
    let elm = document.createElement('div');//(typeof(type)==='string'?type:'div'));
        elm.className = className;
    if (parentNode) {
        parentNode.appendChild(elm);
    }
    if (innerHTML != undefined) {
        
        if (typeof(innerHTML) !== HTMLElement) {
            let t = document.createElement('div');
                t.innerHTML = innerHTML;
                elm.appendChild(t);
        } else {
            if (innerHTML.parentNode) 
                innerHTML.parentNode.removeChild(innerHTML);
            elm.appendChild(innerHTML);
        } 
    }
    return elm;
}

function sumOfStyles(style, items) {
    let v = 0;
    for(let i of items) {
        let s = toFloat(style.getPropertyValue(i));
        v+=s;
    }
    return v;
}

function getAttribute(elm, name, def, updateValue) {
    let attr = elm.getAttribute(name);
    
    if (def instanceof Array) {
        for(let i of def) {
            let v = typeof(i) === 'string'?i.toLowerCase():i;
            if (def == v) {
                attr = v;
            }
        }
        if (def.length > 0) {
            attr = def[0];
        } 
        if (updateValue === true)
            elm.setAttribute(name, attr);
        return attr;
    }
    
    if (!attr) {
        attr = def;
    }
    return attr;
}

function toBoolean(v) {
    return (v === 'true' || v === true)?true:false;
}

function toInteger(v, def) {
    let r = typeof(def) === 'number'?def:0;
    try {
        let q = parseInt(v);
        if (!isNaN(q)) r = q;
    } catch(e) {}
    return r;
}

function toFloat(v, def) {
    let r = typeof(def) === 'number'?def:0;
    try {
        let q = parseFloat(v);
        if (!isNaN(q)) r = q;
    } catch(e) {}
    return r;
}

export default class UXSplitPane extends HTMLElement {
     constructor() {
        super();
        this.classList.add('ux-splitpane');
        this.isVertical = toBoolean(this.getAttribute('orientation')=='vertical');
        this.size = toFloat(this.getAttribute('size'), 0.25);
        this.relativeToEnd = (this.size < 0)?true:false;
        this.isFractional = ((this.size >= -0.98 && this.size < 0) 
                            || (this.size > 0 && this.size <= 0.98))?true:false;
        this.isSizeable = this.getAttribute('sizeable')!=undefined?toBoolean(this.getAttribute('sizeable')):true;
        this.sides = [];
        this.minMax = {minA:null, minB:null, maxA:null, maxB: null};
        
        this.splitterBar = createElement('splitter-bar');
        this.dragBinder = this.onMouseDrag.bind(this);
        
        this.splitterBar.classList.add((this.isVertical?'vertical':'horizontal'));
        this.hideLeft = null;
       
        if (this.isSizeable) {
            this.splitterBar.addEventListener('mousedown', this.onMouseDown.bind(this));
            this.splitterBar.addEventListener('touchstart', this.onMouseDown.bind(this));
            this.splitterBar.style.cursor = this.isVertical?'ns-resize':'ew-resize';
        }
        this.dragHints = {};
        resizeObserver.observe(this);
     }

     onResize(contentRect) { 
        this.setBar(this.size);
    }

    getSide() {
        switch (this.hideLeft) {
            case true:
                return 'left';
            case false:
                return 'right';
            default:
                return 'all';
        }
    }
    hideSide(side) {
        if (side === 'left') {
            this.splitterBar.style.display = 'none';
            this.sides[0].elm.style.display = 'none';
            this.sides[1].elm.style.display = '';
            this.hideLeft = true;
        } else if (side === 'right') {
            this.splitterBar.style.display = 'none';
            this.sides[0].elm.style.display = '';
            this.sides[1].elm.style.display = 'none';
            this.hideLeft = false;
        } else {
            this.splitterBar.style.display = '';
            this.sides[0].elm.style.display = '';
            this.sides[1].elm.style.display = '';
            this.hideLeft = null;
        }
        this.setBar(this.size);
        return this.getSide();
    }

    connectedCallback() {
        let rem = [];
        for(let nd of this.childNodes) {
            console.log(nd.tagName);
           if (nd instanceof HTMLElement || nd.tagName == 'J-TABVIEW' || nd.tagName == 'J-ZONEVIEW') {
                if (this.sides.length < 2) {
                    let style = window.getComputedStyle(nd);
                    let xs = sumOfStyles(style, ['margin-left', 'margin-right', 'padding-right', 'padding-left', 'border-left-width', 'border-right-width']);
                    let ys = sumOfStyles(style, ['margin-top', 'margin-bottom', 'padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']);

                    this.sides.push({elm:nd, xs:xs, ys:ys});
                    let min = getAttribute(nd, 'min', null);
                    let max = getAttribute(nd, 'max', null);
                    if (min != null) min = toInteger(min);
                    if (max != null) max = toInteger(max);
                    if (min != null && max != null) {
                        if (min > max) {
                            let t = min;
                            min = max;
                            max = t;
                        }
                    }
                    if (this.sides.length == 1) {
                        this.minMax.minA = min;
                        this.minMax.maxA = max;
                    } else {
                        this.minMax.minB = min;
                        this.minMax.maxB = max;
                    }
                } else
                    rem.push(nd);
           }
        }
        
        for(let nd of rem) {
            this.removeChild(nd);
        }
        rem = [];

        if (this.sides.length != 2) {
            throw('There must be 2 and only 2 Child HTMLElements for Split Panes');
        }

        this.appendChild(this.splitterBar);
        this.setBar(this.size);
    }

    onMouseDrag(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (e.type == 'mouseup') {
            window.removeEventListener('mousemove', this.dragBinder);
            window.removeEventListener('mouseup', this.dragBinder);
        } else if (e.type === 'mousemove'){
            let r = this.getBoundingClientRect();
            let x = (e.x) - r.left-this.dragHints.x;
            let y = (e.y) - r.top-this.dragHints.y;
            this.moveBar(x, y);
        } else if (e.type === 'touchend') {
            window.removeEventListener('touchmove', this.dragBinder);
            window.removeEventListener('touchend', this.dragBinder);
        } else if (e.type === 'touchmove') {
            let r = this.getBoundingClientRect();
            let x = (e.changedTouches[0].pageX) - r.left-this.dragHints.x;
            let y = (e.changedTouches[0].pageY) - r.top-this.dragHints.y;
            this.moveBar(x, y);
        }
    }

    onMouseDown(e) {
        if (e.type === 'touchstart') {
            window.addEventListener('touchmove', this.dragBinder);
            window.addEventListener('touchend', this.dragBinder);
            let r = this.splitterBar.getBoundingClientRect();
            this.dragHints.x = e.changedTouches[0].pageX-r.left;
            this.dragHints.y = e.changedTouches[0].pageY-r.top;
        } else if (e.which === 1) {
            let r = this.splitterBar.getBoundingClientRect();
            this.dragHints.x = e.x-r.left;
            this.dragHints.y = e.y-r.top;
            window.addEventListener('mousemove', this.dragBinder);
            window.addEventListener('mouseup', this.dragBinder);
        }    
    }

    moveBar(x, y, set) {
        if (this.wait === true) return;
        this.wait = true;
        if (this.isVertical === true) {
            if (y < 0) y = 0;
            if (y > this.offsetHeight) y = this.offsetHeight;
            x = 0;
        } else {
            if (x < 0) x = 0;
            if (x > this.offsetWidth) x = this.offsetWidth;
            y = 0;
        }
        
            let s0 = this.isVertical?y:x;
            let s1 = this.isVertical?(this.offsetHeight-y):(this.offsetWidth-x);

            let rSize = this.relativeToEnd?s1:s0;
            let rEdge = (this.isVertical?this.offsetHeight:this.offsetWidth);
            let vert = this.isVertical?y:x;
            let size = 0;
            if (this.isFractional) {
                size = rSize/rEdge;
                if (this.relativeToEnd)
                    size *= -1;
            } else {
                if (this.relativeToEnd)
                    size = rEdge-vert;   
                else 
                    size = rSize;
            }
            this.size = size;
            this.setBar(size);
            this.wait = false;
    }
    setBar(size) {
        
        if (this.hideLeft == true) {
            this.sides[1].elm.style.left = '';
            this.sides[1].elm.style.top = '';
            this.sides[1].elm.style.width = '100%';
            this.sides[1].style.height = '100%';   
        } else if (this.hideLeft == false) {
            this.sides[0].elm.style.left = '';
            this.sides[0].elm.style.top = '';
            this.sides[0].elm.style.width = '100%';
            this.sides[0].elm.style.height = '100%';   
        } else {
           
            let l = '0';
            let t = '0';
           
            let w = SPLIT_BAR_SIZE;
            let h = SPLIT_BAR_SIZE;

            let tw = this.offsetWidth;
            let th = this.offsetHeight;

            let ts = (this.isVertical?th:tw);
            size = Math.abs(size);

            if (this.isFractional) {
                if (this.relativeToEnd === true) {
                    if (this.isVertical) {
                        t = (1.0-size)*100 + '%';
                    } else {
                        l = (1.0-size)*100 + '%';
                    }
                } else {
                    if (this.isVertical) {
                        t = size*100 + '%';
                    } else {
                        l = size*100 + '%';
                    }
                }
            } else {
                if (this.relativeToEnd === true) {
                    if (this.isVertical) {
                        t = th - size;
                    } else {
                        l = tw - size;
                    }
                } else {
                    if (this.isVertical) {
                        t = size;
                    } else {
                        l = size;
                    }
                }
                t=t+'px';
                l=l+'px';
            }
            if (this.isVertical === false) {
                h = th;
                w*=2;
            } else {
                w = tw;
                h*=2;
            }
            
            this.splitterBar.style.left = l;
            this.splitterBar.style.top = t;
            this.splitterBar.style.width = w  + 'px';
            this.splitterBar.style.height = h  + 'px';

            let rect = this.splitterBar.getBoundingClientRect();
            let tRect = this.getBoundingClientRect();
            
            /*
            *  MIN/MAX Constraints: provides a way to restrict sizing of either side
            *      When both sides constraint with a [min and max] value, the first min/max's 
            *      will be overridden by the second.
            * 
            *      For best results, set min and/or max on only 1 side
            */

            let sa = (this.isVertical?rect.y-tRect.y:rect.x-tRect.x);
            let sb = (this.isVertical?tRect.bottom - rect.bottom:tRect.right - rect.right);
            if (this.minMax.minA !== null && sa < this.minMax.minA)
                this.splitterBar.style[this.isVertical?'top':'left'] = this.minMax.minA - SPLIT_BAR_SIZE + 'px';
            if (this.minMax.maxA !== null && sa > this.minMax.maxA)
                this.splitterBar.style[this.isVertical?'top':'left'] = this.minMax.maxA - SPLIT_BAR_SIZE + 'px';
            
            if (this.minMax.minB !== null && sb < this.minMax.minB) 
                this.splitterBar.style[this.isVertical?'top':'left'] = tRect.height - (this.minMax.minB + SPLIT_BAR_SIZE*2) + 'px';
            if (this.minMax.maxB !== null && sb > this.minMax.maxB)
                this.splitterBar.style[this.isVertical?'top':'left'] = tRect.height - (this.minMax.maxB + SPLIT_BAR_SIZE*2) + 'px';

            rect = this.splitterBar.getBoundingClientRect();

            tw=tRect.width-(SPLIT_BAR_SIZE*2);
            th=tRect.height-(SPLIT_BAR_SIZE*2);

            if ((rect.x-tRect.x) > tw) 
                this.splitterBar.style.left = tw + 'px';

            if ((rect.x-tRect.x) < 0)
                this.splitterBar.style.left = 0 + 'px';

            if ((rect.y-tRect.y) > th)
                this.splitterBar.style.top = th + 'px';
        
            if (rect.y < 0) 
                this.splitterBar.style.top = 0 + 'px';

            rect = this.splitterBar.getBoundingClientRect();
            this.sides[0].elm.style.left = 0 + 'px';
            this.sides[0].elm.style.top = 0 + 'px';
            this.sides[1].elm.style.right = 0 + 'px';
            this.sides[1].elm.style.bottom = 0 + 'px';

            
            if (this.isVertical) {
                this.sides[0].elm.style.width = (tRect.width) - this.sides[0].xs + 'px';
                this.sides[0].elm.style.height = (rect.y - tRect.y) - this.sides[0].ys + 'px';
                this.sides[1].elm.style.width = (tRect.width) - this.sides[1].xs + 'px';
                this.sides[1].elm.style.height = (tRect.bottom - rect.bottom) - this.sides[1].ys + 'px';
            } else {
                this.sides[0].elm.style.width = (rect.x - tRect.x) - this.sides[0].xs + 'px';
                this.sides[0].elm.style.height = (tRect.height) - this.sides[0].ys + 'px';
                this.sides[1].elm.style.width = (tRect.right - rect.right) - this.sides[1].xs + 'px';
                this.sides[1].elm.style.height = (tRect.height) - this.sides[1].ys + 'px'; 
            }
        }    
    }
 }

 customElements.define('ux-splitpane', UXSplitPane);