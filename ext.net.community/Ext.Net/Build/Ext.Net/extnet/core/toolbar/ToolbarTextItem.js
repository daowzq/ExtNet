
// @source core/toolbar/ToolbarTextItem.js

Ext.Toolbar.TextItem.override({
    getText : function () {
        return this.rendered ? this.el.dom.innerHTML : this.autoEl.html;
    }
});