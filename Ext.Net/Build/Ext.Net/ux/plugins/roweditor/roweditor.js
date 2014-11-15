/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns('Ext.ux.grid');

/**
 * @class Ext.ux.grid.RowEditor
 * @extends Ext.Panel 
 * Plugin (ptype = 'roweditor') that adds the ability to rapidly edit full rows in a grid.
 * A validation mode may be enabled which uses AnchorTips to notify the user of all
 * validation errors at once.
 * 
 * @ptype roweditor
 */
Ext.ux.grid.RowEditor = Ext.extend(Ext.Panel, {
    floating       : true,
    shadow         : false,
    layout         : 'hbox',
    cls            : 'x-small-editor',
    buttonAlign    : 'center',
    baseCls        : 'x-row-editor',
    elements       : 'header,footer,body',
    frameWidth     : 5,
    buttonPad      : 3,
    clicksToEdit   : 'auto',
    monitorValid   : true,
    autoFocusDelay : 250,
    errorSummary   : true,

    saveText    : 'Save',
    cancelText  : 'Cancel',
    commitChangesText : 'You need to commit or cancel your changes',
    errorText   : 'Errors',
    isRowEditor : true,

    defaults : {
        normalWidth: true
    },

    initComponent : function () {
        Ext.ux.grid.RowEditor.superclass.initComponent.call(this);
        this.addEvents(
        /**
        * @event beforeedit
        * Fired before the row editor is activated.
        * If the listener returns <tt>false</tt> the editor will not be activated.
        * @param {Ext.ux.grid.RowEditor} roweditor This object
        * @param {Number} rowIndex The rowIndex of the row just edited
        */
            "beforeedit",
        /**
        * @event canceledit
        * Fired when the editor is cancelled.
        * @param {Ext.ux.grid.RowEditor} roweditor This object
        * @param {Boolean} forced True if the cancel button is pressed, false is the editor was invalid. 
        */
            "canceledit",
        /**
        * @event validateedit
        * Fired after a row is edited and passes validation.
        * If the listener returns <tt>false</tt> changes to the record will not be set.
        * @param {Ext.ux.grid.RowEditor} roweditor This object
        * @param {Object} changes Object with changes made to the record.
        * @param {Ext.data.Record} r The Record that was edited.
        * @param {Number} rowIndex The rowIndex of the row just edited
        */
            "validateedit",
        /**
        * @event afteredit
        * Fired after a row is edited and passes validation.  This event is fired
        * after the store's update event is fired with this edit.
        * @param {Ext.ux.grid.RowEditor} roweditor This object
        * @param {Object} changes Object with changes made to the record.
        * @param {Ext.data.Record} r The Record that was edited.
        * @param {Number} rowIndex The rowIndex of the row just edited
        */
            "afteredit",
            "preedit"
        );
    },

    init : function (grid) {
        this.grid = grid;
        this.ownerCt = grid;
        
        this.autoEncode = grid.autoEncode;
        
        if (this.clicksToEdit === 2) {
            grid.on('rowdblclick', this.onRowDblClick, this);
        } else {
            grid.on('rowclick', this.onRowClick, this);
            if (Ext.isIE) {
                grid.on('rowdblclick', this.onRowDblClick, this);
            }
        }

        // stopEditing without saving when a record is removed from Store.
        grid.getStore().on('remove', function () {
            this.stopEditing(false);
        }, this);

        grid.on({
            scope: this,
            keydown: this.onGridKey,
            columnresize: this.refreshFields,
            columnmove: this.refreshFields,
            reconfigure: this.refreshFields,
            beforedestroy: this.beforedestroy,
            destroy: this.destroy,
            bodyscroll: {
                buffer: 250,
                fn: this.positionButtons
            }
        });
        grid.getColumnModel().on('hiddenchange', this.verifyLayout, this, { delay: 1 });
        grid.getView().on('refresh', this.stopEditing.createDelegate(this, []));

        grid.getSelectionModel().onEditorKey = Ext.emptyFn;
        grid.onCellDblClick = Ext.emptyFn;
        grid.onAutoEditClick = Ext.emptyFn;
        
        //http://forums.ext.net/showthread.php?11016
        if ((grid.getSelectionModel().id === "checker") && !grid.getSelectionModel().getEditor) {
            grid.getSelectionModel().getEditor = function() {
                return false;
            }
        };
    },

    beforedestroy : function () {
        this.stopMonitoring();
        this.grid.getStore().un('remove', this.onStoreRemove, this);
        this.stopEditing(false);
        Ext.destroy(this.btns, this.tooltip);
    },

    refreshFields : function () {
        this.initFields();
        this.verifyLayout();
    },

    isDirty : function () {
        var dirty,
            column;

        this.items.each (function (f, i) {
            column = this.grid.getColumnModel().getColumnAt(i);

            if (String(this.values[f.id]) !== String(f.getValue()) && column.getEditor && column.getEditor()) {
                dirty = true;
                return false;
            }
        }, this);
        return dirty;
    },

    startEditing : function (rowIndex, doFocus) {
        if (this.editing && this.isDirty()) {
            this.showTooltip(this.commitChangesText);
            return;
        }
        if (Ext.isObject(rowIndex)) {
            rowIndex = this.grid.getStore().indexOf(rowIndex);
        }
        if (this.fireEvent('beforeedit', this, rowIndex) !== false) {
            this.editing = true;
            var g = this.grid, view = g.getView(),
                row = view.getRow(rowIndex),
                record = g.store.getAt(rowIndex);

            this.record = record;
            this.rowIndex = rowIndex;
            this.values = {};
            if (!this.rendered) {
                this.render(view.getEditorParent());
            }
            var w = Ext.fly(row).getWidth();
            this.setSize(w);
            if (!this.initialized) {
                this.initFields();
            }
            var cm = g.getColumnModel(), fields = this.items.items, f, val;
            for (var i = 0, len = cm.getColumnCount(); i < len; i++) {
                val = this.preEditValue(record, cm.getDataIndex(i), i);
                f = fields[i];
                f.rendered ? f.setValue(val.value) : (f.value = val.value);
                f.setReadOnly(!cm.isCellEditable(i, rowIndex));
                if (val.meta.css) {
                    if (f.rendered) {
                        f.el.addClass(val.meta.css);
                    }
                    else {
                        f.cls = val.meta.css;
                    }
                }
                this.values[f.id] = Ext.isEmpty(val.value) ? '' : val.value;
            }
            this.verifyLayout(true);
            if (!this.isVisible()) {
                this.setPagePosition(Ext.fly(row).getXY());
            } else {
                this.el.setXY(Ext.fly(row).getXY(), { duration: 0.15 });
            }
            if (!this.isVisible()) {
                this.show().doLayout();
            }
            if (doFocus !== false) {
                this.doFocus.defer(this.autoFocusDelay, this);
            }
        }
    },

    stopEditing : function (saveChanges) {
        this.editing = false;

        if (!this.isVisible()) {
            return;
        }

        if (saveChanges === false || !this.isValid()) {
            this.hide();
            this.fireEvent('canceledit', this, saveChanges === false);
            return;
        }

        var changes = {},
            r = this.record,
            hasChange = false,
            cm = this.grid.colModel,
            fields = this.items.items;

        for (var i = 0, len = cm.getColumnCount(); i < len; i++) {
            if (!cm.isHidden(i)) {
                var dindex = cm.getDataIndex(i),
                    c = cm.getColumnAt(i);
                if (!Ext.isEmpty(dindex) && c.getEditor && c.getEditor()) {
                    var oldValue = r.data[dindex],
                        value = this.postEditValue(fields[i].getValue(), oldValue, r, dindex, i);
                    if (String(oldValue) !== String(value)) {
                        changes[dindex] = value;
                        hasChange = true;
                    }
                }
            }
        }

        if (hasChange && this.fireEvent('validateedit', this, changes, r, this.rowIndex) !== false) {
            r.beginEdit();
            Ext.iterate(changes, function (name, value) {
                r.set(name, value);
            });
            r.endEdit();
            this.fireEvent('afteredit', this, changes, r, this.rowIndex);
        }

        this.hide();
    },

    verifyLayout : function (force) {
        if (this.el && (this.isVisible() || force === true)) {
            var row = this.grid.getView().getRow(this.rowIndex);
            this.setSize(Ext.fly(row).getWidth(), Ext.fly(row).getHeight() + 9);
            var cm = this.grid.colModel, fields = this.items.items;
            for (var i = 0, len = cm.getColumnCount(); i < len; i++) {
                if (!cm.isHidden(i)) {
                    var adjust = 0;

                    if (i === (len - 1)) {
                        adjust += 3; // outer padding
                    } else {
                        adjust += 1;
                    }

                    fields[i].show();
                    fields[i].setWidth(cm.getColumnWidth(i) - adjust);
                } else {
                    fields[i].hide();
                }
            }
            this.doLayout();
            this.positionButtons();
        }
    },

    slideHide : function () {
        this.hide();
    },

    initFields : function () {
        var cm = this.grid.getColumnModel(), pm = Ext.layout.ContainerLayout.prototype.parseMargins;
        this.removeAll(false);

        for (var i = 0, len = cm.getColumnCount(); i < len; i++) {
            var c = cm.getColumnAt(i),
                ed = c.getEditor ? this.getEditor(c) : null;
            if (!ed) {
                ed = c.displayEditor || new Ext.form.DisplayField();
            }

            if (i === 0) {
                ed.margins = pm('0 1 2 1');
            } else if (i == len - 1) {
                ed.margins = pm('0 0 2 1');
            } else {
                if (Ext.isIE) {
                    ed.margins = pm('0 0 2 0');
                }
                else {
                    ed.margins = pm('0 1 2 0');
                }
            }

            ed.setWidth(cm.getColumnWidth(i));
            ed.column = c;

            if (ed.ownerCt !== this) {
                ed.on('focus', this.ensureVisible, this);
                ed.on('specialkey', this.onKey, this);
            }

            this.insert(i, ed);
        }
        this.initialized = true;
    },

    onKey : function (f, e) {
        if (e.getKey() === e.ENTER) {
            this.stopEditing(true);
            e.stopPropagation();
        }
    },

    onGridKey : function (e) {
        if (e.getKey() === e.ENTER && !this.isVisible()) {
            var r = this.grid.getSelectionModel().getSelected();
            if (r) {
                var index = this.grid.store.indexOf(r);
                this.startEditing(index);
                e.stopPropagation();
            }
        }
    },

    ensureVisible : function (editor) {
        if (this.isVisible()) {
            this.grid.getView().ensureVisible(this.rowIndex, this.grid.colModel.getIndexById(editor.column.id), true);
        }
    },

    onRowClick : function (g, rowIndex, e) {
        if (this.clicksToEdit == 'auto') {
            var li = this.lastClickIndex;
            this.lastClickIndex = rowIndex;
            if (li != rowIndex && !this.isVisible()) {
                return;
            }
        }
        this.startEditing(rowIndex, false);
        this.doFocus.defer(this.autoFocusDelay, this, [e.getPoint()]);
    },

    onRowDblClick : function (g, rowIndex, e) {
        this.startEditing(rowIndex, false);
        this.doFocus.defer(this.autoFocusDelay, this, [e.getPoint()]);
    },

    onRender : function () {
        Ext.ux.grid.RowEditor.superclass.onRender.apply(this, arguments);
        this.el.swallowEvent(['keydown', 'keyup', 'keypress']);
        this.btns = new Ext.Panel({
            baseCls: 'x-plain',
            cls: 'x-btns',
            elements: 'body',
            layout: 'table',
            width: (this.minButtonWidth * 2) + (this.frameWidth * 2) + (this.buttonPad * 4), // width must be specified for IE
            items: [{
                ref: 'saveBtn',
                itemId: 'saveBtn',
                xtype: 'button',
                text: this.saveText,
                width: this.minButtonWidth,
                handler: this.stopEditing.createDelegate(this, [true])
            }, {
                ref: 'cancelBtn',
                itemId: 'cancelBtn',
                xtype: 'button',
                text: this.cancelText,
                width: this.minButtonWidth,
                handler: this.stopEditing.createDelegate(this, [false])
}]
            });
            this.btns.render(this.bwrap);
        },

        afterRender : function () {
            Ext.ux.grid.RowEditor.superclass.afterRender.apply(this, arguments);
            this.positionButtons();
            if (this.monitorValid) {
                this.startMonitoring();
            }
        },

        onShow : function () {
            if (this.monitorValid) {
                this.startMonitoring();
            }
            Ext.ux.grid.RowEditor.superclass.onShow.apply(this, arguments);
        },

        onHide : function () {
            Ext.ux.grid.RowEditor.superclass.onHide.apply(this, arguments);
            this.stopMonitoring();
            this.grid.getView().focusRow(this.rowIndex);
        },

        positionButtons : function () {
            if (this.btns) {
                var g = this.grid,
                h = this.el.dom.clientHeight,
                view = g.getView(),
                scroll = view.scroller.dom.scrollLeft,
                bw = this.btns.getWidth(),
                width = Math.min(g.getWidth(), g.getColumnModel().getTotalWidth());

                this.btns.el.shift({ left: (width / 2) - (bw / 2) + scroll, top: h - 2, stopFx: true, duration: 0.2 });
            }
        },

        renderedValue : function (value, field, r, colIndex, preedit) {
            try {
                var column = this.grid.getColumnModel().getColumnAt(colIndex),
                 meta,
                 e,
                 renderValue,
                 renderer = this.grid.getColumnModel().getRenderer(colIndex);

                meta = { isRowEditor: true };

                if (column.getEditor && column.getEditor()) {
                    if (preedit) {
                        e = {
                            grid: this.grid,
                            value: value,
                            field: field,
                            record: r,
                            meta: meta
                        };
                        this.fireEvent("preedit", e);

                        value = e.value;
                    }
                    return { meta: meta, value: value }
                }

                renderValue = renderer(value, meta, r, this.rowIndex, colIndex, this.grid.store);

                if (column.isRowNumberer) {
                    renderValue = "";
                    meta = {};
                }

                if (preedit) {
                    e = {
                        grid: this.grid,
                        value: renderValue,
                        field: field,
                        record: r,
                        meta: meta
                    };
                    this.fireEvent("preedit", e);

                    renderValue = e.value;
                }

                return { meta: meta, value: renderValue };
            }
            catch (e) {
                return { value: "", meta: {} };
            }
        },

        // private
        preEditValue : function (r, field, colIndex) {
            var value = this.renderedValue(r.data[field], field, r, colIndex, true);
            value.value = this.autoEncode && typeof value.value === 'string' ? Ext.util.Format.htmlDecode(value.value) : value.value;

            return value;
        },

        // private
        postEditValue : function (value, originalValue, r, field, colIndex) {
            if (this.renderedValue(originalValue, field, r, colIndex).value === value) {
                value = originalValue;
            }
            return this.autoEncode && typeof value == 'string' ? Ext.util.Format.htmlEncode(value) : value;
        },

        doFocus : function (pt) {
            if (this.isVisible()) {
                var index = 0,
                cm = this.grid.getColumnModel(),
                ed,
                c;
                
                if (pt) {
                    index = this.getTargetColumnIndex(pt);
                }
                for (var i = index || 0, len = cm.getColumnCount(); i < len; i++) {
                    c = cm.getColumnAt(i);
                    ed = this.getEditor(c);                    
                    if (!c.hidden && ed) {
                        c.getEditor().focus();
                        break;
                    }
                }
            }
        },

        getTargetColumnIndex : function (pt) {
            var grid = this.grid,
            v = grid.view,
            x = pt.left,
            cms = grid.colModel.config,
            i = 0,
            match = false;
            for (var len = cms.length, c; c = cms[i]; i++) {
                if (!c.hidden) {
                    if (Ext.fly(v.getHeaderCell(i)).getRegion().right >= x) {
                        match = i;
                        break;
                    }
                }
            }
            return match;
        },

        startMonitoring : function () {
            if (!this.bound && this.monitorValid) {
                this.bound = true;
                Ext.TaskMgr.start({
                    run: this.bindHandler,
                    interval: this.monitorPoll || 200,
                    scope: this
                });
            }
        },

        stopMonitoring : function () {
            this.bound = false;
            if (this.tooltip) {
                this.tooltip.hide();
            }
        },

        isValid : function () {
            var valid = true;
            this.items.each(function (f) {
                if (!f.isValid(true)) {
                    valid = false;
                    return false;
                }
            });
            return valid;
        },

        // private
        bindHandler : function () {
            if (!this.bound) {
                return false; // stops binding
            }
            var valid = this.isValid();
            if (!valid && this.errorSummary) {
                this.showTooltip(this.getErrorText().join(''));
            }
            this.btns.saveBtn.setDisabled(!valid);
            this.fireEvent('validation', this, valid);
        },

    lastVisibleColumn : function () {
        var i = this.items.getCount() - 1,
            c;
        for (; i >= 0; i--) {
            c = this.items.items[i];
            if (!c.hidden) {
                return c;
            }
        }
    },

    showTooltip : function (msg) {
        var t = this.tooltip;
        if (!t) {
            t = this.tooltip = new Ext.ToolTip({
                maxWidth: 600,
                cls: 'errorTip',
                width: 300,
                title: this.errorText,
                autoHide: false,
                anchor: 'left',
                anchorToTarget: true,
                mouseOffset: [40,0]
            });
        }
        var v = this.grid.getView(),
            top = parseInt(this.el.dom.style.top, 10),
            scroll = v.scroller.dom.scrollTop,
            h = this.el.getHeight();

        if (top + h >= scroll) {
            t.initTarget(this.lastVisibleColumn().getEl());
            if (!t.rendered) {
                t.show();
                t.hide();
            }
            t.body.update(msg);
            t.doAutoWidth(20);
            t.show();
        } else if (t.rendered) {
            t.hide();
        }
    },

        getErrorText : function () {
            var data = ['<ul>'];
            this.items.each(function (f) {
                if (!f.isValid(true)) {
                    data.push('<li>', f.getActiveError(), '</li>');
                }
            });
            data.push('</ul>');
            return data;
        },
        
        getEditor : function (c) {
            var ed = c.getEditor();
            if (ed instanceof Ext.grid.GridEditor && ed.field) {
                ed = ed.field;
            }
            return ed;
        }
    });

Ext.preg('roweditor', Ext.ux.grid.RowEditor);

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}