
// @source core/toolbar/Toolbar.js

Ext.Toolbar.prototype.initComponent = Ext.Toolbar.prototype.initComponent.createSequence(function () {
    if (this.classicButtonStyle) {
        this.setClassicButtonStyle(this.classicButtonStyle);
    }
});

Ext.override(Ext.Component, {
    setClassicButtonStyle : function (classic) {
        this[classic ? "addClass" : "removeClass"]("x-toolbar-classic");
    }
});