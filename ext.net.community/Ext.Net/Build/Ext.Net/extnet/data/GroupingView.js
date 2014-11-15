
// @source data/GroupingView.js

Ext.grid.GroupingView.override({
    onRemove : function (ds, record, index, isUpdate) {
        Ext.grid.GroupingView.superclass.onRemove.apply(this, arguments);
        
        var g = document.getElementById(Ext.util.Format.htmlDecode(record._groupId));
        
        if (g && g.childNodes[1].childNodes.length < 1) {
            Ext.removeNode(g);
        }
        
        this.applyEmptyText();
    },
    
    getRows : function () {
        if (!this.canGroup()) {
            return Ext.grid.GroupingView.superclass.getRows.call(this);
        }
        
        var r = [],
            g, 
            gs = this.getGroups(),
            i = 0,
            len;
        
        for (i, len = gs.length; i < len; i++) {
            if (gs[i].childNodes.length > 1) {
                g = gs[i].childNodes[1].childNodes;
                
                var j,
                    jlen;

                for (j = 0, jlen = g.length; j < jlen; j++) {
                    r[r.length] = g[j];
                }
            }
        }
        
        return r;
    },
    
    getGroupRecords : function (groupValue) {
        var gid = this.getGroupId(groupValue);
        
        if (gid) {
            var re = new RegExp(RegExp.escape(gid)),
                records = this.grid.store.queryBy(function (record) {
                    return record._groupId.match(re);
                });
                
            return records ? records.items : [];
        }
        
        return [];
    },
    
    // remove after ExtJS 3.3.0 release
    renderUI : function () {
        return Ext.grid.GroupingView.superclass.renderUI.call(this);
    }
});