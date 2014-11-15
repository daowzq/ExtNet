
// @source data/CommandColumn.js

//Ext.grid.GridView.prototype.refreshRow = Ext.grid.GridView.prototype.refreshRow.createInterceptor(function (record) {
//    this.fireEvent("beforerowupdate", this, this.grid.store.indexOf(record), record);
//});

Ext.net.CommandColumn = function (config) {
    Ext.apply(this, config);
    
    if (!this.id) {
        this.id = Ext.id();
    }

    Ext.net.CommandColumn.superclass.constructor.call(this); 
};

Ext.extend(Ext.net.CommandColumn, Ext.util.Observable, {
    dataIndex    : "",
    header       : "",
    menuDisabled : true,
    sortable     : false,
    autoWidth    : false,

    init : function (grid) {
        this.grid = grid;

        var view = this.grid.getView(),
            func;

        view.rowSelectorDepth = 100;

        this.cache = [];

//        if (Ext.isEmpty(view.events) || Ext.isEmpty(view.events.beforerowupdate)) {
//            view.addEvents("beforerowupdate");
//        }
        
        this.commands = this.commands || [];

        if (this.commands) {
            this.shareMenus(this.commands, "initMenu");
            
            func = function () {
                this.insertToolbars();
                view.on("beforerefresh", this.removeToolbars, this);
                view.on("refresh", this.insertToolbars, this);
            };

            if (this.grid.rendered) {
                func.call(this);
            } else {
                this.grid.on("viewready", func, this);
            }

            view.on("beforerowupdate", this.removeToolbar, this);
            view.on("beforerowremoved", this.removeToolbar, this);
            view.on("rowsinserted", this.insertToolbar, this);
            view.on("rowupdated", this.rowUpdated, this);
        }

        var sm = grid.getSelectionModel();
        
        if (sm.id === "checker") {
            sm.onMouseDown = sm.onMouseDown.createInterceptor(this.onMouseDown, this);
        } else if (sm.selectRows) {
            sm.handleMouseDown = sm.handleMouseDown.createInterceptor(this.rmHandleMouseDown, this);
        } else {
            sm.handleMouseDown = sm.handleMouseDown.createInterceptor(this.handleMouseDown, this);
        }

        if (view.groupTextTpl && this.groupCommands) {
            this.shareMenus(this.groupCommands, "initGroupMenu");
            func = function () {
                this.insertGroupToolbars();
                view.on("beforerefresh", this.removeToolbars, this);
                view.on("refresh", this.insertGroupToolbars, this);
            };

            if (view.groupTextTpl && this.groupCommands) {
                view.groupTextTpl = '<div class="standart-view-group">' + view.groupTextTpl + '</div>';
            }

            if (this.grid.rendered) {
                func.call(this);
            } else {
                view.on("afterRender", func, this);
            }

            view.processEvent = view.processEvent.createInterceptor(this.interceptMouse, this);
        }
    },

    onMouseDown : function (e, t) {
        return this.interceptMouse("mousedown", e);
    },

    rmHandleMouseDown : function (g, rowIndex, e) {
        return this.interceptMouse("mousedown", e);
    },

    handleMouseDown : function (g, row, cell, e) {
        return this.interceptMouse("mousedown", e);
    },

    interceptMouse : function (name, e) {
        if (name !== "mousedown") {
            return;
        }
        
        var tb = e.getTarget('.x-toolbar', this.grid.view.mainBody);
        
        if (tb) {
            e.stopEvent();
            return false;
        }
    },

    renderer : function (value, meta, record, row, col, store) {
        meta.css = "row-cmd-cell";
        return "";
    },

    insertToolbar : function (view, firstRow, lastRow, row) {
        this.insertToolbars(firstRow, lastRow + 1, row);
    },

    rowUpdated : function (view, firstRow, record) {
        this.insertToolbars(firstRow, firstRow + 1);
    },

    select : function (row) {
        var classSelector = "x-grid3-td-" + this.id + ".row-cmd-cell",
            el = row ? Ext.fly(row) : this.grid.getEl();
        return el.query("td." + classSelector);
    },

    selectGroups : function () {
        return this.grid.getEl().query("div.x-grid-group div.x-grid-group-hd");
    },

    shareMenus : function (items, initMenu) {
        Ext.each(items, function (item) {
            if (item.menu) {
                if (item.menu.shared) {
                    item.menu.autoDestroy = false;

                    item.onMenuShow = Ext.emptyFn;

                    item.showMenu = function () {
                        if (this.rendered && this.menu) {
                            if (this.tooltip) {
                                Ext.QuickTips.getQuickTip().cancelShow(this.btnEl);
                            }
                            this.menu.show(this.el, this.menuAlign);

                            this.menu.ownerCt = this;
                            this.ignoreNextClick = 0;
                            this.el.addClass('x-btn-menu-active');
                            this.fireEvent('menushow', this, this.menu);
                        }
                        return this;
                    };

                    item.menu = Ext.ComponentMgr.create(item.menu, "menu");
                    this[initMenu](item.menu, null, true);
                } else {
                    this.shareMenus(item.menu.items || []);
                }
            }
        }, this);
    },

    insertGroupToolbars : function () {
        var groupCmd = this.selectGroups(),
            i;

        if (this.groupCommands) {
            for (i = 0; i < groupCmd.length; i++) {
                var toolbar = new Ext.Toolbar({
                    items: this.groupCommands,
                    enableOverflow: false
                }),
                    div = Ext.fly(groupCmd[i]).first("div");

                this.cache.push(toolbar);

                div.addClass("row-cmd-cell-ct");
                toolbar.render(div);

                var group = this.grid.view.findGroup(div),
                    groupId = group ? group.id.replace(/ext-gen[0-9]+-gp-/, "") : null,
                    records = this.getRecords(group.id);

                if (this.prepareGroupToolbar && this.prepareGroupToolbar(this.grid, toolbar, groupId, records) === false) {
                    toolbar.destroy();
                    continue;
                }

                toolbar.grid = this.grid;
                toolbar.groupId = groupId;
                toolbar._groupId = group.id;

                toolbar.items.each(function (button) {
                    if (button.on) {
                        button.toolbar = toolbar;
                        button.column = this;

                        if (button.standOut) {
                            button.on("mouseout", function () {
                                this.getEl().addClass("x-btn-over");
                            }, button);
                        }

                        if (!Ext.isEmpty(button.command, false)) {
                            button.on("click", function (e) {
                                this.toolbar.grid.fireEvent("groupcommand", this.command, this.toolbar.groupId, this.column.getRecords.apply(this.column, [this.toolbar._groupId]));
                            }, button);
                        }

                        if (button.menu && !button.menu.shared) {
                            this.initGroupMenu(button.menu, toolbar);
                        }
                    }
                }, this);
            }
        }
    },

    initGroupMenu : function (menu, toolbar, shared) {
        menu.items.each(function (item) {
            if (item.on) {
                item.toolbar = toolbar;
                item.column = this;

                if (!Ext.isEmpty(item.command, false)) {

                    if (shared) {
                        item.on("click", function () {
                            var pm = this.parentMenu;
                            
                            while (pm && !pm.shared) {
                                pm = pm.parentMenu;
                            }
                            
                            if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                                var toolbar = pm.ownerCt.toolbar;
                                toolbar.grid.fireEvent("groupcommand", this.command, toolbar.groupId, this.column.getRecords.apply(this.column, [toolbar._groupId]));
                            }
                        }, item);
                        item.getGroup = function () {
                            var pm = this.parentMenu;
                            
                            while (pm && !pm.shared) {
                                pm = pm.parentMenu;
                            }
                            
                            if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                                var toolbar = pm.ownerCt.toolbar;
                            
                                return {
                                    groupId: toolbar.groupId,
                                    records: this.column.getRecords.apply(this.column, [toolbar._groupId])
                                };
                            }
                        };
                    } else {
                        item.getGroup = function () {
                            return {
                                groupId: this.toolbar.groupId,
                                records: this.column.getRecords.apply(this.column, [this.toolbar._groupId])
                            };
                        };
                        item.on("click", function () {
                            this.toolbar.grid.fireEvent("groupcommand", this.command, this.toolbar.groupId, this.column.getRecords.apply(this.column, [this.toolbar._groupId]));
                        }, item);
                    }
                }

                if (item.menu) {
                    this.initGroupMenu(item.menu, toolbar, shared);
                }
            }
        }, this);
    },

    getRecords : function (groupId) {
        if (groupId) {
            groupId = Ext.util.Format.htmlEncode(groupId);
            var records = this.grid.store.queryBy(function (r) {
                    return r._groupId === groupId;
                });

            return records ? records.items : [];
        }
    },

    getAllGroupToolbars : function () {
        var groups = this.selectGroups(),
            toolbars = [],
            i;

        for (i = 0; i < groups.length; i++) {
            var div = Ext.fly(groups[i]).first("div"),
                el = div.last();

            if (!Ext.isEmpty(el)) {
                var cmp = Ext.getCmp(el.id);
                toolbars.push(cmp);
            }
        }

        return toolbars;
    },

    getGroupToolbar : function (groupId) {
        var groups = this.selectGroups(),
            i;

        for (i = 0; i < groups.length; i++) {
            var div = Ext.fly(groups[i]).first("div"),
                _group = this.grid.view.findGroup(div),
                _groupId = _group ? _group.id.replace(/ext-gen[0-9]+-gp-/, "") : null;

            if (_groupId === groupId) {
                var el = div.last();

                if (!Ext.isEmpty(el)) {
                    var cmp = Ext.getCmp(el.id);
                    return cmp;
                }
            }
        }

        return undefined;
    },

    insertToolbars : function (start, end, row) {
        var tdCmd = this.select(),
            width = 0;

        if (Ext.isEmpty(start) || Ext.isEmpty(end)) {
            start = 0;
            end = tdCmd.length;
        }

        if (this.commands) {
            var i = start;

            for (i; i < end; i++) {

                var toolbar = new Ext.Toolbar({
                    items          : this.commands,
                    enableOverflow : false,
                    buttonAlign    : this.buttonAlign
                }),
                    div;

                if (row) {
                    div = Ext.fly(this.select(row)[0]).first("div");
                } else {
                    div = Ext.fly(tdCmd[i]).first("div");
                }

                this.cache.push(toolbar);

                div.dom.innerHTML = "";
                div.addClass("row-cmd-cell-ct");

                toolbar.render(div);

                var record = this.grid.store.getAt(i);
                toolbar.record = record;

                if (this.prepareToolbar && this.prepareToolbar(this.grid, toolbar, i, record) === false) {
                    toolbar.destroy();
                    continue;
                }

                toolbar.grid = this.grid;
                toolbar.rowIndex = i;
                toolbar.record = record;

                toolbar.items.each(function (button) {
                    if (button.on) {
                        button.toolbar = toolbar;

                        if (button.standOut) {
                            button.on("mouseout", function () {
                                this.getEl().addClass("x-btn-over");
                            }, button);
                        }

                        if (!Ext.isEmpty(button.command, false)) {
                            button.on("click", function () {
                                this.toolbar.grid.fireEvent("command", this.command, this.toolbar.record, this.toolbar.record.store.indexOf(this.toolbar.record));
                            }, button);
                        }

                        if (button.menu && !button.menu.shared) {
                            this.initMenu(button.menu, toolbar);
                        }
                    }
                }, this);

                if (this.autoWidth) {
                    var tbTable = toolbar.getEl().first("table"),
                        tbWidth = tbTable.getComputedWidth();

                    width = tbWidth > width ? tbWidth : width;
                }
            }

            if (this.autoWidth && width > 0) {
                var cm = this.grid.getColumnModel();
                cm.setColumnWidth(cm.getIndexById(this.id), width + 4);
                this.grid.view.autoExpand();
            }
            
            if (this.grid.view.syncRows) {
                this.grid.view.syncRows(start);
            }
        }
    },

    initMenu : function (menu, toolbar, shared) {
        menu.items.each(function (item) {
            if (item.on) {
                item.toolbar = toolbar;

                if (shared) {
                    item.on("click", function () {
                        var pm = this.parentMenu;
                        while (pm && !pm.shared) {
                            pm = pm.parentMenu;
                        }
                        if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                            var toolbar = pm.ownerCt.toolbar;
                            toolbar.grid.fireEvent("command", this.command, toolbar.record, toolbar.record.store.indexOf(toolbar.record));
                        }
                    }, item);

                    item.getRecord = function () {
                        var pm = this.parentMenu;
                        while (pm && !pm.shared) {
                            pm = pm.parentMenu;
                        }
                        if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                            var toolbar = pm.ownerCt.toolbar;
                            return toolbar.record;
                        }
                    };
                } else {
                    if (!Ext.isEmpty(item.command, false)) {
                        item.on("click", function () {
                            this.toolbar.grid.fireEvent("command", this.command, this.toolbar.record, this.toolbar.rowIndex);
                        }, item);
                        
                        item.getRecord = function () {
                            return this.toolbar.record;
                        };
                    }
                }

                if (item.menu) {
                    this.initMenu(item.menu, toolbar, shared);
                }
            }
        }, this);
    },

    removeToolbar : function (view, rowIndex, record) {
        var i,
            l;

        for (i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].record && (this.cache[i].record.id === record.id)) {
                try {
                    this.cache[i].destroy();
                    this.cache.remove(this.cache[i]);
                } catch (ex) { }
                break;
            }
        }
    },

    removeToolbars : function () {
        var i,
            l;

        for (i = 0, l = this.cache.length; i < l; i++) {
            try {
                this.cache[i].destroy();
            } catch (ex) { }
        }

        this.cache = [];
    },

    getToolbar: function (rowIndex) {
        var tdCmd = this.select(),
            div = Ext.fly(tdCmd[rowIndex]).first("div"),
            el = div.first();

        if (!Ext.isEmpty(el)) {
            var cmp = Ext.getCmp(el.id);

            return cmp;
        }

        return undefined;
    },

    getAllToolbars : function () {
        var tdCmd = this.select(),
            toolbars = [],
            i = 0;

        for (i; i < tdCmd.length; i++) {
            var div = Ext.fly(tdCmd[i]).first("div"),
                el = div.first();

            if (!Ext.isEmpty(el)) {
                var cmp = Ext.getCmp(el.id);
                toolbars.push(cmp);
            }
        }

        return toolbars;
    },

    destroy : function () {
        var view = this.grid.getView();
        
        this.removeToolbars();
        view.un("refresh", this.insertToolbars, this);
        view.un("beforerowupdate", this.removeToolbar, this);
        view.un("beforerefresh", this.removeToolbars, this);
        view.un("beforerowremoved", this.removeToolbar, this);
        view.un("rowsinserted", this.insertToolbar, this);
        view.un("rowupdated", this.rowUpdated, this);
        view.un("refresh", this.insertGroupToolbars, this);
    }
});