import { createElement, getParentInstanceOf } from "../utils.js";
import JView from "./view.js";
import JTab from "./tab.js";

let TAB_BEING_DRAGGED = null;
let TAB_BEING_DRAGGED_OWNER_NAME = '';

class JTabView extends JView {
    static get observedAttributes() { return ['name'];}
    constructor() {
        super();
        this.tabBar = super.appendChild(createElement('div', 'tab-bar'));
        this.contentContainer = super.appendChild(createElement('div', 'tabview-content-container'));
        this.tabBar.onclick = this.onTabBarClicked.bind(this);
        this.onDefaultContent = null;
        this.currentTab = null;
        this.redirect = {};
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'name':
                this.ondrop = this.drop.bind(this);
                this.ondragover = this.allowDrop.bind(this);
                break;
        }
    }

    updateName() {
        if (this.getAttribute('name') != null) {
            this.ondrop = this.drop.bind(this);
            this.ondragover = this.allowDrop.bind(this);
        }
    }

    connectedCallback() {
        customElements.whenDefined('j-tab').then(() => {
            for(let i = this.children.length-1; i >= 0; i--) {
                let child = this.children[i];
                if (child == this.tabBar || child == this.contentContainer) 
                    continue;
                if (!(child instanceof JTab)) {
                    if (child instanceof HTMLDivElement && this.onDefaultContent == null) {
                        this.contentContainer.insertBefore(child, this.contentContainer.firstChild);
                        this.onDefaultContent = child;
                        this.onDefaultContent.classList.add('tabview-default');
                    } else {
                        child.remove();
                    }
                } else {
                   this.addTab(child);
                }
            }
            if (!this.onDefaultContent)
                this.selectTab(this.currentTab);
            else 
                this.showDefault();
        });
        this.showDefault();
    }

    closeTab(tab) {
        if (tab instanceof JTab && tab.parentNode == this.tabBar) {
            let doClose = confirm("Close tab [" + tab.text + "]?");
            if (doClose) {
                let next = tab.nextSibling;
                if (!next) next = tab.previousSibling;
                tab.getContent().remove();
                tab.remove();
                this.selectTab(next);
            }
            this.dispatchTabChanged();
        }
        this.showDefault();
    }

    dropOnSide(side, elm) {
        this.redirect[side] = elm;
    }

    dispatchTabChanged() {
        let event = new CustomEvent("tabschanged", {
            detail: {
              tabcount: this.tabBar.children.length
            }
          });

          this.dispatchEvent(event);
    }

    addTab(tab, before=true) {
        if (!(tab instanceof JTab)) 
            throw new Error("tab must be of type JTab.");
        tab.remove();
        this.contentContainer.appendChild(tab.getContent());
        if (before==true)
            this.tabBar.insertBefore(tab, this.tabBar.firstChild);
        else 
            this.tabBar.appendChild(tab);
        if (this.getAttribute('name') != null) {
            tab.setAttribute("draggable","true");  
            tab.ondragstart = function(ev) {
                TAB_BEING_DRAGGED_OWNER_NAME = this.getAttribute('name');
                TAB_BEING_DRAGGED = ev.target;
            }.bind(this);
        }

        if (this.currentTab == null || tab.hasAttribute('default')) {
            this.currentTab = tab;
        }
        this.dispatchTabChanged();
    }

    appendChild() { /* nope */ }

    insertBefore() { /* nope */ }

    onTabBarClicked(e) {
        let tab = getParentInstanceOf(e.target, JTab);
        if (tab) {
            this.selectTab(tab);
        }
    }

    selectTab(tab) {
        if (tab instanceof JTab) {
            if (tab == this.currentTab && this.onDefaultContent) {
                tab.toggleActive();
            } else  {
                for(let child of this.tabBar.children) {
                    child.setActive(child == tab);
                }
                this.currentTab = tab;
            }
        }
        this.showDefault();
    }

    hasActiveTab() {
        for(let c of this.tabBar.children) {
            if(c instanceof JTab && c.isActive())
                return true;
        }
        return false;
    }

    showDefault() {
        if (this.onDefaultContent) {
            if (this.tabBar.children.length == 0 || !this.hasActiveTab()) {
                this.onDefaultContent.style.display = 'block';
            } else {
                this.onDefaultContent.style.display = null;
            }
        }
    }
    
    getDropSide(x, y, rect) {

        let targetSide = this;
        if (x > (rect.width-100) && this.redirect['right']) 
            targetSide = this.redirect['right'];
        else if (y > (rect.height-100) && this.redirect['bottom']) 
            targetSide = this.redirect['bottom'];
        else if (x < 100 && this.redirect['left']) 
            targetSide = this.redirect['left'];
        else if (y > 100 && this.redirect['top']) 
            targetSide = this.redirect['top'];
        return targetSide;
    }

    drop(ev) {
        console.log(ev);
        ev.preventDefault();
        ev.stopPropagation();
        if (TAB_BEING_DRAGGED instanceof JTab) {
            var data = TAB_BEING_DRAGGED;
            let p = getParentInstanceOf(data, JTabView);
            
            let rect = this.getBoundingClientRect();
            let tabRect = this.tabBar.getBoundingClientRect()
            let x = ev.x-tabRect.left;
            let y = ev.y-tabRect.top;
            let dropTarget = p==this?this.getDropSide(x, y, rect):this;

            
            let at = null;
            for(let c of dropTarget.tabBar.children) {
                let x0 = c.offsetLeft;
                let x1 = x0 + c.offsetWidth;
                if (x>x0 && x<x1) {
                    at = c;
                }
            }
           
            dropTarget.tabBar.insertBefore(data, at);
            
            dropTarget.contentContainer.appendChild(data.getContent());
            dropTarget.selectTab(data);
            if (p instanceof JTabView)
                p.showDefault();
                dropTarget.showDefault();
            if (p) 
            p.dispatchTabChanged();
            dropTarget.dispatchTabChanged();
        }

        TAB_BEING_DRAGGED = null;
    }

    allowDrop(ev) {
        let p = getParentInstanceOf(ev.target, JTabView);
        let allow = p.getAttribute('name') == TAB_BEING_DRAGGED_OWNER_NAME;
        if (allow)
            ev.preventDefault();
    }

    add(text, div, closeable=true) {
        if (!(div instanceof HTMLDivElement)) {
            console.error("NEED A DIV");
            return;
        }
        let tb = new JTab();
        text = text + '';
        tb.setAttribute('text', text);
        if (closeable == true) {
            tb.setAttribute('closeable', 'true');
        }
        tb.setContent(div);
        this.addTab(tb, false);
    }
}


customElements.define('j-tabview', JTabView);

export default JTabView;