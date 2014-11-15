
// @source data/TableGrid.js

Ext.grid.TableGrid = function (config) {
    config = config || {};
    
    Ext.apply(this, config);
    
    var cf = config.fields || [], ch = config.columns || [],
        i,
        h;

    if (config.table.isComposite) {
        if (config.table.elements.length > 0) {
            table = Ext.get(config.table.elements[0]);
        }
    } else {
        table = Ext.get(config.table);
    }

    var ct = table.insertSibling();
    
    if (!Ext.isEmpty(config.id)) {
        ct.id = config.id;
    }

    var fields = [], cols = [],
        headers = table.query("thead th");
        
    for (i = 0; i < headers.length; i++) {
        h = headers[i];
        var text = h.innerHTML,
            name = "tcol-" + i;

        fields.push(Ext.applyIf(cf[i] || {}, {
            name    : name,
            mapping : "td:nth(" + (i + 1) + ")/@innerHTML"
        }));

        cols.push(Ext.applyIf(ch[i] || {}, {
            "header"    : text,
            "dataIndex" : name,
            "width"     : h.offsetWidth,
            "tooltip"   : h.title,
            "sortable"  : true
        }));
    }

    var ds = new Ext.data.Store({
        reader : new Ext.data.XmlReader({
            record : "tbody tr"
        }, fields)
    });

    ds.loadData(table.dom);

    var cm = new Ext.grid.ColumnModel(cols);

    if (config.width || config.height) {
        ct.setSize(config.width || "auto", config.height || "auto");
    } else {
        ct.setWidth(table.getWidth());
    }

    if (config.remove !== false) {
        table.remove();
    }

    Ext.applyIf(this, {
        "ds"       : ds,
        "cm"       : cm,
        "sm"       : new Ext.grid.RowSelectionModel(),
        autoHeight : this.autoHeight,
        autoWidth  : false
    });
    
    Ext.grid.TableGrid.superclass.constructor.call(this, ct, {});
};

Ext.extend(Ext.grid.TableGrid, Ext.grid.GridPanel, {
    autoHeight : true
});

Ext.reg("tablegrid", Ext.grid.TableGrid);