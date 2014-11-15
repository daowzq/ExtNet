
// @source data/CheckColumn.js

Ext.grid.CheckColumn = function (config) {
    Ext.apply(this, config);
    
    if (!this.id) {
        this.id = Ext.id();
    }
    
    this.renderer = this.renderer.createDelegate(this);
};

Ext.grid.CheckColumn.prototype = {
    init : function (grid) {
        this.grid = grid;
        
        var view = grid.getView();
        
        if (view.mainBody) {
            view.mainBody.on("mousedown", this.onMouseDown, this);
        } else {
            this.grid.on("render", function () {            
                this.grid.getView().mainBody.on("mousedown", this.onMouseDown, this);
            }, this);
        }       
    },

    onMouseDown : function (e, t) {
        if (this.editable && t.className && Ext.fly(t).hasClass("x-grid3-cc-" + this.dataIndex)) {
            e.stopEvent();
            
            var rIndex = this.grid.getView().findRowIndex(t),
                dataIndex = this.dataIndex,
                record = this.grid.store.getAt(rIndex);
            
            var ev = {
                grid   : this.grid,
                record : record,
                field  : this.dataIndex,
                value  : record.data[this.dataIndex],
                row    : rIndex,
                column : this.grid.getColumnModel().findColumnIndex(this.dataIndex),
                cancel : false
            };

            if (this.grid.fireEvent("beforeedit", ev) === false || ev.cancel === true) {
                return;
            }  
                      
            ev.originalValue = ev.value;
            ev.value = !record.data[this.dataIndex];
            
            if (this.grid.fireEvent("validateedit", ev) === false || ev.cancel === true) {
                return;
            } 
            
            if (this.singleSelect) {
                this.grid.store.each(function (record, i) {
                    var value = (i === rIndex);

                    if (value !== record.get(dataIndex)) {
                        record.set(dataIndex, value);
                    }
                });
            } else {
                record.set(this.dataIndex, !record.data[this.dataIndex]);
            }
            
            this.grid.fireEvent("afteredit", ev);            
        }
    },

    renderer : function (v, p, record) {
        p.css += " x-grid3-check-col-td";
        return '<div class="x-grid3-check-col' + (v ? "-on" : "") + " x-grid3-cc-" + this.dataIndex + '">&#160;</div>';
    },
    
    destroy : function () {
        if (this.grid) {
            this.grid.getView().mainBody.un("mousedown", this.onMouseDown, this);
        }
    },
    
    getCellEditor : Ext.emptyFn
};

Ext.grid.Column.types.checkcolumn = Ext.grid.CheckColumn;