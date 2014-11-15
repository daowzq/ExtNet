
// @source core/toolbar/ToolbarSpacer.js

Ext.net.ToolbarSpacer = function (config) {
    Ext.net.ToolbarSpacer.superclass.constructor.call(this);
    config = config || {};
    this.width = config.width;

    this.render = function (td) {
        Ext.net.ToolbarSpacer.superclass.render.call(this, td);
        if (!Ext.isEmpty(this.width)) {
            Ext.fly(this.el).removeClass("ytb-spacer").setWidth(this.width);
        }
    };
};

Ext.extend(Ext.net.ToolbarSpacer, Ext.Toolbar.Spacer);

Ext.reg("nettbspacer", Ext.net.ToolbarSpacer);