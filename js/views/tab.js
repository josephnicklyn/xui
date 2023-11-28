import { createElement, getParentInstanceOf } from "../utils.js";
import JTabView from "./tabview.js";
import JView from "./view.js";

class JTab extends JView {
    static get observedAttributes() {
        return ['text', 'closeable'];
    }
    constructor() {
        super();
        this.classList.add("jtab");
        this.tabText = super.appendChild(createElement('div', {class:'tab-text', innerHTML:"Tab"}));
        this.closeButton = super.appendChild(createElement('div', 'tab-close-button'));
            this.closeButton.style.display = 'none';
        this.closeButton.onclick = this.onClose.bind(this);
        this.content = null;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'text':
                this.tabText.innerHTML = newValue;
                break;
            case 'closeable':
                this.closeButton.style.display = (newValue == 'true')?null:'none';
                break;
        }
    }

    get text() {
        return this.tabText.innerHTML;
    }

    connectedCallback() {
        let canidate = null;
        
        for(let i = this.children.length-1; i >= 0; i--) {
            let child = this.children[i];
            if (child == this.tabText 
                || child == this.content
                || child == this.closeButton) continue;
            if (child instanceof HTMLElement) {
                if (!(child instanceof HTMLDivElement)) {
                    let div = document.createElement('div');
                    div.appendChild(child);
                    child = div;
                }
                canidate = child;
            }
            child.remove();
        }
        this.setContent(canidate);
    }

    setContent(node) {
        if (node == null) 
            return;
        if (!(node instanceof HTMLElement)) 
            throw new Error("node must be an HTMLElement");
        if (this.content) {
            this.content.remove();
        }
        
        this.content = node;
        this.content.classList.add('tab-content');
            
        this.content.style.display = 'none';
    }

    get hasContent() {
        return this.content != null;
    }

    isActive() {
        return this.classList.contains('selected')
    }
    
    toggleActive() {
        this.setActive(!this.classList.contains('selected'));
    }

    setActive(b) {
        if (b == true) {
           this.classList.add('selected')
           if (this.hasContent) {
                this.getContent().style.display = null;
           }
        } else {
            this.classList.remove('selected')
            if (this.hasContent) {
                this.getContent().style.display = 'none';
            }
        }
    }

    getContent() {
        return this.content;
    }

    appendChild() { /* nope */ }

    insertBefore() { /* nope */ }

    onClose(e) {
        e.preventDefault();
        e.stopPropagation();
        let p = getParentInstanceOf(this, JTabView);
        console.log(p);
        if (p) {
            p.closeTab(this);
        }
    }
    
}

customElements.define('j-tab', JTab);

export default JTab;