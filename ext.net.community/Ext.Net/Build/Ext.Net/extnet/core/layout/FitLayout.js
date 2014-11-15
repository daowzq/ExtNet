
// @source core/layout/FitLayout.js

Ext.override(Ext.layout.FitLayout, {
    onLayout : function (ct, target) {
        Ext.layout.FitLayout.superclass.onLayout.call(this, ct, target);
        
        if (!ct.collapsed) {            
            var sz;
            
            if (Ext.isIE6 && Ext.isStrict && target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) {
                sz = Ext.getBody().getViewSize();
            } else {
                sz = ((Ext.isIE6 && Ext.isStrict && target.dom == document.body) || target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) ? target.getViewSize() : target.getStyleSize();
            }
            
            this.setItemSize(this.activeItem || ct.items.itemAt(0), sz);
        }
    }
});
