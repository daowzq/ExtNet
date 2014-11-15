
// @source core/buttons/LinkButton.js

Ext.net.LinkButton = Ext.extend(Ext.Button, {
    buttonSelector : "a:first",
    cls            : "",
    iconAlign      : "left",

    valueElement : function () {
        var textEl = document.createElement("a");
        
        textEl.style.verticalAlign = "middle";
        textEl.id = Ext.id();
        
        if (!Ext.isEmpty(this.cls, false)) {
            textEl.className = this.cls;
        }

        textEl.setAttribute("href", "#");

        if (this.disabled || this.pressed) {
            textEl.setAttribute("disabled", "1");
            textEl.removeAttribute("href");

            if (this.pressed && this.allowDepress !== false) {
                textEl.style.cursor = "pointer";
            }
        }

        if (this.tabIndex !== undefined) {
            textEl.tabIndex = this.tabIndex;
        }
        
        if (this.tooltip) {
            if (typeof this.tooltip === "object") {
                Ext.QuickTips.register(Ext.apply({
                    target : textEl.id
                }, this.tooltip));
            } else {
                textEl[this.tooltipType] = this.tooltip;
            }
        }

        textEl.innerHTML = this.text;
        
        var txt = Ext.get(textEl);

        if (this.menu) {
            this.menu.on("show", this.onMenuShow, this);
            this.menu.on("hide", this.onMenuHide, this);
        }

        if (this.repeat) {
            var repeater = new Ext.util.ClickRepeater(txt, typeof this.repeat === "object" ? this.repeat : {});
            repeater.on("click", this.onClick, this);
        }

        txt.on(this.clickEvent, this.onClick, this);

        this.textEl = textEl;
        return this.textEl;
    },

    // private
    onMenuShow : function (e) {
        this.ignoreNextClick = 0;
        this.fireEvent("menushow", this, this.menu);
    },
    
    // private
    onMenuHide : function (e) {
        this.ignoreNextClick = this.restoreClick.defer(250, this);
        this.fireEvent("menuhide", this, this.menu);
    },

    toggle : function (state) {
        state = state === undefined ? !this.pressed : state;
        if (state !== this.pressed) {
            if (state) {
                this.setDisabled(true);
                this.disabled = false;
                this.pressed = true;
                
                if (this.allowDepress !== false) {
                    this.textEl.style.cursor = "pointer";
                    this.el.dom.style.cursor = "pointer";
                }
                this.fireEvent("toggle", this, true);
            } else {
                this.setDisabled(false);
                this.pressed = false;
                this.fireEvent("toggle", this, false);
            }
            
            if (this.toggleHandler) {
                this.toggleHandler.call(this.scope || this, this, state);
            }
        }
    },

    onRender : function (ct, position) {
        if (!this.el) {
            var el = document.createElement("span");
            el.id = this.getId();

            var img = document.createElement("img");
            img.src = Ext.BLANK_IMAGE_URL;
            img.className = "x-label-icon " + (this.iconCls || "");

            if (Ext.isEmpty(this.iconCls)) {
                img.style.display = "none";
            }

            if (this.iconAlign === "left") {
                el.appendChild(img);
            }

            el.appendChild(this.valueElement());

            if (this.iconAlign === "right") {
                el.appendChild(img);
            }

            this.el = el;
            Ext.BoxComponent.superclass.onRender.call(this, ct, position);
        }

        if (this.pressed && this.allowDepress !== false) {
            this.setDisabled(true);
            this.disabled = false;
            this.el.dom.style.cursor = "pointer";
        }
        
        this.setNavigateUrl();

        Ext.ButtonToggleMgr.register(this);
    },
    
    setText : function (t, encode) {
        this.text = t;
        
        if (this.rendered) {
            this.textEl.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
        
        return this;
    },
    
    setIconClass : function (cls) {
        var oldCls = this.iconCls;
        
        this.iconCls = cls;
        
        if (this.rendered) {
            var img = this.el.child("img.x-label-icon");
            img.replaceClass(oldCls, this.iconCls);
            img.dom.style.display = (cls === "") ? "none" : "inline";
        }
    },

    onDisable : function () {
        Ext.net.LinkButton.superclass.onDisable.apply(this);
        this.textEl.setAttribute("disabled", "1");
        this.textEl.removeAttribute("href");
    },
    
    onEnable : function () {
        Ext.net.LinkButton.superclass.onEnable.apply(this);
        this.textEl.removeAttribute("disabled");
        this.textEl.setAttribute("href", "#");
    }
});

Ext.reg("netlinkbutton", Ext.net.LinkButton);