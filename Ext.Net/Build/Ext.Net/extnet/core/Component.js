
// @source core/Component.js

Ext.Component.prototype.destroy = Ext.Component.prototype.destroy.createInterceptor(function () {
    this.destroyBin();
	this.cleanId();
});

Ext.Component.prototype.initComponent = Ext.Component.prototype.initComponent.createSequence(function () {
    if (!Ext.isEmpty(this.contextMenuId, false)) {
        this.on("render", function () {
            this.el.on("contextmenu", function (e, t) {
                var menu = Ext.menu.MenuMgr.get(this.contextMenuId);
                menu.trg = t;
                e.stopEvent();
                e.preventDefault();
                menu.showAt(e.getPoint());
            }, this);            
        }, this, { single : true });    
    }
    
    this.initFieldLabel();
    
    if (!Ext.isEmpty(this.defaultAnchor, true)) {
        if (Ext.isEmpty(this.defaults)) {
            this.defaults = {};
        }
        
        Ext.apply(this.defaults, { anchor : this.defaultAnchor });
    }
    
    if (this.selectable === false) {
        this.on("afterrender", function () { 
            this.setSelectable(false); 
        });
    }
    
    if (this.autoFocus) {
        if (this.ownerCt) {
            this.ownerCt.on("afterlayout", function () { 
                this.focus(this.selectOnFocus || false, this.autoFocusDelay);
            }, this);
        } else {
            this.on("afterrender", function () { 
                this.focus(this.selectOnFocus || false, this.autoFocusDelay);
            });
        }
    }
    
    if (this.postback) {
        this.on(this.postback.eventName, this.postback.fn, this, { delay : 30 });
    }
});

Ext.override(Ext.Component, {
    selectable      : true,    
    autoFocusDelay  : 10,
	
	destroyBin : function () {
		if(this.bin){
		    Ext.destroy(this.bin);
		}
		delete this.bin;
	},
    
    setSelectable : function (selectable) {
        if (selectable === false) {
            this.setDisabled(true).el.removeClass("x-item-disabled").applyStyles("color:black;");
        } else if (selectable === true) {
            this.setDisabled(false);
        }
        
        this.selectable = false;
        
        return this;
    },
    
    initFieldLabel : function () {
        if (this.fieldLabel) {
            this.plugins = this.plugins || [];
            
            if (!Ext.isArray(this.plugins)) {
                this.plugins = [this.plugins];
            }
            
            this.plugins.push(Ext.ux.FieldLabeler);
        }
    },
    
    addPlugins : function (plugins) {
        if (Ext.isEmpty(this.plugins)) {
            this.plugins = [];
        } else if (!Ext.isArray(this.plugins)) {
            this.plugins = [ this.plugins ];
        }
        
        if (Ext.isArray(plugins)) {
            var i = 0;
            for (i; i < plugins.length; i++) {
                this.plugins.push(this.initPlugin(plugins[i]));
            }
        } else {
            this.plugins.push(this.initPlugin(plugins));
        }
    },
    
    getForm : function (id) {
        var form = Ext.isEmpty(id) ? this.el.up("form") : Ext.get(id);
        
        if (!Ext.isEmpty(form)) {
            Ext.apply(form, form.dom);
            
            form.submit = function () {
                form.dom.submit();
            };
        }
        
        return form;
    },
    
    setFieldLabel : function (text) {
        this.fieldLabel = text;
        
        if (this.label) {
            this.label.update(text);
        }
    },
    
    setAnchor : function (anchor, doLayout) {
        this.anchor = anchor;
        delete this.anchorSpec;
        
        if (doLayout && this.ownerCt) {
            this.ownerCt.doLayout();
        }
    }
});