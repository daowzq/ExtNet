
// @source core/layout/CenterLayout.js

Ext.ux.layout.CenterLayout = Ext.extend(Ext.layout.FitLayout, {    
    setItemSize : function (item, size) {        
        this.container.addClass("ux-layout-center");        
        
        if (item && size.height > 0) {
			item.addClass("ux-layout-center-item");

            if (item.width) {
                size.width = item.width;
            }
            
            item.setSize(size);
        }
    }
});

Ext.Container.LAYOUTS["ux.center"] = Ext.ux.layout.CenterLayout;