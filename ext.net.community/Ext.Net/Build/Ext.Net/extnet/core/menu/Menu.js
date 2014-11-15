
// @source core/menu/Menu.js

Ext.override(Ext.menu.Menu, {
    enableScrolling : false,
    
    lastTargetIn : function (cmp) {
        return Ext.fly(cmp.getEl ? cmp.getEl() : cmp).contains(this.trg);
    },
    
    render : function (ct, position) {        
        if (!ct && this.floating && this.renderToForm === true) {
            ct = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
        }
        
        Ext.menu.Menu.superclass.render.call(this, ct, position);
    }
});

Ext.override(Ext.layout.MenuLayout, {
    doAutoSize : function () {
        var ct = this.container, 
            w = ct.width;

        if (ct.floating) {
            if (w) {
                ct.setWidth(w);
            } else if (Ext.isIE) {
                ct.setWidth(Ext.isStrict && (!Ext.isIE6) ? 'auto' : ct.minWidth);

                var el = ct.getEl(), t = el.dom.offsetWidth; // force recalc
                
                ct.setWidth(ct.getLayoutTarget().getWidth() + el.getFrameWidth('lr'));
            }
        }
    }
});