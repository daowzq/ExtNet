
// @source data/RowSelectionModel.js

Ext.grid.CellSelectionModel.prototype.handleMouseDown = Ext.grid.CellSelectionModel.prototype.handleMouseDown.createInterceptor(function (g, row, cell, e) {
    if (this.ignoreTargets) {
        var i = 0;

        for (i; i < this.ignoreTargets.length; i++) {
            if (e.getTarget(this.ignoreTargets[i])) {
                return false;
            }
        }
    }
});

Ext.grid.RowSelectionModel.prototype.handleMouseDown = Ext.grid.RowSelectionModel.prototype.handleMouseDown.createInterceptor(function (g, rowIndex, e) {
    if (e.button !== 0 || this.isLocked()) {
        return;
    }
    
    if (this.ignoreTargets) {
        var i = 0;

        for (i; i < this.ignoreTargets.length; i++) {
            if (e.getTarget(this.ignoreTargets[i])) {
                return false;
            }
        }
    }
});

Ext.grid.RowSelectionModel.override({
    selectById : function (ids, keepExisting) {
        if (!keepExisting) {
            this.clearSelections();
        }
        
        if (!Ext.isArray(ids)) {
            ids = [ids];
        }
        
        var ds = this.grid.store,
            i,
            len;
        
        for (i = 0, len = ids.length; i < len; i++) {
            this.selectRow(ds.indexOfId(ids[i]), true);
        }
    }
});