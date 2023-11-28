import { createElement } from "../utils.js";

class JContextMenu extends HTMLElement {
    
    constructor() {
        super();
        this.tabIndex = -1;
        this.addEventListener('focusout', this.onLostFocus.bind(this));
        this.onclick = this.onItemClicked.bind(this);
        this.callback = null;
    }

    addMenuItem(text, name, cls) {
        if ('string' != typeof(cls)) cls = '';
        if (text == '-') {
            this.appendChild(createElement('div', 'seperator'));
        } else {
            let item = this.appendChild(createElement('div', {className:'menuitem ' + cls, text, name}));
            item.checked = function(v) {
                if (v) {
                    this.classList.add('checked')
                } else {
                    this.classList.remove('checked');
                }
            }
        }
        return this;
    }

    onLostFocus(e) {
        console.log(e);
        this.hide();
    }

    show(x, y, callback) {
        this.callback = callback;
        if (this.parentNode != document.body) {
            document.body.appendChild(this);
        }
        let ow = this.offsetWidth;
        let iw = window.innerWidth - 16;
        let oh = this.offsetHeight;
        let ih = window.innerHeight - 32;
        
        if (x < 10) x = 10;
        if (y < 10) y = 10;
        if (x + ow > iw) x = iw - ow;
        if (y + oh > ih) y = ih - oh;
        this.style.left = x + 'px';
        this.style.top = y + 'px';
        this.focus();

    }

    onItemClicked(e) {
        let selectedName = e.target.getAttribute('name');
        if (selectedName != null) {
            this.blur();
            if (this.callback instanceof Function)
                this.callback(selectedName);
        }
        this.callback = null;
    }

    hide() {
        if (this.parentNode)
            this.remove();
    }

}

customElements.define('j-contextmenu', JContextMenu);

export default JContextMenu;