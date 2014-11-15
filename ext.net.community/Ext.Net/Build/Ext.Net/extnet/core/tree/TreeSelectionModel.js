
// @source core/tree/TreeSelectionModel.js

Ext.override(Ext.tree.MultiSelectionModel, {
    onNodeClick : function (node, e) {
        var keep = e.ctrlKey || this.keepSelectionOnClick === "always";
        
        if (keep && this.isSelected(node)) {
            this.unselect(node);
        } else {
            this.select(node, e, keep);
        }
    }
});