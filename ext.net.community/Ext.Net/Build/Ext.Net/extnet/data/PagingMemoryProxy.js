
// @source data/PagingMemoryProxy.js

Ext.data.PagingMemoryProxy = function (data, isUrl) {
	Ext.data.PagingMemoryProxy.superclass.constructor.call(this);
	this.data = data;
	this.isUrl = isUrl || false;		
	this.isNeedRefresh = this.isUrl;
	this.url = this.isUrl ? data : "";	
	this.isMemoryProxy = true;
};

Ext.extend(Ext.data.PagingMemoryProxy, Ext.data.MemoryProxy, {
    refreshData : function (data, store) {
        if (this.isUrl === true) {
            this.isNeedRefresh = true;
        } else {
            if (data && data !== null) {
                this.data = data;
            } else {
                store.callbackReload(store.warningOnDirty);
            }
        }
    },

    refreshByUrl : function (params, reader, callback, scope, arg) {
        var o = {
            method   : "GET",
            request  : {
                callback : callback,
                scope    : scope,
                arg      : arg,
                params   : params || {}
            },
            reader   : reader,
            url      : this.url,
            callback : this.loadResponse,
            scope    : this
        };

        if (this.activeRequest) {
            Ext.Ajax.abort(this.activeRequest);
        }

        this.activeRequest = Ext.Ajax.request(o);
    },

    loadResponse : function (o, success, response) {
        delete this.activeRequest;
        
        if (!success) {
            this.fireEvent("loadexception", this, o, response);
            o.request.callback.call(o.request.scope, null, o.request.arg, false);

            return;
        }

        try {
            if (o.reader.getJsonAccessor) {
                this.data = response.responseText;
            } else {
                this.data = response.responseXML;
            }

            if (!this.data) {
                throw { message : "The data is not available" };
            }
        } catch (e) {
            this.fireEvent("loadexception", this, o, response, e);
            o.request.callback.call(o.request.scope, null, o.request.arg, false);

            return;
        }

        this.isNeedRefresh = false;
        this.load(o.request.params, o.reader, o.request.callback, o.request.scope, o.request.arg);
    },
    
    doRequest : function (action, rs, params, reader, callback, scope, arg) {
        this.fireEvent("beforeload", this, params);
        
        params = params || {};

        if (this.isNeedRefresh === true) {
            this.refreshByUrl(params, reader, callback, scope, arg);

            return;
        }

        var result;
        
        try {
            result = reader.readRecords(this.data);
        } catch (e) {
            this.fireEvent("loadexception", this, null, arg, e);
            this.fireEvent("exception", this, "response", action, arg, null, e);
            callback.call(scope, null, arg, false);

            return;
        }

        if (params.gridfilters !== undefined) {
            var r = [],
                i,
                len;

            for (i = 0, len = result.records.length; i < len; i++) {
                if (params.gridfilters.call(this, result.records[i])) {
                    r.push(result.records[i]);
                }
            }
            result.records = r;
            result.totalRecords = result.records.length;
        }


        if (params.sort !== undefined) {
            var dir = String(params.dir).toUpperCase() === "DESC" ? -1 : 1,
                st = scope.fields.get(params.sort).sortType,
                fn = function (r1, r2) {
                    var v1 = st(r1), v2 = st(r2);
                    return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
                };

            result.records.sort(function (a, b) {
                var v = 0;
                
                v = (typeof (a) === "object") ? fn(a.data[params.sort], b.data[params.sort]) * dir : fn(a, b) * dir;
                
                if (v === 0) {
                    v = (a.index < b.index ? -1 : 1);
                }
                
                return v;
            });
        }

        if (params.start !== undefined && params.limit !== undefined) {
            result.records = result.records.slice(params.start, params.start + params.limit);
        }

        callback.call(scope, result, arg, true);
    }
});