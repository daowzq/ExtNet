
// @source data/RowExpander.js

Ext.grid.RowExpander = Ext.extend(Ext.util.Observable, {
    header        : "",
    width         : 20,
    sortable      : false,
    fixed         : true,
    menuDisabled  : true,
    dataIndex     : "",
    id            : "expander",
    lazyRender    : true,
    enableCaching : true,
    expandOnEnter : true,
    singleExpand  : false,
    hideable      : false,
    expandOnDblClick  : true,
    swallowBodyEvents : false,
    rowBodySelector   : "table.x-grid3-row-table > tbody > tr:nth(2) div.x-grid3-row-body",
    
    constructor: function (config) {
        Ext.apply(this, config);

        this.addEvents({
            beforeexpand   : true,
            expand         : true,
            beforecollapse : true,
            collapse       : true
        });

        Ext.grid.RowExpander.superclass.constructor.call(this);

        if (this.tpl) {
            if (typeof this.tpl === "string") {
                this.tpl = new Ext.Template(this.tpl);
            }
            
            this.tpl.compile();
        }
        
        if (this.component) {
            if (!this.component.rendered) {
                this.componentCfg = this.component;
                this.component = Ext.ComponentMgr.create(this.component, "panel");
            }            
        }

        this.state = {};
        this.bodyContent = {};
    },
    
    getExpanded : function () {
        var store = this.grid.store,
            expandedRecords = [];

        store.each(function (record, index) {
            if (this.state[record.id]) {
                expandedRecords.push({
                    record : record, 
                    index  : index
                });
            }
        }, this);
        
        return expandedRecords;
    },
    
    getRowClass : function (record, rowIndex, p, ds) {
        p.cols = p.cols - 1;
        var content = this.bodyContent[record.id];
        
        if (!content && !this.lazyRender) {
            content = this.getBodyContent(record, rowIndex);
        }
        
        if (content) {
            p.body = content;
        }
        
        return this.state[record.id] ? "x-grid3-row-expanded" : "x-grid3-row-collapsed";
    },

    init : function (grid) {
        this.grid = grid;

        var view = grid.getView();
        view.getRowClass = this.getRowClass.createDelegate(this);

        view.enableRowBody = true;


        grid.on("render", this.onRender, this);
        grid.on("destroy", this.onDestroy, this);
        
        this.grid.store.on("load", function () {
            this.bodyContent = {};
        }, this);
    },
    
    onRender : function () {
        var grid = this.grid;
        var mainBody = grid.getView().mainBody;
        mainBody.on("mousedown", this.onMouseDown, this, { delegate : ".x-grid3-row-expander" });
        
        if (this.expandOnEnter) {            
            this.keyNav = new Ext.KeyNav(this.grid.getGridEl(), {
                "enter" : this.onEnter,
                scope: this        
            });    
        }
        
        var view = this.grid.getView();
        
        if (this.expandOnDblClick) {
            grid.on("rowdblclick", this.onRowDblClick, this);
        }        
        
        if (this.swallowBodyEvents) {
            view.on("rowupdated", this.swallowRow, this);
            view.on("refresh", this.swallowRow, this);            
        }
               
        if (this.component) {            
            view.removeRow = view.removeRow.createInterceptor(this.moveComponent, this);
            view.refreshRow = view.refreshRow.createInterceptor(this.moveComponent, this);
            view.removeRows = view.removeRows.createInterceptor(this.moveComponent, this);            
            view.on("beforerefresh", this.moveComponent, this);
            view.on("rowupdated", this.restoreComponent, this);
            view.on("refresh", this.restoreComponent, this);            
        }
    },
    
    moveComponent: function () {
        if (!this.componentInsideGrid) {
            return;
        }
        
        var ce = Ext.fly(this.component.getEl()), el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
                    
        ce.addClass("x-hidden");
        
        el = el.dom;        
        el.appendChild(ce.dom);
        this.componentInsideGrid = false;
    },
    
    restoreComponent: function () {
        if (this.component.rendered === false) {
            return;
        }
        
        this.grid.store.each(function (record, i) {
            if (this.state[record.id]) {
                var row = this.grid.view.getRow(i),              
                    body = Ext.DomQuery.selectNode(this.rowBodySelector, row);                
                
                Ext.fly(body).appendChild(this.component.getEl());
                this.component.removeClass("x-hidden");
                this.componentInsideGrid = true;
                return false;
            }
        }, this);
    },
    
    swallowRow: function () {
        this.grid.store.each(function (record, i) {
            if (this.state[record.id]) {
                var row = this.grid.view.getRow(i),              
                    body = Ext.DomQuery.selectNode(this.rowBodySelector, row);                
                
                Ext.fly(body).swallowEvent(['click', 'mousedown', 'mouseup', 'dblclick'], true);
            }
        }, this);
    },
    
    onDestroy: function () {
        if (this.keyNav) {
            this.keyNav.disable();
            delete this.keyNav;
        }
        
        var mainBody = this.grid.getView().mainBody;
        if (mainBody) {
            mainBody.un('mousedown', this.onMouseDown, this);
        }
        
        if (this.tpl && this.tpl.destroy) {
            this.tpl.destroy();
        }
        
        this.purgeListeners();
    },
   
    onRowDblClick: function (grid, rowIdx, e) {
        this.toggleRow(rowIdx);
    },
    
    onEnter : function (e) {
        var g = this.grid,
            sm = g.getSelectionModel(),
            sels = sm.getSelections(),
            i,
            len;
        
        for (i = 0, len = sels.length; i < len; i++) {
            var rowIdx = g.getStore().indexOf(sels[i]);
            this.toggleRow(rowIdx);
        }
    },

    getBodyContent : function (record, index) {
        if (!this.enableCaching) {
            return this.tpl.apply(record.data);
        }
        
        var content = this.bodyContent[record.id];
        
        if (!content) {
            content = this.tpl.apply(record.data);
            this.bodyContent[record.id] = content;
        }
        
        return content;
    },

    onMouseDown : function (e, t) {
        e.stopEvent();
        var row = e.getTarget(".x-grid3-row");
        this.toggleRow(row);
    },

    renderer : function (v, p, record) {
        p.cellAttr = 'rowspan="2"';
        return '<div class="x-grid3-row-expander">&#160;</div>';
    },

    beforeExpand : function (record, body, rowIndex) {
        if (this.fireEvent("beforeexpand", this, record, body, rowIndex) !== false) {
            if (this.singleExpand || this.component) {
                this.collapseAll();
            }
            
            if (!this.component && this.tpl && this.lazyRender && !body.expanderRendered) {
                body.innerHTML = this.getBodyContent(record, rowIndex);
                body.expanderRendered = true;
            }

            return true;
        } else {
            return false;
        }
    },

    toggleRow : function (row) {
        if (typeof row === "number") {
            row = this.grid.view.getRow(row);
        }
        
        this[Ext.fly(row).hasClass("x-grid3-row-collapsed") ? "expandRow" : "collapseRow"](row);
    },
    
    expandAll : function () {
        if (this.singleExpand || this.component) {
            return;
        }
        
        var i = 0;

        for (i; i < this.grid.store.getCount(); i++) {
            this.expandRow(i);
        }
    },
    
    collapseAll : function () {
        var i = 0;

        for (i; i < this.grid.store.getCount(); i++) {
            this.collapseRow(i);
        }
        this.state = {};
    },

    expandRow : function (row) {
        if (typeof row === "number") {
            row = this.grid.view.getRow(row);
        }
        
        if (Ext.isEmpty(row) || !Ext.fly(row).hasClass("x-grid3-row-collapsed")) {
            return;
        }            
        
        var record = this.grid.store.getAt(row.rowIndex),
            body = Ext.DomQuery.selectNode(this.rowBodySelector, row);
        
        if (this.beforeExpand(record, body, row.rowIndex)) {
            this.state[record.id] = true;
            Ext.fly(row).replaceClass("x-grid3-row-collapsed", "x-grid3-row-expanded");
            
            if (this.swallowBodyEvents) {
                Ext.fly(body).swallowEvent(['click', 'mousedown', 'mouseup', 'dblclick'], true);
            }            
            
            if (this.component) {
                if (this.recreateComponent) {
                    this.component.destroy();
                    this.component = Ext.ComponentMgr.create(this.componentCfg, "panel");
                }
                
                if (this.component.rendered) {                    
                    Ext.fly(body).appendChild(this.component.getEl());
                } else {
                    this.component.render(body);
                }
                
                this.component.addClass("x-row-expander-control");
                this.component.removeClass("x-hidden");
                
                this.componentInsideGrid = true;
            }
            
            this.fireEvent("expand", this, record, body, row.rowIndex);
        }
    },

    collapseRow : function (row) {
        if (typeof row === "number") {
            row = this.grid.view.getRow(row);
        }
        
        if (Ext.isEmpty(row) || !Ext.fly(row).hasClass("x-grid3-row-expanded")) {
            return;
        } 
        
        var record = this.grid.store.getAt(row.rowIndex),
            body = Ext.DomQuery.selectNode(this.rowBodySelector, row);
        
        if (this.fireEvent("beforecollapse", this, record, body, row.rowIndex) !== false) {
            this.state[record.id] = false;
            Ext.fly(row).replaceClass("x-grid3-row-expanded", "x-grid3-row-collapsed");
            this.fireEvent("collapse", this, record, body, row.rowIndex);
        }
    },
    
    isCollapsed : function (row) {
        if (typeof row === "number") {
            row = this.grid.view.getRow(row);
        }

        return Ext.fly(row).hasClass("x-grid3-row-collapsed");
    },
    
    isExpanded : function (row) {
        if (typeof row === "number") {
            row = this.grid.view.getRow(row);
        }

        return Ext.fly(row).hasClass("x-grid3-row-expanded");
    }
});