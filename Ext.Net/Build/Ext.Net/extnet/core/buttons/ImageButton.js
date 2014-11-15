
// @source core/buttons/ImageButton.js

Ext.net.ImageButton = Ext.extend(Ext.Button, {
    buttonSelector : "img",
    cls            : "",
    iconAlign      : "left",

    initComponent : function () {
        Ext.net.ImageButton.superclass.initComponent.call(this);        
        
        var i;
        
        if (this.imageUrl) {
            i = new Image().src = this.imageUrl;
        }

        if (this.overImageUrl) {
            i = new Image().src = this.overImageUrl;
        }

        if (this.disabledImageUrl) {
            i = new Image().src = this.disabledImageUrl;
        }

        if (this.pressedImageUrl) {
            i = new Image().src = this.pressedImageUrl;
        }
    },

    onRender : function (ct, position) {
        if (!this.el) {
            var img = document.createElement("img");
            img.id = this.getId();
            img.src = this.imageUrl;
            img.style.border = "none";
            img.style.cursor = "pointer";

            this.imgEl = Ext.get(img);
            this.el = this.imgEl;

            if (!Ext.isEmpty(this.imgEl.getAttributeNS("", "width"), false) || !Ext.isEmpty(this.imgEl.getAttributeNS("", "height"), false)) {
                img.removeAttribute("width");
                img.removeAttribute("height");
            }

            if (this.altText) {
                img.setAttribute("alt", this.altText);
            }

            if (this.align && this.align !== "notset") {
                img.setAttribute("align", this.align);
            }

            if (this.pressed && this.pressedImageUrl) {
                img.src = this.pressedImageUrl;
            }

            if (this.disabled && this.disabledImageUrl) {
                img.src = this.disabledImageUrl;
            }

            if (this.tabIndex !== undefined) {
                img.tabIndex = this.tabIndex;
            }

            if (this.menu) {
                this.menu.on("show", this.onMenuShow, this);
                this.menu.on("hide", this.onMenuHide, this);
            }

            if (this.repeat) {
                var repeater = new Ext.util.ClickRepeater(this.imgEl, typeof this.repeat === "object" ? this.repeat : {});
                repeater.on("click", this.onClick, this);
            }

            this.imgEl.on(this.clickEvent, this.onClick, this);

            if (this.handleMouseEvents) {
                this.imgEl.on("mouseover", this.onMouseOver, this);
                this.imgEl.on("mousedown", this.onMouseDown, this);
            }

            if (!Ext.isEmpty(this.cls, false)) {
                this.el.dom.className = this.cls;
            }
            
            this.setNavigateUrl();

            Ext.BoxComponent.superclass.onRender.call(this, ct, position);
        }

        if (this.tooltip) {
            if (typeof this.tooltip === "object") {
                Ext.QuickTips.register(Ext.apply({
                    target : this.imgEl.id
                }, this.tooltip));
            } else {
                this.imgEl.dom[this.tooltipType] = this.tooltip;
            }
        }


        Ext.ButtonToggleMgr.register(this);
    },

    afterRender : function () {
        Ext.Button.superclass.afterRender.call(this);
        this.doc = Ext.getDoc();
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
                if (this.pressedImageUrl) {
                    this.imgEl.dom.src = this.pressedImageUrl;
                }
                
                this.pressed = true;
                this.fireEvent("toggle", this, true);
            } else {
                this.imgEl.dom.src = (this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
                this.pressed = false;
                this.fireEvent("toggle", this, false);
            }
            
            if (this.toggleHandler) {
                this.toggleHandler.call(this.scope || this, this, state);
            }
        }
    },

    setText : function (t, encode) { },

    setDisabled : function (disabled) {
        this.disabled = disabled;
        
        if (this.imgEl && this.imgEl.dom) {
            this.imgEl.dom.disabled = disabled;
        }
        
        if (disabled) {
            if (this.disabledImageUrl) {
                this.imgEl.dom.src = this.disabledImageUrl;
            } else {
                this.imgEl.addClass(this.disabledClass);
            }
        } else {
            this.imgEl.dom.src = this.imageUrl;
            this.imgEl.removeClass(this.disabledClass);
        }
    },

    // private
    onMouseOver : function (e) {
        if (!this.disabled) {
            var internal = e.within(this.el.dom, true);

            if (!internal) {
                if (this.overImageUrl && !this.pressed) {
                    this.imgEl.dom.src = this.overImageUrl;
                }

                if (!this.monitoringMouseOver) {
                    Ext.getDoc().on("mouseover", this.monitorMouseOver, this);
                    this.monitoringMouseOver = true;
                }
            }
        }

        this.fireEvent("mouseover", this, e);
    },

    // private
    onMouseOut : function (e) {
        if (!this.disabled && !this.pressed) {
            this.imgEl.dom.src = this.imageUrl;
        }
        
        this.fireEvent("mouseout", this, e);
    },

    onMouseDown : function (e) {
        if (!this.disabled && e.button === 0) {
            if (this.pressedImageUrl) {
                this.imgEl.dom.src = this.pressedImageUrl;
            }
            
            Ext.getDoc().on("mouseup", this.onMouseUp, this);
        }
    },
    
    // private
    onMouseUp : function (e) {
        if (e.button === 0) {
            this.imgEl.dom.src = (this.overImageUrl && this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
            Ext.getDoc().un("mouseup", this.onMouseUp, this);
        }
    },
    
    setImageUrl : function (image) {
        this.imageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setDisabledImageUrl : function (image) {
        this.disabledImageUrl = image;
        
        if (this.disabled) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setOverImageUrl : function (image) {
        this.overImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && this.monitoringMouseOver && (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setPressedImageUrl : function (image) {
        this.pressedImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && this.pressed) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setAlign : function (align) {
        this.align = align;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("align", this.align);
        }
    },

    setAltText : function (altText) {
        this.altText = altText;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("altText", this.altText);
        }
    }
});

Ext.reg("netimagebutton", Ext.net.ImageButton);