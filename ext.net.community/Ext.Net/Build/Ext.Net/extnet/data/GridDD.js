
// @source data/GridDD.js

Ext.grid.GridDragZone.override({
    getDragData : function (e) {
        var t = Ext.lib.Event.getTarget(e),
            rowIndex = this.view.findRowIndex(t);
        
        if (rowIndex !== false) {
            var sm = this.grid.selModel;
        
            if (!sm.isSelected(rowIndex) || e.hasModifier() || sm.keepSelectionOnClick === "always") {
                sm.handleMouseDown(this.grid, rowIndex, e);
            }
        
            return {
                grid       : this.grid, 
                ddel       : this.ddel, 
                rowIndex   : rowIndex, 
                selections : sm.getSelections()
            };
        }
        
        return false;
    }
});