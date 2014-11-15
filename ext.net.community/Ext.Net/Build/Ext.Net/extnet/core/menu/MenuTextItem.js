
// @source core/menu/MenuTextItem.js

Ext.override(Ext.menu.TextItem, {
    setText : function (text) {
        if (this.rendered) {
            this.el.dom.innerHTML = text;
        } else {
            this.text = text;
        }
    }
});

Ext.override(Ext.menu.Separator, {
    disabled : true
});