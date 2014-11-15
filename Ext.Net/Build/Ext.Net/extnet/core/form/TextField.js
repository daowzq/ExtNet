
// @source core/form/TextField.js

Ext.form.TextField.prototype.initComponent = Ext.form.TextField.prototype.initComponent.createSequence(function () {
    this.addEvents("iconclick");
    this.setIconClass = this.setIconCls;
});

Ext.override(Ext.form.TextField, {
    truncate : true,

    afterRender : function () {
        Ext.form.TextField.superclass.afterRender.call(this);

        if (this.maxLength !== Number.MAX_VALUE && this.truncate === true) {
            this.setMaxLength(this.maxLength);
        }

        if (this.iconCls) {
            var iconCls = this.iconCls;
            delete this.iconCls;
            this.setIconCls(iconCls);
        }
    },
    
    setMaxLength : function (val) {
        this.el.dom.setAttribute("maxlength", val);
        this.maxLength = val;
    },
    
    isIconIgnore : function () {
        return !!this.el.up(".x-menu-list-item");
    },

    //private
    renderIconEl : function () {
        if (!this.wrap) {
            this.wrap = this.el.wrap();
            this.positionEl = this.wrap;
        }
        
        this.wrap.addClass("x-form-field-wrap");
        this.wrap.applyStyles({ position : "relative" });
        this.el.addClass("x-textfield-icon-input");

        this.icon = Ext.DomHelper.append(this.el.up("div.x-form-field-wrap") || this.wrap, {
            tag   : "div", 
            style : "position:absolute"
        }, true);
        
        if (this.initialConfig.width) {
            delete this.lastSize;
            this.setWidth(this.initialConfig.width);
        }        
        
        this.icon.on("click", function (e, t) {
            this.fireEvent("iconclick", this, e, t);
        }, this);
    },

    setIconCls : function (iconCls) {
        if (this.isIconIgnore()) {
            return;
        }
        
        if (!this.iconCls) {
            this.renderIconEl();
        }

        this.iconCls = iconCls;
        this.icon.dom.className = "x-textfield-icon " + iconCls;
        this.syncSize();
    },
    
    filterKeys : function (e) {
        if (e.ctrlKey) {
            return;
        }
        
        var k = e.getKey();
        
        if ((Ext.isGecko || Ext.isOpera) && (e.isNavKeyPress() || k === e.BACKSPACE || (k === e.DELETE && e.button === -1))) {
            return;
        }
        
        var cc = String.fromCharCode(e.getCharCode());
        
        if (!Ext.isGecko && !Ext.isOpera && e.isSpecialKey() && !cc) {
            return;
        }
        
        if (!this.maskRe.test(cc)) {
            e.stopEvent();
        }
    }
});