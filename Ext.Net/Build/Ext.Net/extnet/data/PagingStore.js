
// @source data/PagingStore.js
/*
 * PagingStore for Ext 3.2 - v0.5
 */
Ext.ns("Ext.ux.data");

Ext.ux.data.PagingStore = Ext.extend(Ext.net.Store, {
    reMap : function(record) {
        if (Ext.isArray(record)) {
            for (var i = 0, len = record.length; i < len; i++) {
                this.reMap(record[i]);
            }
        } else {
            delete this.data.map[record._phid];
            this.data.map[record.id] = record;
            var index = this.data.keys.indexOf(record._phid);
            this.data.keys.splice(index, 1, record.id);
            
            if (this.allData) {
                delete this.allData.map[record._phid];
                this.allData.map[record.id] = record;
                index = this.allData.keys.indexOf(record._phid);
                this.allData.keys.splice(index, 1, record.id);
            }           
            
            delete record._phid;
        }
    },
    
    destroy : function () {
        if (window[this.storeId || this.id]) {
            window[this.storeId || this.id] = null;
        }
        
        if (window[this.storeId + "_Data" || this.id + "_Data"]) {
            window[this.storeId + "_Data" || this.id + "_Data"] = null;
        }
        
        if (this.storeId) {
            Ext.StoreMgr.unregister(this);
        }
        
        this.data = this.allData = this.snapshot = null;
        Ext.destroy(this.proxy);
        this.reader = this.writer = null;
        this.purgeListeners();
    },
    
    add : function (records) {
        var i, record, index;
        
        records = [].concat(records);
        if (records.length < 1) {
            return;
        }
        
        for (i = 0, len = records.length; i < len; i++) {
            record = records[i];
            
            record.join(this);
            
            if (record.dirty || record.phantom) {
                this.modified.push(record);
            }
        }
        
        index = this.data.length;
        this.data.addAll(records);
        
        if (this.allData) {
            this.allData.addAll(records);
        }
        
        if (this.snapshot) {
            this.snapshot.addAll(records);
        }
        
        // *** add ***
        this.totalLength += records.length;
        // *** end ***
        this.fireEvent("add", this, records, index);
    },
    
    remove : function (record) {
        if (Ext.isArray(record)) {
            Ext.each(record, function (r) {
                this.remove(r);
            }, this);
            return;
        }
        // *** add ***
        if (this != record.store) {
            return;
        }
        record.join(null);
        // *** end ***
        var index = this.data.indexOf(record);
    
        if (index > -1) {
            this.data.removeAt(index);
        }
        if (this.pruneModifiedRecords) {
            this.modified.remove(record);
        }
        // *** add ***
        if (this.allData) {
            this.allData.remove(record);
        }
        // *** end ***
        if (this.snapshot) {
            this.snapshot.remove(record);
        }
    
         // *** add ***
        this.totalLength--;
        // *** end ***
        
        if (!record.isNew()) {
            record.lastIndex = index;
            this.deleted.push(record);
        }
    
        if (index > -1) {
            this.fireEvent("remove", this, record, index);
        }
    },
    removeAll: function (silent) {
        // *** add ***
        var items = [].concat((this.snapshot || this.allData || this.data).items);
        // *** end ***
        // var items = [];
        // this.each(function (rec) {
        //     items.push(rec);
        // });
        
        this.clearData();
        
        // if (this.snapshot) {
        //     this.snapshot.clear();
        // }
        
        if (this.pruneModifiedRecords) {
            this.modified = [];
        }
        
        // *** add ***
        this.totalLength = 0;
        // *** end ***
        
        if (silent !== true) {
            this.fireEvent("clear", this, items);
        }
    },
    
    insert : function (index, records) {
        var i, record;
        
        records = [].concat(records);
        for (i = 0, len = records.length; i < len; i++) {
            record = records[i];
            
            this.data.insert(index + i, record);
            record.join(this);
            
            if (record.dirty || record.phantom) {
                this.modified.push(record);
            }
        }
        
        if (this.allData) {
            this.allData.addAll(records);
        }
        
        if (this.snapshot) {
            this.snapshot.addAll(records);
        }
        
        // *** add ***
        this.totalLength += records.length;
        // *** end ***
        this.fireEvent("add", this, records, index);
    },
    
    getById : function (id) {
        return (this.snapshot || this.allData || this.data).key(id);
    },
    clearData: function () {
        // *** add ***
        if (this.allData) {
            this.data = this.allData;
            delete this.allData;
        }
        
        if (this.snapshot) {
            this.data = this.snapshot;
            delete this.snapshot;
        }
        
        // *** end ***
        
        this.data.each(function (rec) {
            rec.join(null);
        });
        
        this.data.clear();
    },
    
    load : function (options) {
        if (options && options.params && (options.params.start > (this.snapshot || this.allData || this.data).getCount())) {
            options.params.start = start = this.start = 0;
        }
        
        return Ext.net.Store.superclass.load.call(this, options);
    },
    execute: function (action, rs, options, batch) {
        if (!Ext.data.Api.isAction(action)) {
            throw new Ext.data.Api.Error("execute", action);
        }
        options = Ext.applyIf(options || {}, {
            params: {}
        });
        if (batch !== undefined) {
            this.addToBatch(batch);
        }
        var doRequest = true;
        
        if (action === "read") {
            doRequest = this.fireEvent("beforeload", this, options);
            Ext.applyIf(options.params, this.baseParams);
        } else {
            if (this.writer.listful === true && this.restful !== true) {
                rs = (Ext.isArray(rs)) ? rs : [rs];
            } else if (Ext.isArray(rs) && rs.length === 1) {
                rs = rs.shift();
            }
            
            if ((doRequest = this.fireEvent("beforewrite", this, action, rs, options)) !== false) {
                this.writer.apply(options.params, this.baseParams, action, rs);
            }
        }
        
        if (doRequest !== false) {
            //var params = Ext.apply(options.params || {}, this.baseParams);
            var params = Ext.apply({}, options.params, this.baseParams);
            
            if (this.writer && this.proxy.url && !this.proxy.restful && !Ext.data.Api.hasUniqueUrl(this.proxy, action)) {
                params.xaction = action;
            }
            
            if (action === "read" && this.isPaging(params)) {
                (function () {
                    if (this.allData) {
                        this.data = this.allData;
                        delete this.allData;
                    }
                    
                    this.applyPaging();
                    this.fireEvent("datachanged", this);
                    var r = [].concat(this.data.items);
                    this.fireEvent("load", this, r, options);
                    
                    if (options.callback) {
                        options.callback.call(options.scope || this, r, options, true);
                    }
                }).defer(1, this);
                
                return true;
            }
            
            this.proxy.request(Ext.data.Api.actions[action], rs, params, this.reader, this.createCallback(action, rs), this, options);
        }
        
        return doRequest;
    },
    
    loadRecords : function (o, options, success) {
        if (this.isDestroyed === true) {
            return;
        }
        if (!o || success === false) {
            if (success !== false) {
                this.fireEvent("load", this, [], options);
            }
            
            if (options.callback) {
                options.callback.call(options.scope || this, [], options, false, o);
            }
            
            return;
        }
        var r = o.records,
            t = o.totalRecords || r.length;
        if (!options || options.add !== true) {
            if (this.pruneModifiedRecords) {
                this.modified = [];
            }

            var i = 0;
            
            for (i, len = r.length; i < len; i++) {
                r[i].join(this);
            }
            
            //if (this.snapshot) {
            //    this.data = this.snapshot;
            //    delete this.snapshot;
            //}
            
            this.clearData();
            this.data.addAll(r);
            this.totalLength = t;
            this.applySort();
            
            if (!this.allData) {
                this.applyPaging();
            }
            
            if (r.length > this.getCount()) {
                r = [].concat(this.data.items);
            }
            
            this.fireEvent("datachanged", this);
        } else {
            this.totalLength = Math.max(t, this.data.length + r.length);
            this.add(r);
        }
    
        this.fireEvent("load", this, r, options);
    
        if (options.callback) {
            options.callback.call(options.scope || this, r, options, true);
        }
    },
    
    loadData : function (o, append) {
        this.isPaging(Ext.apply({}, this.lastOptions ? this.lastOptions.params : null, this.baseParams));
        var r = this.reader.readRecords(o);
        this.loadRecords(r, Ext.apply({add: append}, this.lastOptions || {}), true);
    },
    getTotalCount : function () {
        // *** add ***
        if (this.allData) {
            return this.allData.getCount();
        }
        // *** end ***
        return this.totalLength || 0;
    },
    
    filterBy : function (fn, scope) {
        this.snapshot = this.snapshot || this.allData || this.data;
        this.data = this.queryBy(fn, scope || this);
        this.applyPaging();
        this.fireEvent("datachanged", this);
    },
    clearFilter : function (suppressEvent) {
        if (this.isFiltered()) {
            this.data = this.snapshot;
            delete this.snapshot;
            // *** add ***
            delete this.allData;
            this.applyPaging();
            // *** end ***
            if (suppressEvent !== true) {
                this.fireEvent("datachanged", this);
            }
        }
    },
    isFiltered : function () {
        // *** add ***
        return !!this.snapshot && this.snapshot != (this.allData || this.data);
        // *** end ***
        // return !!this.snapshot && this.snapshot != this.data;
    },
    queryBy : function (fn, scope) {
        // *** add ***
        var data = this.snapshot || this.allData || this.data;
        return data.filterBy(fn, scope || this);
    },
    
    collect : function (dataIndex, allowNull, bypassFilter) {
        var d = (bypassFilter === true ? this.snapshot || this.allData || this.data : this.data).items,
            v, 
            sv, 
            r = [], 
            l = {},
            i = 0,
            len;
        
        for (i, len = d.length; i < len; i++) {
            v = d[i].data[dataIndex];
            sv = String(v);
        
            if ((allowNull || !Ext.isEmpty(v)) && !l[sv]) {
                l[sv] = true;
                r[r.length] = v;
            }
        }
        
        return r;
    },
    findInsertIndex : function (record) {
        this.suspendEvents();
        var data = this.data.clone();
        this.data.add(record);
        this.applySort();
        var index = this.data.indexOf(record);
        this.data = data;
        // *** add ***
        this.totalLength--;
        // *** end ***
        this.resumeEvents();
        return index;
    },
    // *** add ***
    isPaging: function (params) {
        var pn = this.paramNames,
            start = params[pn.start],
            limit = params[pn.limit];
            
        if ((typeof start !== "number") || (typeof limit !== "number")) {
            delete this.start;
            delete this.limit;
            this.lastParams = params;

            return false;
        }
        
        this.start = start;
        this.limit = limit;
        delete params[pn.start];
        delete params[pn.limit];
        var lastParams = this.lastParams;
        this.lastParams = params;
        
        if (!this.proxy) {
            return true;
        }
        
        if (!lastParams) {
            return false;
        }
        
        var param;

        for (param in params) {
            if (params.hasOwnProperty(param) && (params[param] !== lastParams[param])) {
                return false;
            }
        }
        
        for (param in lastParams) {
            if (lastParams.hasOwnProperty(param) && (params[param] !== lastParams[param])) {
                return false;
            }
        }
        
        return true;
    },
    
    applyPaging : function () {
        var start = this.start, limit = this.limit;
        
        if ((typeof start === "number") && (typeof limit === "number")) {
            var allData = this.data, data = new Ext.util.MixedCollection(allData.allowFunctions, allData.getKey);
            
            if (start > allData.getCount()) {
                start = this.start = 0;
            }
            
            data.items = allData.items.slice(start, start + limit);
            data.keys = allData.keys.slice(start, start + limit);

            var len = data.length = data.items.length,
                map = {},
                i = 0;
            
            for (i; i < len; i++) {
                var item = data.items[i];
                map[data.getKey(item)] = item;
            }
            
            data.map = map;
            this.allData = allData;
            this.data = data;
        }
    },
    
    getAllRange : function (start, end) {
        return (this.snapshot || this.allData || this.data).getRange(start, end);
    },

    findPage : function (record) {
        if ((typeof this.limit === "number")) {
            return Math.ceil((this.allData || this.data).indexOf(record) / this.limit);
        }

        return -1;
    },

    openPage : function (pageIndex, callback) {
        if ((typeof pageIndex !== "number")) {
            pageIndex = this.findPage(pageIndex);
        }

        this.load({ 
            params : {
                start : (pageIndex - 1) * this.limit, 
                limit : this.limit
            }, 
            callback : callback 
        });
    }
});

Ext.ux.PagingToolbar = Ext.extend(Ext.PagingToolbar, {
    onLoad : function (store, r, o) {
        if (!this.rendered) {
            this.dsLoaded = [store, r, o];
            return;
        }
        
        var p = this.getParams();
        this.cursor = (o.params && o.params[p.start]) ? o.params[p.start] : 0;
        this.onChange();
    },
    
    onChange : function () {
        // *** add ***
        var t = this.store.getTotalCount(),
            s = this.pageSize;

        if (t === 0) {
            this.cursor = 0;
        } else if (this.cursor >= t) {
            this.cursor = (Math.ceil(t / s) - 1) * s;
        }
        // *** end ***

        var d = this.getPageData(),
            ap = d.activePage,
            ps = d.pages;

        // *** add ***    
        ap = ap > ps ? ps : ap;
        // *** end ***

        this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
        this.inputItem.setValue(ap);
        this.first.setDisabled(ap === 1);
        this.prev.setDisabled(ap === 1);
        this.next.setDisabled(ap === ps);
        this.last.setDisabled(ap === ps);
        this.refresh.enable();
        this.updateInfo();
        this.fireEvent("change", this, d);
    },
    
    onClear : function () {
        this.cursor = 0;
        this.onChange();
    },
    
    doRefresh : function () {
        // *** add ***
        delete this.store.lastParams;
        // *** end ***
        this.doLoad(this.cursor);
    },
    
    bindStore : function (store, initial) {
        var doLoad;
        if (!initial && this.store) {
            if (store !== this.store && this.store.autoDestroy) {
                this.store.destroy();
            } else {
                this.store.un("beforeload", this.beforeLoad, this);
                this.store.un("load", this.onLoad, this);
                this.store.un("exception", this.onLoadError, this);
                // *** add ***
                this.store.un("datachanged", this.onChange, this);
                this.store.un("add", this.onChange, this);
                this.store.un("remove", this.onChange, this);
                this.store.un("clear", this.onClear, this);
                // *** end ***
            }
            
            if (!store) {
                this.store = null;
            }
        }
        if (store) {
            store = Ext.StoreMgr.lookup(store);
            store.on({
                scope       : this,
                beforeload  : this.beforeLoad,
                load        : this.onLoad,
                exception   : this.onLoadError,
                // *** add ***
                datachanged : this.onChange,
                add         : this.onChange,
                remove      : this.onChange,
                clear       : this.onClear
                // *** end ***
            });
            doLoad = true;
        }
        
        this.store = store;
        
        if (doLoad) {
            this.onLoad(store, null, {});
        }
    }
});

Ext.reg("ux.paging", Ext.ux.PagingToolbar);