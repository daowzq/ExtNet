
// @source core/tree/AsyncTreeNode.js

Ext.tree.AsyncTreeNode.override({
    loadNodes : function (nodes) {
        this.beginUpdate();

        var i = 0,
            len;

        for (i, len = nodes.length; i < len; i++) {
            var n = this.getOwnerTree().getLoader().createNode(nodes[i]);

            if (!Ext.isEmpty(n)) {
                if (this.getOwnerTree().getLoader().preloadChildren) {
                    this.getOwnerTree().getLoader().doPreload(n);
                }

                this.appendChild(n);
            }
        }

        this.endUpdate();
        this.loadComplete();
    }
});