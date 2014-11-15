
// @source core/tree/TreeSorter.js

Ext.tree.TreeSorter.override({
    _sortFn : function (n1, n2) {
        var desc = this.dir && this.dir.toLowerCase() === "desc",
            prop = this.property || "text",
            sortType = this.sortType,
            folderSort = this.folderSort,
            caseSensitive = this.caseSensitive === true,
            leafAttr = this.leafAttr || "leaf",
            attr1 = n1.attributes,
            attr2 = n2.attributes;

        if (Ext.isString(sortType)) {
            sortType = Ext.data.SortTypes[sortType];
        }
            
        if (folderSort) {
            if (attr1[leafAttr] && !attr2[leafAttr]) {
                return 1;
            }
            
            if (!attr1[leafAttr] && attr2[leafAttr]) {
                return -1;
            }
        }
        var prop1 = attr1[prop],
            prop2 = attr2[prop],
            v1 = sortType ? sortType(prop1, n1) : (caseSensitive ? prop1 : (prop1.toUpperCase ? prop1.toUpperCase() : prop1)),
            v2 = sortType ? sortType(prop2, n2) : (caseSensitive ? prop2 : (prop2.toUpperCase ? prop2.toUpperCase() : prop2));
            
        if (v1 < v2) {
            return desc ? 1 : -1;
        } else if (v1 > v2) {
            return desc ? -1 : 1;
        }
        
        return 0;
    },
    
    doSort : function (node) {
        if (this.fnDelegated !== true) {
            this._sortFn = this._sortFn.createDelegate(this);
            this.fnDelegated = true;        
        }
        
        node.sort(this._sortFn);
    }
});