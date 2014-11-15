
// @source core/menu/MenuPanel.js

Ext.net.MenuPanel = function (config) {
    Ext.net.MenuPanel.superclass.constructor.call(this, config);
};

Ext.extend(Ext.net.MenuPanel, Ext.Panel, {
    saveSelection : true,
    selectedIndex : -1,
    fitHeight     : true,

    initComponent : function () {
        Ext.net.MenuPanel.superclass.initComponent.call(this);
        
        this.menu = this.menu.render ? this.menu : Ext.ComponentMgr.create(this.menu, "menu");

        if (this.selectedIndex > -1) {
            this.menu.items.get(this.selectedIndex).ctCls = "x-menu-item-active";
            this.getSelIndexField().setValue(this.selectedIndex);
        }

        this.menu.on("itemclick", this.setSelection, this);
        this.menu.on("mouseout", this.onMenuMouseOut, this);
    },

    onMenuMouseOut : function (menu, e, t) {
        if (!this.saveSelection) {
            return;
        }
        
        var index = this.menu.items.indexOf(t),
            selIndex = this.getSelIndexField().getValue();
            
        // do not replace == by ===
        if (selIndex.length > 0 && index == selIndex) {
            t.container.addClass("x-menu-item-active");
        }
    },

    setSelectedIndex : function (index) {
        this.setSelection(this.menu.items.get(index));
    },

    getSelIndexField : function () {
        if (!this.selIndexField) {
            this.selIndexField = new Ext.form.Hidden({ id : this.id + "_SelIndex", name : this.id + "_SelIndex" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selIndexField);	
        }
        
        return this.selIndexField;
    },

    setSelection : function (item, e) {
        if (this.saveSelection) {
            this.menu.items.each(function (item) {
                item.container.removeClass("x-menu-item-active");
            }, this.menu);

            item.container.addClass("x-menu-item-active");
        }

        this.getSelIndexField().setValue(this.menu.items.indexOf(item));
    },
    
    clearSelection : function () {
        this.menu.items.each(function (item) {
            item.container.removeClass("x-menu-item-active");
        }, this.menu);
        
        this.getSelIndexField().setValue(null);
    },

    afterRender : function () {
        Ext.net.MenuPanel.superclass.afterRender.call(this);
        
        if (this.collapsed) {
            this.on("expand", this.initMenu, this, { single : true });
        } else {
            this.initMenu();
        }

        this.getSelIndexField().render(this.el.parent() || this.el);
    },
    
    initMenu : function () {
        this.menu.render(this.body);
        var lay = this.menu.getEl();
        
        if (Ext.isIE) {
            lay.shadow = false;
        }

        lay.clearPositioning("auto");
        
        if (this.fitHeight) {
            lay.setSize("100%", "100%");
        } else {
            lay.setWidth("100%");
        }
        
        lay.applyStyles({ border : "0px" });
        lay.show();   
        this.collapse(false);  
        this.expand(false);
    }
});

Ext.reg("netmenupanel", Ext.net.MenuPanel);