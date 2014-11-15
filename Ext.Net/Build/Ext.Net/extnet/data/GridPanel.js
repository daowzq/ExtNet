
// @source data/GridPanel.js

Ext.net.GridPanel = function (config) {
    this.selectedIds = {};
    this.memoryIDField = "id";

    //Ext.apply(this, config);
    this.addEvents("editcompleted", "command", "groupcommand");
    Ext.net.GridPanel.superclass.constructor.call(this, config);
    this.initSelection();    
};

Ext.extend(Ext.net.GridPanel, Ext.grid.EditorGridPanel, {
    clearEditorFilter     : true,
    selectionSavingBuffer : 0,

    getFilterPlugin : function () {
        if (this.plugins && Ext.isArray(this.plugins)) {
            var i = 0;

            for (i; i < this.plugins.length; i++) {
                if (this.plugins[i].isGridFiltersPlugin) {
                    return this.plugins[i];
                }
            }
        } else {
            if (this.plugins && this.plugins.isGridFiltersPlugin) {
                return this.plugins;
            }
        }
    },

    getRowEditor : function () {
        if (this.plugins && Ext.isArray(this.plugins)) {
            var i = 0;

            for (i; i < this.plugins.length; i++) {
                if (this.plugins[i].isRowEditor) {
                    return this.plugins[i];
                }
            }
        } else {
            if (this.plugins && this.plugins.isRowEditor) {
                return this.plugins;
            }
        }
    },

    getRowExpander : function () {
        if (this.plugins && Ext.isArray(this.plugins)) {
            var i = 0;

            for (i; i < this.plugins.length; i++) {
                if (this.plugins[i].id === "expander") {
                    return this.plugins[i];
                }
            }
        } else {
            if (this.plugins && this.plugins.id === "expander") {
                return this.plugins;
            }
        }
    },

    doSelection : function () {
        var data = this.selModel.selectedData,
            silent = true;

        if (!Ext.isEmpty(this.fireSelectOnLoad)) {
            silent = !this.fireSelectOnLoad;
        }

        if (!Ext.isEmpty(data)) {
            if (silent) {
                this.suspendEvents();
                this.selModel.suspendEvents();
            }

            if (this.selModel.select) {
                if (!Ext.isEmpty(data.recordID) && !Ext.isEmpty(data.name)) {
                    var rowIndex = this.store.indexOfId(data.recordID),
                        colIndex = this.getColumnModel().findColumnIndex(data.name);

                    if (rowIndex > -1 && colIndex > -1) {
                        this.selModel.select(rowIndex, colIndex);
                    }
                } else if (!Ext.isEmpty(data.rowIndex) && !Ext.isEmpty(data.colIndex)) {
                    this.selModel.select(data.rowIndex, data.colIndex);
                }

                if (silent) {
                    this.updateCellSelection();
                }
            } else if (this.selModel.selectRow && data.length > 0) {
                var records = [],
                    record,
                    i = 0;

                for (i; i < data.length; i++) {
                    if (!Ext.isEmpty(data[i].recordID)) {
                        record = this.store.getById(data[i].recordID);

                        if (this.selectionMemory) {
                            var idx = data[i].rowIndex || -1;

                            if (!Ext.isEmpty(record)) {
                                idx = this.store.indexOfId(record.id);
                                idx = this.getAbsoluteIndex(idx);
                            }

                            this.onMemorySelectId(null, idx, data[i].recordID);
                        }
                    } else if (!Ext.isEmpty(data[i].rowIndex)) {
                        record = this.store.getAt(data[i].rowIndex);

                        if (this.selectionMemory && !Ext.isEmpty(record)) {
                            this.onMemorySelectId(null, data[i].rowIndex, record.id);
                        }
                    }

                    if (!Ext.isEmpty(record)) {
                        records.push(record);
                    }
                }
                this.selModel.selectRecords(records);

                if (silent) {
                    this.updateSelectedRows();
                }
            }

            if (silent) {
                this.resumeEvents();
                this.selModel.resumeEvents();
            }
        }
    },

    updateSelectedRows : function () {
        var records = [],
            id;

        if (this.selectionMemory) {
            for (id in this.selectedIds) {
                records.push({ RecordID: this.selectedIds[id].id, RowIndex: this.selectedIds[id].index });
            }
        } else {
            var selectedRecords = this.selModel.getSelections(),
                i = 0;

            for (i; i < selectedRecords.length; i++) {
                records.push({ RecordID: selectedRecords[i].id, RowIndex: this.store.indexOfId(selectedRecords[i].id) });
            }
        }

        this.hField.setValue(Ext.encode(records));
    },

    updateCellSelection : function (sm, selection) {
        if (selection === null) {
            this.hField.setValue("");
        }
    },

    cellSelect : function (sm, rowIndex, colIndex) {
        var r = this.store.getAt(rowIndex),
            selection = {
                record: r,
                cell: [rowIndex, colIndex]
            },
            name = this.getColumnModel().getDataIndex(selection.cell[1]),
            value = selection.record.get(name),
            id = selection.record.id || "";

        this.hField.setValue(Ext.encode({ RecordID: id, Name: name, SubmittedValue: value, RowIndex: selection.cell[0], ColIndex: selection.cell[1] }));
    },

    selectionMemory: true,

    //private
    removeOrphanColumnPlugins : function (column) {
        var p,
            i = 0;

        while (i < this.plugins.length) {
            p = this.plugins[i];

            if (p.isColumnPlugin) {
                if (this.getColumnModel().config.indexOf(p) === -1) {
                    this.plugins.remove(p);

                    if (p.destroy) {
                        p.destroy();
                    }
                } else {
                    i++;
                }
            } else {
                i++;
            }
        }
    },

    addColumnPlugins : function (plugins, init) {
        if (Ext.isArray(plugins)) {
            var i = 0;

            for (i; i < plugins.length; i++) {

                this.plugins.push(plugins[i]);

                if (init && plugins[i].init) {
                    plugins[i].init(this);
                }
            }
        } else {
            this.plugins.push(plugins);

            if (init && plugins.init) {
                plugins.init(this);
            }
        }
    },

    initColumnPlugins : function (plugins, init) {
        var cp = [],
            p,
            i = 0;

        this.initGridPlugins();

        if (init) {
            this.removeOrphanColumnPlugins();
        }

        for (i; i < plugins.length; i++) {
            p = this.getColumnModel().config[plugins[i]];
            p.isColumnPlugin = true;
            cp.push(p);
        }
        this.addColumnPlugins(cp, init);
    },

    initGridPlugins : function () {
        if (Ext.isEmpty(this.plugins)) {
            this.plugins = [];
        } else if (!Ext.isArray(this.plugins)) {
            this.plugins = [this.plugins];
        }
    },

    initSelectionData : function () {
        if (this.store) {
            if (this.store.getCount() > 0) {
                this.doSelection();
            } else {
                this.store.on("load", this.doSelection, this, { single: true });
            }
        }
    },

    initComponent : function () {
        Ext.net.GridPanel.superclass.initComponent.call(this);

        this.initGridPlugins();

        if (this.columnPlugins) {
            this.initColumnPlugins(this.columnPlugins, false);
        }

        if (this.getView().headerGroupRows) {
            this.plugins.push(new Ext.ux.grid.ColumnHeaderGroup({ rows: this.getView().headerGroupRows }));
        }

        var cm = this.getColumnModel(),
            j = 0;

        for (j; j < cm.config.length; j++) {
            var column = cm.config[j];

            if (column.commands) {
                this.addColumnPlugins([new Ext.net.CellCommands()]);
                break;
            }
        }

        if (this.selectionMemory) {
            this.selModel.on("rowselect", this.onMemorySelect, this);
            this.selModel.on("rowdeselect", this.onMemoryDeselect, this);
            this.store.on("remove", this.onStoreRemove, this);
            this.getView().on("refresh", this.memoryReConfigure, this);
        }

        this.on("viewready", this.initSelectionData, this);

        if (!this.record && this.store) {
            this.record = this.store.recordType;
        }

        if (this.disableSelection) {
            if (this.selModel.select) {
                this.selModel.select = Ext.emptyFn;
            } else if (this.selModel.selectRow) {
                this.selModel.selectRow = Ext.emptyFn;
            }
        }

        if (this.getView().headerRows) {
            var rowIndex = 0;

            for (rowIndex; rowIndex < this.view.headerRows.length; rowIndex++) {
                var cols = this.view.headerRows[rowIndex].columns,
                    colIndex = 0;

                for (colIndex; colIndex < cols.length; colIndex++) {
                    var col = cols[colIndex];

                    if (Ext.isEmpty(col.component)) {
                        continue;
                    }

                    if (Ext.isArray(col.component) && col.component.length > 0) {
                        col.component = col.component[0];
                    }

                    col.component = col.component.render ? col.component : Ext.ComponentMgr.create(col.component, "panel");
                }
            }

            this.on("resize", this.syncHeaders, this);
            this.on("columnresize", this.syncHeaders, this);
            this.colModel.on("hiddenchange", this.onHeaderRowHiddenChange, this);

            Ext.apply(this.getView(), {
                onColumnMove : function (cm, oldIndex, newIndex) {
                    var rowIndex = 0;

                    for (rowIndex; rowIndex < this.headerRows.length; rowIndex++) {
                        var cols = this.headerRows[rowIndex].columns,
                            c = cols[oldIndex];
                        cols.splice(oldIndex, 1);
                        cols.splice(newIndex, 0, c);
                    }
                    this.constructor.prototype.onColumnMove.call(this, cm, oldIndex, newIndex);
                },

                updateHeaders : function () {
                    var col, div;

                    if (this.headerControlsInsideGrid) {
                        var el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody(),
                            ce,
                            i = 0;

                        for (i; i < this.headerRows.length; i++) {
                            var c1 = this.headerRows[i].columns,
                                j = 0;

                            for (j; j < c1.length; j++) {
                                col = c1[j];

                                if (col.component) {
                                    ce = Ext.fly(col.component.getPositionEl());
                                } else if (!Ext.isEmpty(col.target)) {
                                    var p1 = Ext.getCmp(col.target.id || "");

                                    if (!Ext.isEmpty(p1)) {
                                        ce = p1.getPositionEl();
                                    } else {
                                        ce = col.target;
                                    }
                                } else {
                                    continue;
                                }

                                ce.addClass("x-hidden");
                                el.dom.appendChild(ce.dom);
                            }
                        }

                        this.headerControlsInsideGrid = false;
                    }

                    this.constructor.prototype.updateHeaders.call(this);

                    if (this.headerRows) {
                        var ii = 0;

                        for (ii; ii < this.headerRows.length; ii++) {
                            var c2 = this.headerRows[ii].columns,
                                tr = this.mainHd.child("tr.x-grid3-hd-row-r" + ii),
                                jj = 0;

                            for (jj; jj < c2.length; jj++) {
                                col = c2[jj];

                                if (!Ext.isEmpty(col.component)) {
                                    div = Ext.fly(tr.dom.cells[jj]).child("div.x-grid3-hd-inner");

                                    if (col.component.rendered) {
                                        div.appendChild(col.component.getPositionEl());
                                        col.component.getPositionEl().removeClass("x-hidden");
                                    } else {
                                        col.component.render(div);
                                    }
                                } else if (!Ext.isEmpty(col.target)) {
                                    var p2 = Ext.getCmp(col.target.id || "");

                                    div = Ext.fly(tr.dom.cells[jj]).child("div.x-grid3-hd-inner");

                                    if (!Ext.isEmpty(p2)) {
                                        div.dom.appendChild(p2.getPositionEl().dom);
                                        p2.getPositionEl().removeClass("x-hidden");
                                    } else {
                                        div.dom.appendChild(col.target.dom);
                                        col.target.removeClass("x-hidden");
                                    }
                                }
                            }
                        }

                        this.grid.syncHeaders.defer(100, this.grid);

                        var cm = this.grid.getColumnModel(),
                            k = 0;

                        for (k; k < cm.columns.length; k++) {
                            if (cm.isHidden(k)) {
                                this.grid.onHeaderRowHiddenChange(cm, k, true);
                            }
                        }

                        this.headerControlsInsideGrid = true;
                    }
                }
            });
        }

        if (this.clearEditorFilter) {
            this.on("beforeedit", function (e) {
                var ed = this.getColumnModel().config[e.column].editor;

                if (!Ext.isEmpty(ed) && ed.field && ed.field.store && ed.field.store.clearFilter) {
                    ed.field.store.clearFilter();
                }
            }, this);
        }
    },

    /*Selection Memory*/

    clearMemory : function () {
        delete this.selModel.selectedData;
        this.selectedIds = {};
        this.hField.setValue("");
    },

    memoryReConfigure : function () {
        this.store.on("clear", this.onMemoryClear, this);
        this.store.on("datachanged", this.memoryRestoreState, this);
    },

    onMemorySelect : function (sm, idx, rec) {
        if (this.getSelectionModel().singleSelect) {
            this.clearMemory();
        }

        var id = this.getRecId(rec),
            absIndex = this.getAbsoluteIndex(idx);

        this.onMemorySelectId(sm, absIndex, id);
    },

    onMemorySelectId : function (sm, index, id) {
        var obj = { 
            id    : id, 
            index : index 
        };
        
        this.selectedIds[id] = obj;
    },

    getPagingToolbar : function () {
        var bar = this.getBottomToolbar();

        if (bar && bar.getPageData) {
            return bar;
        }

        bar = this.getTopToolbar();

        if (bar && bar.getPageData) {
            return bar;
        }

        return null;
    },

    getAbsoluteIndex : function (pageIndex) {
        var absIndex = pageIndex,
            bar = this.getPagingToolbar();

        if (!Ext.isEmpty(bar)) {
            absIndex = ((bar.getPageData().activePage - 1) * bar.pageSize) + pageIndex;
        }

        return absIndex;
    },

    onMemoryDeselect : function (sm, idx, rec) {
        delete this.selectedIds[this.getRecId(rec)];
    },

    onStoreRemove : function (store, rec, idx) {
        this.onMemoryDeselect(null, idx, rec);
    },

    memoryRestoreState : function () {
        if (this.store !== null) {
            var i = 0,
                sel = [],
                all = true,
                silent = true;

            if (this.selModel.isLocked()) {
                this.wasLocked = true;
                this.selModel.unlock();
            }

            this.store.each(function (rec) {
                var id = this.getRecId(rec);

                if (!Ext.isEmpty(this.selectedIds[id])) {
                    sel.push(i);
                } else {
                    all = false;
                }

                ++i;
            }, this);

            if (!Ext.isEmpty(this.fireSelectOnLoad)) {
                silent = !this.fireSelectOnLoad;
            }

            if (sel.length > 0) {
                if (silent) {
                    this.suspendEvents();
                    this.selModel.suspendEvents();
                }

                this.selModel.selectRows(sel);

                if (silent) {
                    this.resumeEvents();
                    this.selModel.resumeEvents();
                }
            }

            if (this.selModel.checkHeader) {
                if (all) {
                    this.selModel.checkHeader();
                } else {
                    this.selModel.uncheckHeader();
                }
            }

            if (this.wasLocked) {
                this.selModel.lock();
            }
        }
    },

    getRecId : function (rec) {
        var id = rec.get(this.memoryIDField);

        if (Ext.isEmpty(id)) {
            id = rec.id;
        }

        return id;
    },

    onMemoryClear : function () {
        this.selectedIds = {};
    },

    /*------------------------------*/

    getSelectionModelField : function () {
        if (!this.selectionModelField) {
            this.selectionModelField = new Ext.form.Hidden({ id: this.id + "_SM", name: this.id + "_SM" });
            this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectionModelField);
        }

        return this.selectionModelField;
    },

    initSelection : function () {
        this.hField = this.getSelectionModelField();

        if (this.selModel.select) {
            this.selModel.on("cellselect", this.cellSelect, this);
            this.selModel.on("selectionchange", this.updateCellSelection, this);
        } else if (this.selModel.selectRow) {
            this.selModel.on("rowselect", this.updateSelectedRows, this, { buffer: this.selectionSavingBuffer });
            this.selModel.on("rowdeselect", this.updateSelectedRows, this, { buffer: this.selectionSavingBuffer });
            this.store.on("remove", this.updateSelectedRows, this, { buffer: this.selectionSavingBuffer });
        }
    },

    getKeyMap : function () {
        if (!this.keyMap) {
            this.keyMap = new Ext.KeyMap(this.view.el, this.keys);
        }

        return this.keyMap;
    },

    onRender : function (ct, position) {
        Ext.net.GridPanel.superclass.onRender.call(this, ct, position);

        this.getSelectionModelField().render(this.el.parent() || this.el);

        if (this.menu instanceof Ext.menu.Menu) {
            this.on("contextmenu", this.showContextMenu);
            this.on("rowcontextmenu", this.onRowContextMenu);
        }

        this.relayEvents(this.selModel, ["rowselect", "rowdeselect"]);
        this.relayEvents(this.store, ["commitdone", "commitfailed"]);
    },

    onHeaderRowHiddenChange : function (cm, colIndex, hidden) {
        var display = hidden ? "none" : "",
            rowIndex = 0;

        for (rowIndex; rowIndex < this.view.headerRows.length; rowIndex++) {
            var tr = this.view.mainHd.child("tr.x-grid3-hd-row-r" + rowIndex);

            if (tr && tr.dom.cells.length > colIndex) {
                Ext.fly(tr.dom.cells[colIndex]).dom.style.display = display;
            }
        }

        this.syncHeaders.defer(100, this);
    },

    syncHeaders : function () {
        var rowIndex = 0;

        for (rowIndex; rowIndex < this.view.headerRows.length; rowIndex++) {
            var cols = this.view.headerRows[rowIndex].columns,
                colIndex = 0;

            for (colIndex; colIndex < cols.length; colIndex++) {
                var col = cols[colIndex],
                    cmp;

                if (!Ext.isEmpty(col.component)) {
                    cmp = col.component;
                } else if (!Ext.isEmpty(col.target)) {
                    cmp = Ext.getCmp(col.target.id || "");
                } else {
                    continue;
                }

                if (col.autoWidth !== false) {
                    var autoCorrection = Ext.isEmpty(col.correction) ? 3 : col.correction;

                    if (Ext.isIE && !Ext.isEmpty(cmp)) {
                        autoCorrection -= 1;
                    }

                    if (!Ext.isEmpty(cmp) && cmp.setSize) {
                        cmp.setSize(this.getColumnModel().getColumnWidth(colIndex) - autoCorrection);
                    } else if (col.target) {
                        col.target.setSize(this.getColumnModel().getColumnWidth(colIndex) - autoCorrection, col.target.getSize().height);
                    }
                }
            }
        }
    },

    onRowContextMenu : function (grid, rowIndex, e) {
        e.stopEvent();

        if (!this.selModel.isSelected(rowIndex)) {
            this.selModel.selectRow(rowIndex);
            this.fireEvent("rowclick", this, rowIndex, e);
        }

        this.showContextMenu(e, rowIndex);
    },

    showContextMenu : function (e, rowIndex) {
        e.stopEvent();

        if (rowIndex === undefined) {
            this.selModel.clearSelections();
        }

        if (this.menu) {
            this.menu.showAt(e.getXY());
        }
    },

    reload : function (options) {
        this.store.reload(options);
    },

    isDirty : function () {
        if (this.store.modified.length > 0 || this.store.deleted.length > 0) {
            return true;
        }

        return false;
    },

    hasSelection : function () {
        return this.selModel.hasSelection();
    },

    addRecord : function (values, commit, clearFilter) {
        var rowIndex = this.store.data.length;

        this.insertRecord(rowIndex, values, commit, clearFilter);
        return rowIndex;
    },

    addRecordEx : function (values, commit, clearFilter) {
        var rowIndex = this.store.data.length,
            record = this.insertRecord(rowIndex, values, commit, clearFilter);

        return { index: rowIndex, record: record };
    },

    insertRecord : function (rowIndex, values, commit, clearFilter) {
        if (arguments.length === 0) {
            this.insertRecord(0, {});
            this.getView().focusRow(0);
            this.startEditing(0, 0);

            return;
        }

        return this.store.insertRecord(rowIndex, values, false, commit, clearFilter);
    },

    deleteRecord : function (record) {
        this.store.remove(record);
    },

    deleteSelected : function () {
        var s = this.selModel.getSelections(),
            i;

        for (i = 0, len = s.length; i < len; i++) {
            this.deleteRecord(s[i]);
        }
    },

    clear : function () {
        this.store.removeAll();
    },

    saveMask: false,

    initEvents : function () {
        Ext.net.GridPanel.superclass.initEvents.call(this);

        if (this.saveMask) {
            this.saveMask = new Ext.net.SaveMask(this.bwrap,
                    Ext.apply({ writeStore: this.store }, this.saveMask));
        }
    },

    reconfigure : function (store, colModel) {
        Ext.net.GridPanel.superclass.reconfigure.call(this, store, colModel);

        if (this.saveMask) {
            this.saveMask.destroy();
            this.saveMask = new Ext.net.SaveMask(this.bwrap,
                    Ext.apply({ writeStore: store }, this.initialConfig.saveMask));
        }
    },

    onDestroy : function () {
        if (this.rendered) {
            if (this.saveMask) {
                this.saveMask.destroy();
            }
        }

        Ext.net.GridPanel.superclass.onDestroy.call(this);
    },

    insertColumn : function (index, newCol) {
        var c = this.getColumnModel().config,
            cfg;

        if (index >= 0) {
            c.splice(index, 0, newCol);
        }

        cfg = Ext.apply({ columns: c }, { events: this.getColumnModel().events, directEvents: this.getColumnModel().directEvents, defaultSortable: this.getColumnModel().defaultSortable });

        this.reconfigure(this.store, new Ext.grid.ColumnModel(cfg));
    },

    addColumn : function (newCol) {
        var c = this.getColumnModel().config,
            cfg;

        c.push(newCol);

        cfg = Ext.apply({ columns: c }, { events: this.getColumnModel().events, directEvents: this.getColumnModel().directEvents, defaultSortable: this.getColumnModel().defaultSortable });

        this.reconfigure(this.store, new Ext.grid.ColumnModel(cfg));
    },

    removeColumn : function (index) {
        var c = this.getColumnModel().config,
            cfg;

        if (index >= 0) {
            c.splice(index, 1);
        }

        cfg = Ext.apply({ columns: c }, { events: this.getColumnModel().events, directEvents: this.getColumnModel().directEvents, defaultSortable: this.getColumnModel().defaultSortable });

        this.reconfigure(this.store, new Ext.grid.ColumnModel(cfg));
    },

    reconfigureColumns : function (cfg) {
        var oldCM = this.getColumnModel(),
            newCM,
            specialCols = ["checker", "expander"],
            i;

        cfg = Ext.apply(cfg.columns ? cfg : { columns: cfg }, { events: oldCM.events, directEvents: oldCM.directEvents, defaultSortable: oldCM.defaultSortable });

        Ext.each(cfg.columns, function (col) {
            if (col.id === "expander") {
                specialCols.remove("expander");
                return false;
            }
        });
        
        for (i = 0; i < specialCols.length; i++) {
            var specCol = oldCM.getColumnById(specialCols[i]);

            if (!Ext.isEmpty(specCol)) {
                var index = oldCM.getIndexById(specialCols[i]);

                if (index !== 0 && index >= cfg.columns.length) {
                    index = cfg.columns.length - 1;
                }

                cfg.columns.splice(index, 0, specCol);
            }
        }
        newCM = oldCM.isLocked ? new Ext.ux.grid.LockingColumnModel(cfg) : new Ext.grid.ColumnModel(cfg);
        this.reconfigure(this.store, newCM);
    },

    load : function (options) {
        this.store.load(options);
    },

    save : function (options) {
        if (options && options.visibleOnly) {
            options.grid = this;
        }

        this.stopEditing(false);

        this.store.save(options);
    },

    // config :
    //    - selectedOnly
    //    - visibleOnly
    //    - dirtyCellsOnly
    //    - dirtyRowsOnly
    //    - currentPageOnly
    //    - excludeId
    //    - filterRecord - function (record) - return false to exclude the record
    //    - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    getRowsValues : function (config) {
        config = config || {};

        this.stopEditing(false);

        var records = (config.selectedOnly ? this.selModel.getSelections() : config.currentPageOnly ? this.store.getRange() : this.store.getAllRange()) || [],
            values = [],
            record,
            i;

        if (this.selectionMemory && config.selectedOnly && !config.currentPageOnly && this.store.isPagingStore()) {
            records = [];

            var id;

            for (id in this.selectedIds) {
                record = this.store.getById(this.selectedIds[id].id);

                if (!Ext.isEmpty(record)) {
                    records.push(record);
                }
            }
        }

        for (i = 0; i < records.length; i++) {
            var obj = {}, dataR;

            if (this.store.metaId()) {
                obj[this.store.metaId()] = config.excludeId === true ? undefined : records[i].id;
            }

            dataR = Ext.apply(obj, records[i].data);
            config.grid = this;
            dataR = this.store.prepareRecord(dataR, records[i], config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    serialize : function (config) {
        return Ext.encode(this.getRowsValues(config));
    },

    // config:
    //   - selectedOnly,
    //   - visibleOnly
    //   - dirtyCellsOnly
    //   - dirtyRowsOnly
    //   - currentPageOnly
    //   - excludeId
    //   - encode
    //    - filterRecord - function (record) - return false to exclude the record
    //    - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    submitData : function (config) {
        config = config || {};
        config.selectedOnly = config.selectedOnly || false;
        encode = config.encode;

        var values = this.getRowsValues(config);

        if (!values || values.length === 0) {
            return false;
        }

        if (encode) {
            values = Ext.util.Format.htmlEncode(values);
            delete config.encode;
        }

        this.store.submitData(values, config);
    },

    onEditComplete : function (ed, value, startValue) {
        Ext.net.GridPanel.superclass.onEditComplete.call(this, ed, value, startValue);

        ed.field.reset();

        if (!ed.record.dirty && ed.record.firstEdit) {
            this.store.remove(ed.record);
        }

        delete ed.record.firstEdit;
        this.fireEvent("editcompleted", ed, value, startValue);
    },

    stopEditing : function (cancel) {
        var ae = this.activeEditor;

        Ext.net.GridPanel.superclass.stopEditing.call(this, cancel);

        if (ae) {
            ae.field.reset();
        }
    },

    startEditing : function (row, col) {
        this.stopEditing();

        if (this.colModel.isCellEditable(col, row)) {
            this.view.ensureVisible(row, col, true);
            var r = this.store.getAt(row),
                field = this.colModel.getDataIndex(col),
                e = {
                    grid   : this,
                    record : r,
                    field  : field,
                    value  : r.data[field],
                    row    : row,
                    column : col,
                    cancel : false
                };

            if (this.fireEvent("beforeedit", e) !== false && !e.cancel) {
                this.editing = true;
                var ed = this.colModel.getCellEditor(col, row);

                if (!ed) {
                    return;
                }

                if (!ed.rendered) {
                    ed.parentEl = this.view.getEditorParent(ed);
                    ed.on({
                        scope  : this,
                        render : {
                            fn : function (c) {
                                c.field.focus(false, true);
                            },
                            single : true,
                            scope  : this
                        },
                        specialkey : function (field, e) {
                            this.getSelectionModel().onEditorKey(field, e);
                        },
                        complete   : this.onEditComplete,
                        canceledit : this.stopEditing.createDelegate(this, [true])
                    });
                }

                Ext.apply(ed, {
                    row    : row,
                    col    : col,
                    record : r
                });

                this.lastEdit = {
                    row : row,
                    col : col
                };

                this.activeEditor = ed;

                // Set the selectSameEditor flag if we are reusing the same editor again and
                // need to prevent the editor from firing onBlur on itself.
                ed.selectSameEditor = (this.activeEditor == this.lastActiveEditor);
                var v = this.preEditValue(r, field);
                ed.startEdit(this.view.getCell(row, col).firstChild, Ext.isDefined(v) ? v : "");

                // Clear the selectSameEditor flag
                (function () {
                    delete ed.selectSameEditor;
                }).defer(250); // IT IS OVERRIDEN (50 ms is too small for IE)
            }
        }
    }
});

Ext.reg("netgrid", Ext.net.GridPanel);