
// @source data/Store.js

Ext.data.Record.AUTO_ID = -1;

Ext.data.Record.id = function (rec) {
    rec.phantom = true;
    return Ext.data.Record.AUTO_ID--;   
};

Ext.data.Record.prototype.commit = Ext.data.Record.prototype.commit.createInterceptor(function () {
    if (this.newRecord) {
        this.newRecord = false; 
    }
});

Ext.data.Record.prototype.isNew = function () {
    return this.newRecord;
};

Ext.data.Store.override({
    metaId : function () {
        if (this.reader.isArrayReader) {
            var id = Ext.num(parseInt(this.reader.meta.idIndex === 0 ? this.reader.meta.idIndex : (this.reader.meta.idIndex || this.reader.meta.id), 10), -1);

            if (id !== -1) {
                return this.reader.meta.fields[id].name;
            }
        }

        return this.reader.meta.idIndex || this.reader.meta.idProperty || this.reader.meta.idPath || this.reader.meta.id;
    }
});

Ext.net.Store = function (config) {
    Ext.apply(this, config);

    this.deleted = [];

    this.addEvents(
        "beforesave",
        "save",
        "saveexception",
        "commitdone",
        "commitfailed"
    );
        
    if (this.proxyId) {
        this.storeId = this.proxyId;
        Ext.StoreMgr.register(this);
    }

    if (this.updateProxy) {
        this.relayEvents(this.updateProxy, ["saveexception"]);
    }

    if (!Ext.isEmpty(this.updateProxy)) {
        this.on("saveexception", function (ds, o, response, e) {
            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": e.message }, null, null, null, null, o) !== false) {
                if (this.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, e.message);
                }
            }
        }, this);
    }

    if (this.proxy && !this.proxy.refreshByUrl && !this.proxy.isDataProxy) {
        this.on("loadexception", function (ds, o, response, e) {
            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": response.statusText }, null, null, null, null, o) !== false) {
                if (this.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, response.responseText);
                }
            }
        }, this);
    }

    if (this.beforeLoadParams) {
        this.on("beforeload", this.beforeLoadParams);
    }

    if (this.beforeSaveParams) {
        if (this.restful) {
            this.on("beforewrite", function (store, action, rs, options) { 
                return this.beforeSaveParams(store, options); 
            }, this);
        } else {
            this.on("beforesave", this.beforeSaveParams);
        }
    }

    if (this.autoSave || this.restful) {
        this.writer = new Ext.data.JsonWriter({ writeAllFields: this.saveAllFields });
        this.on("write", function (store, action, result, res, rs) {
            this.fireEvent("save", store, result, res);
        }, this);
    }
    
    if (this.proxy instanceof Ext.data.PagingMemoryProxy && (this.autoLoad || this.deferLoad)) {        
        this.deferAutoLoad = true;
        this.autoLoad = false;        
    }
    
    this.on("load", function () {
        this.isLoaded = true;
    }, this, { single : true });

    Ext.net.Store.superclass.constructor.call(this, config);
    
    if (this.deferAutoLoad) {
        this.load(typeof this.deferAutoLoad === "object" ? this.deferAutoLoad : undefined);
        this.deferAutoLoad = false;
    }
};

Ext.extend(Ext.net.Store, Ext.data.GroupingStore, {
    pruneModifiedRecords : true,
    warningOnDirty : true,
    /* TODO: LOCALIZE */
    dirtyWarningTitle : "Uncommitted Changes",
    /* TODO: LOCALIZE */
    dirtyWarningText : "You have uncommitted changes.  Are you sure you want to reload data?",
    updateProxy : null,

    // "none" - no refresh after saving
    // "always" - always refresh after saving
    // "auto" - auto refresh. If no new records then refresh doesn't perfom. If new records exists then refresh will be perfom for refresh id fields
    refreshAfterSave     : "Auto",
    useIdConfirmation    : false,
    showWarningOnFailure : true,
    autoSave      : false,
    saveAllFields : true,
    
    sortData : function () {
        var sortInfo  = this.hasMultiSort ? this.multiSortInfo : this.sortInfo,
            direction = sortInfo.direction || "ASC",
            sorters   = sortInfo.sorters,
            sortFns   = [];

        //if we just have a single sorter, pretend it's the first in an array
        if (!this.hasMultiSort) {
            sorters = [{direction: direction, field: sortInfo.field}];
        }
        
        if (!sorters || sorters.length === 0) {
            return;
        }

        //create a sorter function for each sorter field/direction combo
        var i,
            j;

        for (i = 0, j = sorters.length; i < j; i++) {
            if (sorters[i] && sorters[i].field) {
                sortFns.push(this.createSortFunction(sorters[i].field, sorters[i].direction));
            }
        }
        
        if (sortFns.length === 0) {
            return;
        }

        //the direction modifier is multiplied with the result of the sorting functions to provide overall sort direction
        //(as opposed to direction per field)
        var directionModifier = direction.toUpperCase() === "DESC" ? -1 : 1;

        //create a function which ORs each sorter together to enable multi-sort
        var fn = function (r1, r2) {
            var result = sortFns[0].call(this, r1, r2);

            //if we have more than one sorter, OR any additional sorter functions together
            if (sortFns.length > 1) {
                var i,
                    j;

                for (i = 1, j = sortFns.length; i < j; i++) {
                    result = result || sortFns[i].call(this, r1, r2);
                }
            }

            return directionModifier * result;
        };
        
        if (this.isPagingStore() && this.allData) {
            this.data = this.allData;
            delete this.allData;
        }

        //sort the data
        this.data.sort(direction, fn);

        if (this.snapshot && this.snapshot != this.data) {
            this.snapshot.sort(direction, fn);
        }
        
        if (this.applyPaging) {
            this.applyPaging();
        }
    },
    
    multiSort: function (sorters, direction) {
        this.hasMultiSort = true;
        direction = direction || "ASC";

        if (this.multiSortInfo && direction == this.multiSortInfo.direction) {
            direction = direction.toggle("ASC", "DESC");
        }

        this.multiSortInfo = {
            sorters  : sorters,
            direction: direction
        };

        if (!this.remoteSort) {
            this.applySort();
            this.fireEvent('datachanged', this);
        } else {
            var sortInfo   = this.sortInfo || null;
            sorters = sorters || [{}];
            
            if (sorters.length === 1) {
                if (!sorters[0].field) {
                    return;
                }
                this.sortInfo = {field: sorters[0].field, direction: sorters[0].direction};
            } else {
                var field = [],
                    i,
                    j;

                for (i = 0, j = sorters.length; i < j; i++) {
                    if (sorters[i].field) {
                        field.push(sorters[i].field + ":" + (sorters[i].direction || "ASC"));
                    }
                }
                
                this.sortInfo = {field: field.join(","), direction: direction};
            }
            
            this.load(this.lastOptions);

            if (sortInfo) {
                this.sortInfo = sortInfo;
            }              
        }
    },

    addRecord : function (values, commit, clearFilter) {
        var rowIndex = this.data.length,
            record = this.insertRecord(rowIndex, values, false, commit, clearFilter);

        return {
            index: rowIndex,
            record: record
        };
    },

    addSortedRecord : function (values, commit) {
        return this.insertRecord(0, values, true, commit);
    },

    insertRecord : function (rowIndex, values, asSorted, commit, clearFilter) {
        if (clearFilter !== false) {
            this.clearFilter(false);
        }
        values = values || {};

        var f = this.recordType.prototype.fields, 
            dv = {},
            i = 0;

        for (i; i < f.length; i++) {
            dv[f.items[i].name] = f.items[i].defaultValue;

            if (!Ext.isEmpty(values[f.items[i].name])) {
                values[f.items[i].name] = f.items[i].convert(values[f.items[i].name], values);
            }
        }

        var record = new this.recordType(dv, values[this.metaId()]), v;

        record.newRecord = true;        

        record.beginEdit();
        
        for (v in values) {
            record.set(v, values[v]);
        }

        if (!Ext.isEmpty(this.metaId())) {
            record.set(this.metaId(), record.id);
        }

        record.endEdit();
        
        if (this.groupField && !asSorted) {
            this.totalLength = Math.max(1, this.data.length + 1);
            this.add(record);
            this.fireEvent("load", this, record, { add: true });

            this.suspendEvents();
            this.applyGrouping(true);
            this.resumeEvents();
            this.fireEvent("datachanged", this);
        } else {
            if (!asSorted) {
                this.insert(rowIndex, record);
            } else {
                this.addSorted(record);
            }
        }

        if (commit) {
            record.phantom = false;
            record.commit();            
        }
        
        if (!Ext.isDefined(this.writer) && this.modified.indexOf(record) === -1) {
            this.modified.push(record);
        }

        return record;
    },

    addField : function (field, index, clear) {
        if (typeof field === "string") {
            field = { name: field };
        }

        if (Ext.isEmpty(this.recordType)) {
            this.recordType = Ext.data.Record.create([]);
        }

        field = new Ext.data.Field(field);

        if (Ext.isEmpty(index) || index === -1) {
            this.recordType.prototype.fields.replace(field);
        } else {
            this.recordType.prototype.fields.insert(index, field);
        }

        if (typeof field.defaultValue !== "undefined") {
            this.each(function (r) {
                if (typeof r.data[field.name] === "undefined") {
                    r.data[field.name] = field.defaultValue;
                }
            });
        }

        if (clear) {
            this.clearMeta();
        }
    },
    
    clearMeta : function () {
        if (this.reader.ef) {
            delete this.reader.ef;
            this.reader.buildExtractors();
        }
    },

    removeFields : function () {
        if (this.recordType) {
            this.recordType.prototype.fields.clear();
        }

        this.removeAll();
    },

    removeField : function (name) {
        this.recordType.prototype.fields.removeKey(name);

        this.each(function (r) {
            delete r.data[name];

            if (r.modified) {
                delete r.modified[name];
            }
        });
    },

    prepareRecord : function (data, record, options, isNew) {
        var newData = {},
            field;

        if (options.filterRecord && options.filterRecord(record) === false) {
            return;
        }

        if (options.visibleOnly && options.grid) {
            var cm = options.grid.getColumnModel(),
                i;

            for (i in data) {
                var columnIndex = cm.findColumnIndex(i);

                if (columnIndex > -1 && !cm.isHidden(columnIndex)) {
                    newData[i] = data[i];
                }
            }

            data = newData;
        }

        if (options.dirtyRowsOnly && !isNew) {
            if (!record.dirty) {
                return;
            }
        }

        if ((options.dirtyCellsOnly === true || (options.dirtyCellsOnly !== false && this.saveAllFields === false)) && !isNew) {
            var j;

            for (j in data) {
                if (record.isModified(j)) {
                    newData[j] = data[j];
                }
            }

            data = newData;
        }

        var k;

        for (k in data) {
            if (options.filterField && options.filterField(record, k, data[k]) === false) {
                data[k] = undefined;
            }
            
            field = this.getFieldByName(k);
            
            if (Ext.isEmpty(data[k], false) && this.isSimpleField(k, field)) {
                switch (field.submitEmptyValue) {
                case "null":
                    data[k] = null;        
                    break;
                case "emptystring":
                    data[k] = "";        
                    break;
                default:
                    data[k] = undefined;        
                    break;
                }
            }
        }
        
        if (options.mappings !== false && this.saveMappings !== false) {
            var m,
                map = record.fields.map, 
                mappings = {};
            
            Ext.iterate(data, function (prop, value) {            
                m = map[prop];

                if (m) {
                    mappings[m.mapping ? m.mapping : m.name] = value;
                }
            });
 
            if (options.excludeId !== true) {
                mappings[this.metaId()] = record.id; 
            }

            data = mappings;
        }

        return data;
    },
    
    getFieldByName : function (name) {
        var i = 0;

        for (i; i < this.fields.getCount(); i++) {
            var field = this.fields.get(i);

            if (name === (field.mapping || field.name)) {
                return field;
            }
        }        
    },

    isSimpleField: function (name, field) {
        var f = field || this.getFieldByName(name),
            type = f && f.type ? f.type.type : "";

        return type === "int" || type === "float" || type === "boolean" || type === "date";
    },

    getRecordsValues : function (options) {
        options = options || {};

        var records = (options.records ? options.records : (options.currentPageOnly ? this.getRange() : this.getAllRange())) || [],
            values = [],
            i;

        for (i = 0; i < records.length; i++) {
            var obj = {}, dataR;
            
            dataR = Ext.apply(obj, records[i].data);

            if (this.metaId()) {
                obj[this.metaId()] = options.excludeId === true ? undefined : records[i].id;
            }
                        
            dataR = this.prepareRecord(dataR, records[i], options);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    refreshIds : function (newRecordsExists, deletedExists, dataAbsent) {
        switch (this.refreshAfterSave) {
        case "None":
            return;
        case "Always":
            if (dataAbsent) {
                this.reload();
            } else {
                this.reload(undefined, true);
            }
            break;
        case "Auto":
            if (newRecordsExists || deletedExists) {
                if (dataAbsent) {
                    this.reload();
                } else {
                    this.reload(undefined, true);
                }
            }
            break;
        }
    },

    reload : function (options, baseReload) {
        if (this.proxy.refreshByUrl && baseReload !== true) {
            var opts = options || {};            
            this.callbackReload(this.warningOnDirty, opts);
        } else {
            if (options && options.params && options.params.submitDirectEventConfig) {
                delete options.params.submitDirectEventConfig;
            }

            Ext.net.Store.superclass.reload.call(this, options);
        }
    },

    load : function (options) {
        var loadData = function (store, options) {
        
            store.on("beforeload", function () {
                this.deleted = [];
                this.modified = [];
            }, store, { single : true });            

            return Ext.net.Store.superclass.load.call(store, options);
        };

        if (this.warningOnDirty && this.isDirty() && !this.silentMode) {
            this.silentMode = false;
            Ext.MessageBox.confirm(
                this.dirtyWarningTitle,
                this.dirtyWarningText,
                function (btn, text) {
                    return (btn === "yes") ? loadData(this, options) : false;
                },
                this
            );
        } else {
            return loadData(this, options);
        }
    },

    save : function (options) {
        if (this.restful) {
            Ext.net.Store.superclass.save.call(this, options);
            return;
        }

        if (Ext.isEmpty(this.updateProxy)) {
            this.callbackSave(options);

            return;
        }

        options = options || {};

        if (this.fireEvent("beforesave", this, options) !== false) {
            var json = this.getChangedData(options);

            if (json.length > 0) {
                var p = Ext.apply(options.params || {}, { data: "{" + json + "}" });
                this.updateProxy.save(p, this.reader, this.recordsSaved, this, options);
            } else {
                this.fireEvent("commitdone", this, options);
            }
        }
    },

    getChangedData : function (options) {
        options = options || {};
        var json = "",
            d = this.deleted,
            m = this.modified;

        if (d.length > 0) {
            json += '"Deleted":[';

            var exists = false,
                i = 0;

            for (i; i < d.length; i++) {
                var obj = {},
                    list = Ext.apply(obj, d[i].data);

                if (this.metaId()) {
                    /*&& Ext.isEmpty(list[this.metaId()], false)*/
                    list[this.metaId()] = d[i].id;
                }

                list = this.prepareRecord(list, d[i], options);

                if (!Ext.isEmptyObj(list)) {
                    json += Ext.util.JSON.encode(list) + ",";
                    exists = true;
                }
            }

            if (exists) {
                json = json.substring(0, json.length - 1) + "]";
            } else {
                json = "";
            }
        }

        var jsonUpdated = "",
            jsonCreated = "",
            j = 0;

        for (j; j < m.length; j++) {

            var obj2 = {},
                list2 = Ext.apply(obj2, m[j].data);

            if (this.metaId()) {
                /* && Ext.isEmpty(list2[this.metaId()], false)*/
                list2[this.metaId()] = m[j].id;
            }

            list2 = this.prepareRecord(list2, m[j], options, m[j].isNew());
            
            if (m[j].isNew() && this.skipIdForNewRecords !== false && !this.useIdConfirmation) {
                list2[this.metaId()] = undefined;
            }

            if (!Ext.isEmptyObj(list2)) {
                if (m[j].isNew()) {
                    jsonCreated += Ext.util.JSON.encode(list2) + ",";
                } else {
                    jsonUpdated += Ext.util.JSON.encode(list2) + ",";
                }
            }

        }

        if (jsonUpdated.length > 0) {
            jsonUpdated = jsonUpdated.substring(0, jsonUpdated.length - 1) + "]";
        }

        if (jsonCreated.length > 0) {
            jsonCreated = jsonCreated.substring(0, jsonCreated.length - 1) + "]";
        }

        if (jsonUpdated.length > 0) {
            if (json.length > 0) {
                json += ",";
            }

            json += '"Updated":[';
            json += jsonUpdated;
        }

        if (jsonCreated.length > 0) {
            if (json.length > 0) {
                json += ",";
            }

            json += '"Created":[';
            json += jsonCreated;
        }

        return options.encode ? Ext.util.Format.htmlEncode(json) : json;
    },

    getByDataId : function (id) {
        if (!this.metaId()) {
            return undefined;
        }

        var m = this.modified, 
            i;

        for (i = 0; i < m.length; i++) {
            if (m[i].data[this.metaId()] === id) {
                return m[i];
            }
        }

        return undefined;
    },

    recordsSaved : function (o, options, success) {
        if (!o || success === false) {
            if (success !== false) {
                this.fireEvent("save", this, options);
            }

            if (options.callback) {
                options.callback.call(options.scope || this, options, false);
            }

            if (this.autoSave && success === false) {
                this.rejectDeleting();
            }

            return;
        }

        var serverSuccess = o.success,
            msg = o.msg;
            
        this.responseSaveData = o.data || null;

        this.fireEvent("save", this, options, { message: msg });

        if (options.callback) {
            options.callback.call(options.scope || this, options, true);
        }

        var serviceResult = o.data || {},
            newRecordsExists = false,
            deletedExists = this.deleted.length > 0,
            m = this.modified,
            j;

        for (j = 0; j < m.length; j++) {
            if (m[j].isNew()) {
                newRecordsExists = true;
                break;
            }
        }

        if (this.useIdConfirmation) {
            if (Ext.isEmpty(serviceResult.confirm) && serverSuccess) {
                msg = "The confirmation list is absent";
                this.fireEvent("commitfailed", this, msg);
                this.fireEvent("exception", this, "remote", "write", {}, {}, { message: msg });

                if (this.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure({ status: "", statusText: "" }, msg);
                }

                return;
            }

            if (!Ext.isEmpty(serviceResult.confirm)) {
                var r = serviceResult.confirm,
                    failCount = 0,
                    i = 0;

                for (i; i < r.length; i++) {
                    if (r[i].s === false) {
                        failCount++;
                    } else {
                        var record = this.getById(r[i].oldId) || this.getByDataId(r[i].oldId);

                        if (record) {                            
                            if (record.isNew()) {
                                this.updateRecordId(record, r[i].newId || r[i].oldId);
                            }
                            record.phantom = false;
                            record.commit();                            
                        } else {
                            var d = this.deleted,
                                i2 = 0;

                            for (i2; i2 < d.length; i2++) {
                                //do not replace == by ===
                                if (this.metaId() && d[i2].id == r[i].oldId) {
                                    this.deleted.splice(i2, 1);
                                    failCount--;
                                    break;
                                }
                            }
                            failCount++;
                        }
                    }
                }

                if (failCount > 0 && serverSuccess) {
                    msg = "Some records have no success confirmation!";
                    this.fireEvent("commitfailed", this, msg);
                    this.fireEvent("exception", this, "remote", "write", {}, {}, { message: msg });

                    if (this.showWarningOnFailure) {
                        Ext.net.DirectEvent.showFailure({ status: "", statusText: "" }, msg);
                    }

                    return;
                }

                if (failCount === 0 && serverSuccess) {
                    this.modified = [];
                    this.deleted = [];
                }
            }
        } else if (serverSuccess) {
            this.commitChanges();
        }

        if (!serverSuccess) {
            this.fireEvent("commitfailed", this, msg);
            this.fireEvent("exception", this, "remote", "write", {}, {}, { message: msg });

            if (this.showWarningOnFailure) {
                Ext.net.DirectEvent.showFailure({ status: "", statusText: "" }, msg);
            }

            if (this.autoSave) {
                this.rejectDeleting();
            }

            return;
        }

        this.fireEvent("commitdone", this, options);

        var dataAbsent = true;

        if (serviceResult.data && serviceResult.data !== null && this.proxy.refreshData) {
            dataAbsent = false;
            this.proxy.refreshData(serviceResult.data);

            if (this.isPagingStore()) {
                this.loadData(serviceResult.data);
            }
        }

        this.refreshIds(newRecordsExists, deletedExists, dataAbsent);
    },

    isPagingStore : function () {
        return !!(this.isPaging && this.applyPaging && this.openPage && this.findPage);
    },

    getDeletedRecords : function () {
        return this.deleted;
    },

    remove : function (record) {
        if (Ext.isArray(record)) {
            Ext.each(record, function (r) {
                this.remove(r);
            }, this);
        } 
        
        if (!record.isNew()) {
            record.lastIndex = this.indexOf(record);
            this.deleted.push(record);
        }

        Ext.net.Store.superclass.remove.call(this, record);
    },

    commitChanges : function () {
        var i,
            length;

        for (i = 0, length = this.modified.length; i < length; i++) {
            this.modified[i].phantom = false;
        }
        
        Ext.net.Store.superclass.commitChanges.call(this);

        this.deleted = [];
    },

    rejectChanges : function () {
        Ext.net.Store.superclass.rejectChanges.call(this);

        var d = this.deleted.slice(0),
            i,
            len;

        this.deleted = [];

        for (i = 0, len = d.length; i < len; i++) {
            this.insert(d[i].lastIndex || 0, d[i]);
            d[i].reject();
        }
    },

    isDirty : function () {
        return (this.deleted.length > 0 || this.modified.length > 0) ? true : false;
    },

    prepareCallback : function (context, options) {
        options = options || {};
        options.params = options.params || {};

        if (context.fireEvent("beforesave", context, options) !== false) {
            var json = context.getChangedData(options);

            if (json.length > 0) {
                var p = { data: "{" + json + "}", extraParams: options.params };
                return p;
            } else {
                context.fireEvent("commitdone", context, options);
            }
        }
        
        return null;
    },

    callbackHandler : function (response, result, context, type, action, extraParams, o) {
        try {
            var responseObj = result.serviceResponse;

            result = { success: responseObj.success, msg: responseObj.message, data: responseObj.data };
        } catch (e) {
            context.fireEvent("saveexception", context, o, response, e);
            context.fireEvent("exception", context, "remote", "write", o, response, e);

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": e.message }, null, null, null, null, o) !== false) {
                if (context.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, e.message);
                }
            }

            return;
        }
        context.recordsSaved(result, {}, true);
    },

    silentMode : false,

    callbackRefreshHandler : function (response, result, context, type, action, extraParams, o) {
        var p = context.proxy;

        try {
            var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message || null, data: responseObj.data || {} };
        } catch (e) {
            context.fireEvent("loadexception", context, o, response, e);
            context.fireEvent("exception", context, "remote", "read", o, response, e);

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": e.message }, null, null, null, null, o) !== false) {
                if (context.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, e.message);
                }
            }

            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || this, [], o, false);
            }

            return;
        }

        if (result.success === false) {
            context.fireEvent("loadexception", context, o, response, { message: result.msg });
            context.fireEvent("exception", context, "remote", "read", o, response, { message: result.msg });

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": result.msg }, null, null, null, null, o) !== false) {
                if (context.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, result.msg);
                }
            }

            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || this, [], o, false);
            }

            return;
        }

        if (p.refreshData) {
            if (result.data.data && result.data.data !== null) {
                p.refreshData(result.data.data);

                if (context.isPagingStore()) {
                    context.loadData(result.data.data);
                }
            } else {
                p.refreshData({});

                if (context.isPagingStore()) {
                    context.loadData({});
                }
            }
        }

        if (o && o.userCallback) {
            o.callback = o.userCallback;
            o.userCallback = undefined;
            o.scope = o.userScope;
            o.userScope = undefined;
        }

        if (!context.isPagingStore()) {
            context.silentMode = true;
            context.reload(o, true);
            context.silentMode = false;
        } else {
            if (o && o.callback) {
                o.callback.call(o.scope || this, [], o, true);
            }
        }
    },

    callbackErrorHandler : function (response, result, context, type, action, extraParams, o) {
        context.fireEvent("saveexception", context, o, response, { message: result.errorMessage || response.statusText });
        context.fireEvent("exception", context, "response", "write", o, response, { message: result.errorMessage || response.statusText });
        
        if (o.showWarningOnFailure !== false && o.cancelFailureWarning !== true && Ext.isEmpty(result, false)) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }

        if (context.autoSave) {
            context.rejectDeleting();
        }
    },

    callbackRefreshErrorHandler : function (response, result, context, type, action, extraParams, o) {
        context.fireEvent("loadexception", context, o, response, { message: result.errorMessage || response.statusText });
        context.fireEvent("exception", context, "response", "read", o, response, { message: result.errorMessage || response.statusText });
        
        if (o && o.userCallback) {
            o.userCallback.call(o.userScope || this, [], o, false);
        }

        if (o.showWarningOnFailure !== false && o.cancelFailureWarning !== true && Ext.isEmpty(result, false)) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }
    },

    callbackSave: function (options) {
        var requestObject = this.prepareCallback(this, options);

        if (requestObject !== null) {
            var config = {},
                ac = this.directEventConfig;

            ac.userSuccess = this.callbackHandler;
            ac.userFailure = this.callbackErrorHandler;
            ac.extraParams = requestObject.extraParams;
            ac.enforceFailureWarning = !this.hasListener("saveexception") && !this.hasListener("exception");

            Ext.apply(config, ac, {
                control: this,
                eventType: "postback",
                action: "update",
                serviceParams: requestObject.data
            });
            Ext.net.DirectEvent.request(config);
        }
    },

    submitData : function (data, options) {
        if (Ext.isEmpty(data)) {
            data = this.getRecordsValues(options);
        }
        
        if (!data || data.length === 0) {
            return false;
        } 

        data = Ext.encode(data);

        if (options && options.encode) {
            data = Ext.util.Format.htmlEncode(data);
        }

        if (Ext.isEmpty(this.updateProxy)) {
            options = { params: (options && options.params) ? options.params : {} };

            if (this.fireEvent("beforesave", this, options) !== false) {

                var config = {}, ac = this.directEventConfig;

                ac.userSuccess = this.submitSuccess;
                ac.userFailure = this.submitFailure;
                ac.extraParams = options.params;
                ac.enforceFailureWarning = !this.hasListener("saveexception") && !this.hasListener("exception");

                Ext.apply(config, ac, {
                    control: this,
                    eventType: "postback",
                    action: "submit",
                    serviceParams: data
                });

                Ext.net.DirectEvent.request(config);
            }
        } else {
            options = { params: (options && options.params) ? options.params : {} };

            if (this.fireEvent("beforesave", this, options) !== false) {
                var p = Ext.apply(options.params || {}, { data: data });
                this.updateProxy.save(p, this.reader, this.finishSubmit, this, options);
            }
        }
    },

    finishSubmit : function (o, options, success) {
        if (!o || success === false) {

            if (success !== false) {
                this.fireEvent("save", this, options);
            }

            return;
        }

        var serverSuccess = o.success,
            msg = o.msg;

        if (!serverSuccess) {
            this.fireEvent("saveexception", this, options, {}, { message: msg });
            this.fireEvent("exception", this, "remote", "write", options, {}, { message: msg });

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage": msg }, null, null, null, null, o) !== false) {
                if (this.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure({ status: 200, statusText: "OK" }, msg);
                }
            }

            return;
        }

        this.fireEvent("save", this, options, { message: msg });
    },

    submitFailure : function (response, result, context, type, action, extraParams, o) {
        context.fireEvent("saveexception", context, {}, response, { message: result.errorMessage || response.statusText });
        context.fireEvent("exception", context, "response", "write", o, response, { message: result.errorMessage || response.statusText });

        if (o.showWarningOnFailure !== false && o.cancelFailureWarning !== true && Ext.isEmpty(result, false)) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }
    },

    submitSuccess: function (response, result, context, type, action, extraParams, o) {
        try {
            var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message };
        } catch (e) {
            context.fireEvent("saveexception", context, {}, response, e);
            context.fireEvent("exception", context, "remote", "write", o, response, e);

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage": e.message }, null, null, null, null, o) !== false) {
                if (context.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, e.message);
                }
            }

            return;
        }

        if (!result.success) {
            context.fireEvent("saveexception", context, {}, response, { message: result.msg });
            context.fireEvent("exception", context, "remote", "write", o, response, { message: result.msg });

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage": result.msg }, null, null, null, null, o) !== false) {
                if (context.showWarningOnFailure) {
                    Ext.net.DirectEvent.showFailure(response, result.msg);
                }
            }

            return;
        }

        context.fireEvent("save", context, { message: result.msg });
    },

    callbackReload : function (dirtyConfirm, reloadOptions) {
        var options = Ext.applyIf(reloadOptions || {}, this.lastOptions);

        options.params = options.params || {};

        var reload = function (store, options) {
            if (store.fireEvent("beforeload", store, options) !== false) {
                store.storeOptions(options);
				store.deleted = [];
                store.modified = [];

                var config = {},
                    ac = store.directEventConfig;

                ac.userSuccess = store.callbackRefreshHandler;
                ac.userFailure = store.callbackRefreshErrorHandler;
                ac.extraParams = options.params;
                ac.enforceFailureWarning = !store.hasListener("loadexception") && !store.hasListener("exception");
                config.userCallback = options.callback;
                config.userScope = options.scope;

                Ext.apply(config, ac, { control: store, eventType: "postback", action: "refresh" });
                Ext.net.DirectEvent.request(config);
            }
        };

        if (dirtyConfirm && this.isDirty()) {
            Ext.MessageBox.confirm(
                this.dirtyWarningTitle,
                this.dirtyWarningText, 
                function (btn, text) {
                    if (btn === "yes") {
                        reload(this, options);
                    }
                }, 
                this
            );
        } else {
            reload(this, options);
        }
    },

    getAllRange : function (start, end) {
        return this.getRange(start, end);
    },

    updateRecordId : function (id, newId, silent) {
        var record = (id instanceof Ext.data.Record) ? id : this.getById(id);

        if (Ext.isEmpty(record)) {
            throw new Ext.data.Store.Error("Record with id='" + id + "' not found");
        }

        record._phid = record.id;

        record.id = newId;

        if (this.metaId()) {
            record.data[this.metaId()] = record.id;
        }

        this.reMap(record);

        if (silent === false) {
            this.fireEvent("update", this, record, Ext.data.Record.EDIT);
        }
    },

    removeFromBatch : function (batch, action, data) {
        var b = this.batches,
            key = this.batchKey + batch,
            o = b[key],
            arr;

        if (o) {
            arr = o.data[action] || [];
            o.data[action] = arr.concat(data);
            
            if (o.count === 1) {
                data = o.data;
                delete b[key];
                //this.fireEvent('save', this, batch, data);
            } else {
                --o.count;
            }
        }
        this.deleted = [];
    },

    rejectDeleting : function () {
        var d = this.deleted.slice(0),
            i = d.length - 1;

        this.deleted = [];
        
        for (i; i >= 0; i--) {
            this.insert(d[i].lastIndex || 0, d[i]);
            d[i].reject();
        }
    }
});