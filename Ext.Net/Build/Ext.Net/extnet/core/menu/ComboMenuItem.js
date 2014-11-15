
// @source core/menu/ComboMenuItem.js

Ext.net.ComboMenuItem = function (config) {
    Ext.net.ComboMenuItem.superclass.constructor.call(this, config);
    this.component = Ext.ComponentMgr.create(Ext.apply(config.component || config.combobox || {}, { lazyInit : false }), "combo");
    
    this.component.getZIndex = function () { 
        return 99999; 
    };
    
    this.combo = this.component;
    this.addEvents("select");
    
    if (this.iconCls) {
        this.iconCls += " x-menu-field-icon";
    }
    
    this.combo.on("afterrender", function (combo) {
        combo.getEl().swallowEvent("click");
        
        if (combo.list) {
            combo.list.on("mousedown", function (e) {
                Ext.lib.Event.stopPropagation(e);
            });
        }
    }, this);
};

Ext.extend(Ext.net.ComboMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    shift       : true,
    
    onSelect    : function (combo, record) {
        this.fireEvent("select", this, record);
        Ext.net.ComboMenuItem.superclass.handleClick.call(this);
    },
    
    onRender : function (container) {
        this.component.render(container);
        this.el = this.component.getEl();

        if (Ext.isIE && this.combo.list) {
            this.combo.list.shadow = false;
        }

        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);
        
        if (this.shift) {
            this.component.container.applyStyles({ "padding-left" : "24px" });
        }
    }
});

Ext.reg("combomenuitem", Ext.net.ComboMenuItem);