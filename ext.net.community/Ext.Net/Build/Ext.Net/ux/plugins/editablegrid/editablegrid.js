Ext.ns('Ext.ux.grid');
Ext.ux.grid.EditableGrid = Ext.extend(Object, {
    init : function (grid) {        
        grid.onCellDblClick = Ext.emptyFn;
        grid.onAutoEditClick = Ext.emptyFn;
        
        Ext.apply(grid.getSelectionModel(), {
            onEditorKey : Ext.emptyFn,            
            handleKeyDown : Ext.emptyFn
        });
        
        Ext.apply(grid.getView(), {
            editors: [],
            editorPadding: 2,
            afterRenderUI : function () {
                this.editorFocus = {};
                this.constructor.prototype.afterRenderUI.call(this);
                this.el.addClass('x-grid-editing');
            },
            updateAllColumnWidths : function () {
                this.constructor.prototype.updateAllColumnWidths.call(this);
                var editors = this.editors,
                    rows = editors.length,
                    cols = this.cm.getColumnCount(),
                    col, row, ed, w = [];
                
                for (col = 0; col < cols; col++) {
                    w[col] = this.cm.getColumnWidth(col) - this.editorPadding;
                }

                for (row = 0; row < rows; row++) {
                    for (col = 0; col < cols; col++) {
                        ed = editors[row][col];

                        if (ed) {
                            ed.setWidth(w[col]);
                        }
                    }
                }
            },
            updateColumnWidth : function (col, width) {
                this.constructor.prototype.updateColumnWidth.call(this, col, width);

                var editors = this.editors,
                    rows = editors.length,
                    row, ed,
                    w = this.cm.getColumnWidth(col) - this.editorPadding;

                for (row = 0; row < rows; row++) {
                    ed = editors[row][col];

                    if (ed) {
                        ed.setWidth(w);
                    }
                }
            },
            afterRender : function () {
                this.constructor.prototype.afterRender.call(this);
                this.destroyAllEditors();
                this.renderEditors(0, this.ds.getCount() - 1);
            },

            insertRows : function (dm, firstRow, lastRow, isUpdate) {
                this.constructor.prototype.insertRows.call(this, dm, firstRow, lastRow, isUpdate);
                var last = dm.getCount() - 1;

                if (!isUpdate && firstRow === 0 && lastRow >= last) {
                    return;
                }
                
                this.renderEditors(firstRow, lastRow);
            },

            deleteRows : function (dm, firstRow, lastRow) {
                if (dm.getRowCount() >= 1) {
                    this.destroyEditors(firstRow, lastRow);
                }
                
                this.constructor.prototype.deleteRows.call(this, dm, firstRow, lastRow);
            },

            refreshRow : function (record) {
                var ds = this.ds, index;
                
                if (typeof record == 'number') {
                    index = record;
                    record = ds.getAt(index);
                
                    if (!record) {
                        return;
                    }
                } else {
                    index = ds.indexOf(record);
                
                    if (index < 0) {
                        return;
                    }
                }
                this.destroyEditors(index, index);
                this.constructor.prototype.refreshRow.call(this, record);
                this.renderEditors(index, index);
            },

            refresh : function (headersToo) {
                this.destroyAllEditors();
                this.constructor.prototype.refresh.call(this, headersToo);
                this.renderEditors(0, this.ds.getCount() - 1);
            },

            destroy : function () {
                this.destroyAllEditors();
                this.constructor.prototype.destroy.call(this);
            },

            focusCell : function (row, col, hscroll) {
                this.syncFocusEl(this.ensureVisible(row, col, hscroll));
                var ed = this.editors[row][col], focusEl = ed ? ed : this.focusEl;

                if (Ext.isGecko) {
                    focusEl.focus();
                } else {
                    focusEl.focus.defer(1, this.focusEl);
                }
            },

            renderEditors: function (startRow, endRow) {
                var args = [startRow, 0],
                    cols = this.cm.getColumnCount(),
                    col, row, ed, w = [], rec, r, di, cell;                

                for (col = 0; col < cols; col++) {
                    w[col] = this.cm.getColumnWidth(col) - this.editorPadding;
                }

                for (row = startRow; row <= endRow; row++) {
                    r = [];
                    rec = this.ds.getAt(row);
                    for (col = 0; col < cols; col++) {
                        ed = this.cm.isCellEditable(col, row) ? this.getCellEditor(col, row) : null;

                        if (ed) {
                            cell = this.getCell(row, col).firstChild;
                            cell.parentNode.removeAttribute('tabindex');
                            cell.innerHTML = '';
                            di = this.cm.getDataIndex(col);
                            ed = ed.field.cloneConfig({
                                id: Ext.id(),
                                value: rec.get(di),
                                grid:{
                                    grid   : grid,
                                    record : rec,
                                    cell   : cell,
                                    dataIndex : di,
                                    col : col,
                                    row : row
                                },
                                width    : w[col],
                                renderTo : cell,
                                ctCls    : 'x-small-editor x-grid-editor ux-editable-grid'
                            });
                            ed.on('blur', this.onEditorBlur, {
                                store: this.ds,
                                row: row,
                                dataIndex: di
                            }, {                            
                                delay : 100 
                            });
                            ed.on('specialkey', this.onEditorSpecialKey, {
                                view : this,                                
                                row  : row,
                                col  : col
                            });
                            ed.mon(ed.el, 'mousedown', function(e) {
                                this.view.editorFocus.row = this.row;
                                this.view.editorFocus.col = this.col;
                            }, {
                                row : row,
                                col : col,
                                view  : this
                            });
                            ed.on('focus', function(e) {
                                this.view.editorFocus.row = this.row;
                                this.view.editorFocus.col = this.col;
                            }, {
                                row  : row,
                                col  : col,
                                view : this
                            });
                        }
                        r.push(ed);
                    }
                    args.push(r);
                }
                this.editors.splice.apply(this.editors, args);
                
                if (this.editorFocus && Ext.isDefined(this.editorFocus.row) && Ext.isDefined(this.editorFocus.col)
                    && this.editors[this.editorFocus.row] && this.editors[this.editorFocus.row][this.editorFocus.col]) {
                    this.editors[this.editorFocus.row][this.editorFocus.col].focus(false, 10);
                }
            },

            getCellEditor : function (colIndex, rowIndex) {
                return this.cm.config[colIndex].getCellEditor ? this.cm.config[colIndex].getCellEditor(rowIndex) : null;
            }, 

            destroyEditors: function (startRow, endRow) {
                var removed = this.editors.splice(startRow, endRow - startRow + 1);
                Ext.destroy(removed);
            },

            destroyAllEditors: function () {
                Ext.destroy(this.editors);
                this.editors = [];
            },

            onEditorBlur: function (field) {
                this.store.getAt(this.row).set(this.dataIndex, field.getValue());
            },
            
            onEditorSpecialKey : function (field, e) {
                var col = this.col,                    
                    cols = this.view.cm.getColumnCount(),
                    row = this.row,
                    rows = this.view.ds.getCount(),
                    ed,
                    found = false;
                    
                switch(e.getKey()){
                    case e.TAB:                        
                        for(row; e.shiftKey ? (row >= 0) : (row < rows); e.shiftKey ? row-- : row++){                    
                            for (e.shiftKey ? --col : ++col; e.shiftKey ? (col >= 0) : (col < cols); e.shiftKey ? col-- : col++) {
                                if(this.view.cm.isHidden(col)){
                                    continue;
                                }
                                
                                ed = this.view.cm.isCellEditable(col, row) ? this.view.getCellEditor(col, row) : null;
                                if(ed){
                                    this.view.editors[row][col].focus(false, 10);
                                    found = true;
                                    break;
                                }                                
                            }
                            
                            col = e.shiftKey ? cols : -1;
                            
                            if(found){                                
                                break;
                            }
                        }
                        
                        e.stopEvent();
                        return false;
                    case e.ENTER: 
                        if(this.view.grid.getSelectionModel().moveEditorOnEnter === false){
                            return;
                        }
                        for (col; e.shiftKey ? (col >= 0) : (col < cols); e.shiftKey ? col-- : col++) {
                            if(this.view.cm.isHidden(col)){
                                continue;
                            }
                            
                            for(e.shiftKey ? --row : ++row; e.shiftKey ? (row >= 0) : (row < rows); e.shiftKey ? row-- : row++){                                
                                ed = this.view.cm.isCellEditable(col, row) ? this.view.getCellEditor(col, row) : null;
                                if(ed){
                                    this.view.editors[row][col].focus(false, 10);
                                    found = true;
                                    break;
                                }                                
                            }
                            
                            row = e.shiftKey ? rows : -1;
                            
                            if(found){                                
                                break;
                            }
                        }    
                        e.stopEvent();
                        return false;                   
                }                
            }
        });
    }
});

Ext.preg('editable-grid', Ext.ux.grid.EditableGrid);

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}