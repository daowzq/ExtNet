
// @source core/tree/TreeNode.js

Ext.override(Ext.tree.TreeNode, {
    removeChildren : function () {
        while (this.childNodes.length > 0) {
            this.removeChild(this.childNodes[0]);
        }
    },
    
    clone : function (newId) {
        var atts = this.attributes;
        
        atts.id = (newId !== false) ? Ext.id() : this.id;
        
        var clonedNode = new Ext.tree.TreeNode(Ext.apply({}, atts)),
            i = 0;

        clonedNode.text = this.text;

        for (i; i < this.childNodes.length; i++) {
            clonedNode.appendChild(this.childNodes[i].clone(newId));
        }
        
        return clonedNode;
    }
});