
// @source core/toolbar/ToolbarItem.js

// HACK: monkey-patch Toolbar.Item .getEl() to return a typeof Element
Ext.Toolbar.Item.prototype.getEl = function () {
    return Ext.get(this.el);
};