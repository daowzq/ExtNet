
// @source core/tree/TreeNodeUI.js

Ext.tree.TreeNodeUI.prototype.renderElements = Ext.tree.TreeNodeUI.prototype.renderElements.createSequence(function (n, a, targetNode, bulkRender) {
    if (n.hidden) {
        this.hide();
    }
});

Ext.tree.TreeNodeUI.override({
    collapse : function () {
        this.updateExpandIcon();

        if (this.rendered) {
            this.ctNode.style.display = "none";
        }
    }
});