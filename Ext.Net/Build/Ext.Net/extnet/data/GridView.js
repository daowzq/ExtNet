
// @source data/GridView.js

Ext.grid.GridView.prototype.initEvents = Ext.grid.GridView.prototype.initEvents.createSequence(function () {
    this.addEvents("afterRender", "beforerowupdate");
});

Ext.grid.GridView.prototype.afterRender = Ext.grid.GridView.prototype.afterRender.createSequence(function () {
    this.fireEvent("afterRender", this);
});

Ext.grid.GridView.override({
    getCell: function (row, col) {
        var tds = this.getRow(row).getElementsByTagName("td"),
            ind = -1,
            i = 0;

        if (tds) {
            for (i; i < tds.length; i++) {
                if (Ext.fly(tds[i]).hasClass("x-grid3-col x-grid3-cell")) {
                    ind++;

                    if (ind === col) {
                        return tds[i];
                    }
                }
            }
        }
        return tds[col];
    },

    getColumnData: function () {
        var cs = [], 
            cm = this.cm, 
            colCount = cm.getColumnCount(),
            i = 0;
        
        for (i; i < colCount; i++) {
            var name = cm.getDataIndex(i);

            cs[i] = {
                name     : (!Ext.isDefined(name) ? this.ds.fields.get(i).name : name),
                renderer : cm.getRenderer(i),
                scope    : cm.getRendererScope(i),
                id       : cm.getColumnId(i),
                style    : this.getColumnStyle(i)
            };
            
            if (cs[i].scope && !cs[i].scope.grid) {
                cs[i].scope.grid = this.grid;
            }
        }
        return cs;
    },
    
    onUpdate : function (store, record) {
        this.fireEvent("beforerowupdate", this, store.indexOf(record), record);
        this.refreshRow(record);
    }
});

Ext.grid.HeaderDragZone.override({
    onBeforeDrag : function (data, e) {        
        return !e.getTarget(".x-grid3-add-row", 50);
    }
});