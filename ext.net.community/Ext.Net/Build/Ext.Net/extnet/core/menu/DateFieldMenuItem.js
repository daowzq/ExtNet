
// @source core/menu/DatFieldMenuItem.js

Ext.net.DateFieldMenuItem = function (config) {
    Ext.net.DateFieldMenuItem.superclass.constructor.call(this, config);
    this.component = Ext.ComponentMgr.create(config.component || config.dateField, "datefield");
    this.dateField = this.component;
    
    if (this.iconCls) {
        this.iconCls += " x-menu-field-icon";
    }
    
    this.dateField.menu = new Ext.menu.DateMenu({
        allowOtherMenus : true
    });

    this.dateField.on("render", function (dateField) {
        dateField.getEl().swallowEvent("click");
    });
};

Ext.extend(Ext.net.DateFieldMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    canActivate : false,
    shift       : true,
    
    onRender    : function (container) {
               
        this.component.render(container);
        this.el = this.component.getEl();

        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);
        
        if (this.shift) {
            this.component.container.applyStyles({ "padding-left": "24px" });
        }
    }
});

Ext.reg("datefieldmenuitem", Ext.net.DateFieldMenuItem);