// import { createElement, resizeObserver, log, Rectangle } from "../utils.js";
// import JView from "./view.js";
// const GAP_SIZE = 2;
// const ON_EDGE_THRESHOLD = 6;


// class Regions {
//     constructor(vertical, parentRegion) {
//         this.vertical = vertical != false;
//         this.parentRegion = (parentRegion instanceof Regions)?
//             parentRegion:null;
        
//         this.rect = new Rectangle(0, 0, 1, 1);
//         this.subregions = [];
//         this.addSubRegion();
//         this.addSubRegion();
//         this.addSubRegion(); 
//     }

//     addSubRegion() {
//         let len = this.subregions.length + 1;
//         let size = this.getSize()/len;
        
//         let obj = {
//             elm: createElement('div', 'region'),
//             size
//         }

//         for(let subreg of this.subregions) {
//             subreg.size = size;
//         }
//         this.subregions.push(obj);
//     }

//     getSize() {
//         return (this.vertical?this.rect.getWidth():this.rect.getHeight());
//     }

//     layoutRegion(parentNode, r, p, width, height) {
        
//         let cw = width * (this.vertical?r.size:1);
//         let ch = height * (this.vertical?1:r.size);
//         let cx = this.vertical?p*width:0;
//         let cy = this.vertical?0:p*height;
//         let elm = r.elm;
        
//         if (elm.parentNode != parentNode) {
//             parentNode.appendChild(elm);
//         }

//         cx+=4;
//         cy+=4;
//         cw-=8;
//         ch-=8;
        
//         elm.style.left      = cx + 'px';
//         elm.style.top       = cy + 'px';
//         elm.style.width     = cw + 'px';
//         elm.style.height    = ch + 'px';

        

//         console.error(cx, cy, cw, ch);
//         return r.size;
        

//     }

//     layoutElements(parentNode, x, y, width, height) {
//         let s = (this.vertical?width:height);
//         let p = (this.vertical?x:y)*s;
//         console.log(this.subregions);
//         for(let r of this.subregions) {
//             p += this.layoutRegion(parentNode, r, p, width, height);
//         }
//     }
// }

// class JDockView extends JView {
//     constructor() {
//         super();
//        this.region = new Regions();
//        resizeObserver.observe(this);
//     }

//     onResize(rect) {
//         this.region.layoutElements(this, 0, 0, rect.width/2, rect.height);
//     }
// }

// customElements.define("j-dockview", JDockView);

// export default JDockView;