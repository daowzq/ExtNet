
// @source data/RowNumberer.js

Ext.override(Ext.grid.RowNumberer, {
    isRowNumberer : true,
    hideable      : false,
    
    renderer : function (v, p, record, rowIndex) {
        if (this.grid && this.grid.getRowExpander()) {
            p.cellAttr = 'rowspan="2"';
        }        
        
        if (this.rowspan) {
            p.cellAttr = 'rowspan="' + this.rowspan + '"';
        }

        var so = record.store.lastOptions,
            sop = so ? so.params : null;
            
        return ((sop && sop.start) ? sop.start : 0) + rowIndex + 1;
    }
});