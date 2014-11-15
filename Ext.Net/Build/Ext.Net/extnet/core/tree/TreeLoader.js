
// @source core/tree/TreeLoader.js

Ext.tree.TreeLoader.override({
    requestData : function (node, callback, scope) {
        if (this.fireEvent("beforeload", this, node, callback) !== false) {
            var o = {
                method   : this.requestMethod,
                url      : this.dataUrl || this.url,
                success  : this.handleResponse,
                failure  : this.handleFailure,
                scope    : this,
                timeout  : this.timeout || 30000,
                argument : { 
                    callback : callback, 
                    node     : node, 
                    scope    : scope 
                }
            };
            
            if (this.json) {            
                o.jsonData =  this.getParams(node);
            } else {
                o.params =  this.getParams(node);
            }
            
            this.transId = Ext.Ajax.request(o);
        } else {
            // if the load is cancelled, make sure we notify
            // the node that we are done
            this.runCallback(callback, scope || node, []);
        }
    },
    
    createNode : function (attr) {
        if (this.baseAttrs) {
            Ext.applyIf(attr, this.baseAttrs);
        }
        
        if (this.applyLoader !== false && !attr.loader) {
            attr.loader = this;
        }
        
        if (typeof attr.uiProvider === "string") {
            attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
        }

        var node;
        
        if (attr.nodeType) {
            node = new Ext.tree.TreePanel.nodeTypes[attr.nodeType](attr);
        } else {
            node = attr.leaf ?
                new Ext.tree.TreeNode(attr) :
                new Ext.tree.AsyncTreeNode(attr);
        }

        if (this.preloadChildren) {
            this.doPreload(node);
        }

        return node;
    }
});