
// @source core/tree/WebServiceTreeLoader.js

Ext.NetServiceTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
    // private override
    processResponse : function (response, node, callback) {
        var json,
            root;
        
        if (this.json) {        
            root = Ext.decode(response.responseText);
            json = root.d || root;
        } else {
            var xmlData = response.responseXML;
            
            root = xmlData.documentElement || xmlData;                
            json = Ext.DomQuery.selectValue("json", root, "");        
        }
        

        try {
            var o = Ext.isString(json) ? eval("(" + json + ")") : json,
                i = 0,
                len;
            
            node.beginUpdate();
            
            for (i, len = o.length; i < len; i++) {
                var n = this.createNode(o[i]);

                if (n) {
                    node.appendChild(n);
                }
            }
            
            node.endUpdate();
            
            if (typeof callback === "function") {
                callback(this, node);
            }
        } catch (e) {
            this.handleFailure(response);
        }
    }
});