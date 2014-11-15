
// @source core/tree/TreeEditor.js

Ext.net.TreeEditor = function (config) {
    Ext.net.TreeEditor.superclass.constructor.call(this, config.tree, {}, config);
};

Ext.extend(Ext.net.TreeEditor, Ext.tree.TreeEditor, {
    autoEdit : true,
    
    initEditor : function (tree) {
        if (this.autoEdit) {
            this.autoEdit = false;
            this.setAutoEdit(true);
        }
        this.on("complete", this.updateNode, this);
        this.on("beforestartedit", this.fitToTree, this);
        this.on("startedit", this.bindScroll, this, { delay : 10 });
        this.on("specialkey", this.onSpecialKey, this);
    },
    
    setAutoEdit : function (autoEdit) {
        if (autoEdit && !this.autoEdit) {
            this.tree.on("beforeclick", this.beforeNodeClick, this);
            this.tree.on("dblclick", this.onNodeDblClick, this);
            this.autoEdit = autoEdit;
            return;
        }
        
        if (!autoEdit && this.autoEdit) {
            this.tree.un("beforeclick", this.beforeNodeClick, this);
            this.tree.un("dblclick", this.onNodeDblClick, this);
            this.autoEdit = autoEdit;
            return;
        }
    },
    
    beforeNodeClick : function (node, e, defer) {
        clearTimeout(this.autoEditTimer);
        
        if (this.tree.getSelectionModel().isSelected(node)) {
            if (this.filter) {
                if (((this.filter.attribute === "text" || this.filter.attribute === "id") ? node[this.filter.attribute] : node.attributes[this.filter.attribute]) !== this.filter.value) {
                    return;
                }                
            }
            
            if (!Ext.isEmpty(this.tree.activeEditor, false) && this.tree.activeEditor !== this.id) {
                return;
            }
        
            Ext.each(this.tree.editors, function (editor) {
                editor.completeEdit();
            }, this);
        
            return this.triggerEdit(node, defer);
        }
    }
});

Ext.reg("treeeditor", Ext.net.TreeEditor);