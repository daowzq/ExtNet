
// @source core/layout/BoxLayout.js

Ext.layout.BoxLayout.override({
    getVisibleItems: function (ct) {
        ct  = ct || this.container;

        var t   = ct.getLayoutTarget(),
            cti = ct.items.items,
            len = cti.length,
            i, 
            c, 
            items = [];

        for (i = 0; i < len; i++) {
            if ((c = cti[i]).rendered && this.isValidParent(c, t) && c.hidden !== true) {
                 /*  && c.collapsed !== true*/
                items.push(c);
            }
        }

        return items;
    }
});

Ext.layout.VBoxLayout.override({
    renderItem : function (c) {
        c.on("collapse", function (item) {
            item.oldHeight = item.height; 
            item.height = item.getHeight();
            this.layout();
        }, this);

        c.on("beforeexpand", function (item) {
            item.height = item.oldHeight;
            this.layout();
        }, this);
        
        Ext.layout.VBoxLayout.superclass.renderItem.apply(this, arguments);
    }
});