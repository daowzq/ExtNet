
// @source core/layout/BorderLayoutRegion.js

Ext.layout.BorderLayout.SplitRegion.prototype.render = Ext.layout.BorderLayout.SplitRegion.prototype.render.createInterceptor(function (ct, p) {
    var pos = this.position,
        dir = "westeast".indexOf(pos) > -1 ? "Width" : "Height";
    this.splitSettings[pos].maxProp = (Ext.isDefined(p["boxMax" + dir]) ? "boxMax" : "max") + dir;
    this.splitSettings[pos].minProp = (Ext.isDefined(p["boxMin" + dir]) ? "boxMin" : "min") + dir;
});

Ext.layout.BorderLayout.SplitRegion.prototype.getCollapsedEl = Ext.layout.BorderLayout.SplitRegion.prototype.getCollapsedEl.createSequence(function () {
    if (this.useSplitTips) {
        this.collapsedEl.dom.title = this.collapsible ? this.expandableSplitTip : this.splitTip;
    }
});

Ext.layout.BorderLayout.Region.prototype.destroy = Ext.layout.BorderLayout.Region.prototype.destroy.createInterceptor(function () {
    this.clearMonitor();
});

Ext.layout.BorderLayout.SplitRegion.override({
    expandableSplitTip : "Double click to show."
});