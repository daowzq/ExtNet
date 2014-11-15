
// @source core/layout/AnchorLayout.js

/**
* @class Ext.net.AnchorLayout
* @extends Ext.layout.AnchorLayout
* This layout adds the ability for x/y positioning using the standard x and y component config options.
*/
Ext.layout.AnchorLayout.override({
    monitorResize : true,    
    
    getLayoutTargetSize : function () {
        var target = this.container.getLayoutTarget(), 
            ret = {},
            isViewSize;
            
        if (target) {
            isViewSize = ((target.dom == Ext.getBody().dom) || (target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom));
            ret =  isViewSize ? target.getViewSize() : target.getStyleSize();
            
            if (Ext.isIE && Ext.isStrict && ret.width === 0) {
                ret =  target.getStyleSize();
            }
            
            if (isViewSize) {
                ret.width -= target.getPadding("lr");
                ret.height -= target.getPadding("tb");
            }
        }
        
        return ret;
    }
});