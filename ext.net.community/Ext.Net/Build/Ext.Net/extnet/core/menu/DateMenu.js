
// @source core/menu/DateMenu.js

Ext.override(Ext.menu.DateMenu, {
    initComponent : function () {
        this.on("beforeshow", this.onBeforeShow, this);
        
        this.strict = (Ext.isIE7 && Ext.isStrict);

        if (this.strict) {
            this.on("show", this.onShow, this, { single : true, delay : 20 });
        }
        
        Ext.apply(this, {
            plain         : true,
            showSeparator : false,
            items         : this.picker = new Ext.DatePicker(Ext.apply({
                internalRender : this.strict || !Ext.isIE,
                ctCls          : "x-menu-date-item"
            }, this.initialConfig.picker))
        });
        var restoreWindowProp = !Ext.isEmpty(window[this.picker.id]);
        this.picker.purgeListeners();
        
        if (restoreWindowProp) {
            window[this.picker.id] = this.picker;
        }
        
        Ext.menu.DateMenu.superclass.initComponent.call(this);
        this.relayEvents(this.picker, ["select"]);
        this.on("show", this.picker.focus, this.picker);
        this.on("select", this.menuHide, this);
        
        if (this.handler) {
            this.on("select", this.handler, this.scope || this);
        }
    }
});