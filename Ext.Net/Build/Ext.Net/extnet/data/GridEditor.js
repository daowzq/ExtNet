
// @source data/GridEditor.js

Ext.grid.GridEditor.override({
    setSize : function (w, h) {
        Ext.grid.GridEditor.superclass.setSize.call(this, w, h); 
        
        if (this.el) {            
            if (Ext.isIE7) {
                (function () {
                    this.el.setSize(w, h);
                    this.el.sync();
                }).defer(40, this);
            }
        }
    }
});