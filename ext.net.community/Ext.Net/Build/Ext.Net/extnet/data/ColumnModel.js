
// @source data/ColumnModel.js

Ext.grid.ColumnModel.override({
    defaultSortable: true, 
    
    isMenuDisabled : function (col) {
        var column = this.config[col];
        
        if (Ext.isEmpty(column)) {
            return true;
        }
        
        return !!column.menuDisabled;
    },
    
    isSortable : function (col) {
        var column = this.config[col];
        
        if (Ext.isEmpty(column)) {
            return false;
        }
    
        if (typeof this.config[col].sortable === "undefined") {
            return this.defaultSortable;
        }
        
        return this.config[col].sortable;
    },
    
    isHidden : function (colIndex) {        
        return colIndex >= 0 && this.config[colIndex].hidden;
    },

    isFixed : function (colIndex) {
        return colIndex >= 0 && this.config[colIndex].fixed;
    }
});

Ext.grid.Column.override({
    forbidIdScoping : true,

    getCellEditor: function(rowIndex){
        var ed = this.getEditor(rowIndex);
        if(ed){
            if(!ed.startEdit){
                if(!ed.gridEditor){
                    ed.gridEditor = new Ext.grid.GridEditor(ed);
                }
                ed = ed.gridEditor;
            }
            else if(ed.field){
                ed.field.gridEditor = ed;
            }
        }
        return ed;
    }
});