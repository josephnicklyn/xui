import { createElement, resizeObserver, log, Rectangle, getParentInstanceOf } from "../utils.js";
import JView from "./view.js";
import JContextMenu from "./contextmenu.js";
import JTabView from "./tabview.js"
const GAP_SIZE = 3;

const ZMENU = (new JContextMenu())
    .addMenuItem("bias - beside", 'zmenu-bias-beside')
    .addMenuItem("bias - below", 'zmenu-bias-below')
    .addMenuItem("-")
    .addMenuItem("restore", 'zmenu-restore', 'overlap')
    .addMenuItem("maximize", 'zmenu-maximize', 'maximize');
    
class Zones extends EventTarget  {

    #prefSizes  = {width: 1, height: 1};
    #savedSizes = {width: 2/3, height: 4/5};
    #regions    = {};
    #bias       = 'BESIDE'//'BELOW';

    constructor() {
        super();
        this.#regions = {
            primary:{
                elm: new JTabView(),   
                rect: new Rectangle(0, 0, this.#prefSizes.width, this.#prefSizes.height)
            },
            beside:{elm:new JTabView(), rect: new Rectangle()},
            below:{elm:new JTabView(), rect: new Rectangle()}
        }
        
        this.adjustSecondaries();
    }

    setTabView(tabView) {
        if (tabView instanceof JTabView && this.#regions.primary.elm != tabView) {
            if (this.#regions.primary.elm)
                this.#regions.primary.elm.remove();
            tabView.remove();
            this.#regions.primary.elm = tabView;
            this.#regions.beside.elm.setAttribute('name', tabView.getAttribute('name'));
            this.#regions.below.elm.setAttribute('name', tabView.getAttribute('name'));

            this.#regions.beside.elm.addEventListener("tabschanged", this.tabsMoved.bind(this));
            this.#regions.below.elm.addEventListener("tabschanged", this.tabsMoved.bind(this));

            tabView.dropOnSide("right", this.#regions.beside.elm);
            tabView.dropOnSide("bottom", this.#regions.below.elm);
        }
    }

    tabsMoved(e) {
        if (e.target == this.#regions.beside.elm)
            e.detail.tabcount == 0?this.hideBeside():this.showBeside();
        else if (e.target == this.#regions.below.elm)
            e.detail.tabcount == 0?this.hideBelow():this.showBelow();
        this.dispatchUpdate();
        
    }

    dispatchUpdate() {
        let event = new CustomEvent("requestupdate", {
            detail: {
              
            }
          });

          this.dispatchEvent(event);
    }

    getOverEdge(x, y, width, height) {

        let px = this.#regions.primary.rect.getWidth() * width;
        let py = this.#regions.primary.rect.getHeight() * height;

        let xe = this.#regions.below.rect.getWidth() * width;
        let ye = this.#regions.beside.rect.getHeight() * height;

        let overEdge = 0;
        if (x >= (px-4) && x <=(px+4) && y >= 0 && y <= ye ) {
            overEdge |= 1;
        } 
        
        if (y >= (py-4) && y <=(py+4) && x >= 0 && x <= xe) {
            overEdge |= 2;
        }

        return overEdge;
    }

    adjustRegions(edge, x, y, width, height) {
        let rx = x/width;
        let ry = y/height;

        if (rx < 0) rx = 0;
        if (ry < 0) ry = 0;
        if (rx > 1) rx = 1;
        if (ry > 1) ry = 1;

        if ((edge & 1)!=0) this.#regions.primary.rect.setWidth(rx);
        if ((edge & 2)!=0) this.#regions.primary.rect.setHeight(ry);
        this.adjustSecondaries();

        this.#savedSizes.height = this.#regions.primary.rect.getHeight();
        this.#savedSizes.width  = this.#regions.primary.rect.getWidth();
    }

    setBias(bias) {
        this.#bias = bias;
        this.adjustSecondaries();
    }

    adjustSecondaries() {
        let fillBeside = this.#bias=='BESIDE';

        let width = this.#regions.primary.rect.getWidth();
        let height = this.#regions.primary.rect.getHeight();

        if (fillBeside == true) {
            this.#regions.beside.rect.setRect(width, 0, 1-width, 1);
            this.#regions.below.rect.setRect(0, height, width, 1-height);
        } else {
            this.#regions.beside.rect.setRect(width, 0, 1-width, height);
            this.#regions.below.rect.setRect(0, height, 1, 1-height);
        }
    }

    showBeside() {
        if (this.#regions.primary.rect.getWidth() == 1) {
            this.#regions.primary.rect.setWidth(this.#savedSizes.width);
            this.adjustSecondaries();
        }
    }

    hideBeside() {
        if (this.#regions.primary.rect.getWidth() != 1) {
            this.#regions.primary.rect.setWidth(1);
            this.adjustSecondaries();
        }
    }

    showBelow() {
        console.log("PH", this.#regions.below.rect.getHeight(), this.#savedSizes.height )
        if (this.#regions.primary.rect.getHeight() == 1) {
            this.#savedSizes.height = (4/5);
            this.#regions.primary.rect.setHeight(this.#savedSizes.height);
            this.adjustSecondaries();
        }
    }

    hideBelow() {
        if (this.#regions.primary.rect.getHeight() != 1) {
            this.#regions.primary.rect.setHeight(1);
            this.adjustSecondaries();
        }
    }

    resetDefault() {
        this.#regions.primary.rect.setSize(this.#prefSizes.width, this.#prefSizes.height);
        console.log(this.#regions.primary.rect.getRect());
        this.adjustSecondaries();
    }

    resetSaved() {
        this.#regions.primary.rect.setSize(this.#savedSizes.width, this.#savedSizes.height);
        this.adjustSecondaries();
    }

    maximize() {
        this.#regions.primary.rect.setSize(1, 1);
        this.adjustSecondaries();
    }

    setSides(beside, below) {
        if (beside)
            this.showBeside();
        else 
            this.hideBeside();

        if (below)
            this.showBelow();
        else 
            this.hideBelow();
    }

    getBias() {
        return this.#bias;
    }

    updateLayout(node, width, height) {
        for(let key in this.#regions) {
            let rgn = this.#regions[key];
            let rect = rgn.rect;
            let cx = rect.getLeft() * width;
            let cy = rect.getTop() * height;
            let cw = rect.getWidth() * width;
            let ch = rect.getHeight() * height;

            if (cw != 0 && ch != 0) {
                if (rgn.elm.parentNode != node) 
                    node.appendChild(rgn.elm);
                if (rgn == this.#regions.beside) {
                    cx+=GAP_SIZE;
                    cw-=GAP_SIZE;
                } else if (rgn == this.#regions.below) {
                    cy+=GAP_SIZE;
                    ch-=GAP_SIZE;
                } 
                rgn.elm.style.display = null;
                rgn.elm.style.left   = cx + 'px';
                rgn.elm.style.top    = cy + 'px';
                rgn.elm.style.width  = cw + 'px';
                rgn.elm.style.height = ch + 'px';
            } else {
                rgn.elm.style.display = 'none';
            }
        }
    }
}

class JZoneView extends JView {
    constructor() {
        super();
        this.zones = new Zones();

        resizeObserver.observe(this);
    
        this.oncontextmenu = this.onShowContextMenu.bind(this);
        this.onmousemove = this.onMouseMove.bind(this);
        this.onmousedown = this.onMouseDown.bind(this);
        this.rect = this.getBoundingClientRect();
        this.draggingEdge = 0;
        this.zones.addEventListener('requestupdate', this.updateView.bind(this));
        this.onMouseDragBinder = this.onMouseDrag.bind(this);
    }

    connectedCallback() {
        for (let i = this.children.length-1;i>=0;i--) {
            let child = this.children[i];
            if (child instanceof JTabView) {
                this.zones.setTabView(child);
            }
        }
    }

    onMouseDrag(e) {
        
        e.preventDefault();
        e.stopPropagation();

        if (e.type == 'mouseup' || e.buttons == 0) {
            window.removeEventListener('mouseup', this.onMouseDragBinder);
            window.removeEventListener('mousemove', this.onMouseDragBinder);
            this.draggingEdge = 0;
        } else {
            let rect = this.getBoundingClientRect();
            this.zones.adjustRegions(this.draggingEdge, e.x-rect.x, e.y-rect.y, this.rect.width, this.rect.height);
            this.updateView();
        }
    }

    onMouseDown(e) {
        if (e.buttons == 1) {
            e.stopPropagation();

            let rect = this.getBoundingClientRect();
            let overEdge = this.zones.getOverEdge(
                e.x-rect.x,
                e.y-rect.y,
                this.rect.width,
                this.rect.height
            );
            if (overEdge) {
                window.addEventListener('mouseup', this.onMouseDragBinder);
                window.addEventListener('mousemove', this.onMouseDragBinder);
                this.draggingEdge = overEdge;
            }
        }
    }

    onMouseMove(e) {
        if (e.buttons == 0 && this.draggingEdge == 0) {
            e.preventDefault();
            e.stopPropagation();

            let rect = this.getBoundingClientRect();
            let overEdge = this.zones.getOverEdge(
                e.x-rect.x,
                e.y-rect.y,
                this.rect.width,
                this.rect.height
            );
            let cursor = 'default';
            switch(overEdge) {
                case 1:
                    cursor = 'ew-resize';
                    break;
                case 2:
                    cursor = 'ns-resize';
                    break;
                case 3:
                    cursor = 'all-scroll';
                    break;
            }
            this.style.cursor = cursor;
        }
    }

    onShowContextMenu(e) {
        console.log(e);
        if (e.target instanceof HTMLTextAreaElement) {
            return;
        }
        e.preventDefault();
        
        for(let c of ZMENU.children) {
            let name = c.getAttribute('name');
            
            if (name && name.indexOf('bias') != -1) {
                c.checked(name == 'zmenu-bias-' + this.zones.getBias().toLowerCase());
            }
        }

        ZMENU.show(e.x, e.y, function(name) {
            switch(name) {
                case "zmenu-bias-beside": 
                    this.zones.setBias("BESIDE");
                    this.updateView();
                    break;
                case "zmenu-bias-below": 
                    this.zones.setBias("BELOW");
                    this.updateView();
                    break;
                case "zmenu-restore":
                    this.zones.resetSaved();
                    this.updateView();
                    break;
                case "zmenu-maximize":
                    this.zones.maximize();
                    this.updateView();
                    break;
            }
        }.bind(this));
    }

    updateView() {
        this.zones.updateLayout(this, this.rect.width, this.rect.height);
    }

    onResize(rect) {
        this.rect = rect;
        this.updateView();
    }
}

customElements.define("j-zoneview", JZoneView);

export default JZoneView;