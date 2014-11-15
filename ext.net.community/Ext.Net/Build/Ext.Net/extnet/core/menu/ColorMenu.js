// @source core/menu/ColorMenu.js

Ext.override(Ext.menu.ColorMenu, {
    initComponent : function () {
        Ext.apply(this, {
            plain         : true,
            showSeparator : false,
            items         : this.palette = new Ext.ColorPalette(this.initialConfig.palette || {})
        });
        var restoreWindowProp = !Ext.isEmpty(window[this.palette.id]);
        this.palette.purgeListeners();
        
        if (restoreWindowProp) {
            window[this.palette.id] = this.palette;
        }
        
        Ext.menu.ColorMenu.superclass.initComponent.call(this);
        this.relayEvents(this.palette, ["select"]);
        this.on("select", this.menuHide, this);
        
        if (this.handler) {
            this.on("select", this.handler, this.scope || this);
        }
    }
});