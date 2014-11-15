
// @source core/menu/ComponentMenuItem.js

Ext.net.ComponentMenuItem = function (cfg) {
    this.target = cfg.target;    
    
    if (cfg.iconCls) {
        cfg.iconCls += " x-menu-field-icon";
        cfg.shift = false;
    }
      
    Ext.net.ComponentMenuItem.superclass.constructor.call(this, cfg);
    
    if (cfg.component) {
        this.component = cfg.component.rendered ? cfg.component : Ext.ComponentMgr.create(cfg.component, "panel");
    }
};

Ext.extend(Ext.net.ComponentMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    itemCls     : "x-menu-item",
    shift       : true,
    componentElement : "auto",

    // private
    onRender : function (container) {
        if (this.iconCls) {
            this.iconCls += " x-menu-field-icon";
        }
        
        if (this.component) {
                       
            this.component = this.component.rendered ? this.component : Ext.ComponentMgr.create(this.component, "panel");
            
            if (!this.component.rendered) {
                this.component.render(container);
                this.el = this.component.getEl();
            }
        } else {
            this.el = (this.target.getEl) ? this.target.getEl() : Ext.get(this.target);
            this.component = Ext.getCmp(this.el.id);
        }   
        
        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);        
        
        if (this.componentElement === "auto") {
            this.componentElement = this.component.wrap ? "wrap" : "element";
        }
        
        if (this.componentElement === "wrap" && !Ext.isEmpty(this.component)) {            
            this.el = this.component.wrap;
        }   
        
        if (this.shift) {
            if (this.componentElement === "wrap") {
                container.applyStyles({ "padding-left": "25px" });
            } else {
                this.el.applyStyles({ "margin-left": "23px" });
            }
        }     

        Ext.net.ComponentMenuItem.superclass.onRender.apply(this, arguments);
        
        if (!Ext.isEmpty(this.component)) {
            if (this.component.doLayout) {
                this.component.doLayout();
            }

            if (this.component.syncSize) {
                this.component.syncSize();
            }
        }

        if (Ext.isIE) {
            if (this.parentMenu) {
                this.parentMenu.shadow = false;
                this.parentMenu.el.shadow = false;
            }

            if (!Ext.isEmpty(this.component)) {
                this.component.shadow = false;
                this.component.el.shadow = false;
            }
        }
        
        this.component.parentMenu = this.parentMenu;
    },

    activate : function () {
        if (this.disabled) {
            return false;
        }
        
        if (Ext.isEmpty(this.component)) {
            return false;
        }

        this.component.focus();
        this.fireEvent("activate", this);
        return true;
    },

    // private
    deactivate : function () {
        this.fireEvent("deactivate", this);
    },

    // private
    disable : function () {        
        if (Ext.isEmpty(this.component)) {
            return;
        }
        
        this.component.disable();
        
        Ext.net.ComponentMenuItem.superclass.disable.call(this);
    },

    // private
    enable : function () {
        if (Ext.isEmpty(this.component)) {
            return;
        }
        
        this.component.enable();
        Ext.net.ComponentMenuItem.superclass.enable.call(this);
    }
});

Ext.reg("componentmenuitem", Ext.net.ComponentMenuItem);
