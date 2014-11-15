
// @source data/PageProxy.js

Ext.net.PageProxy = function () {
    var api = {};
    
    api[Ext.data.Api.actions.read] = true;
    Ext.net.PageProxy.superclass.constructor.call(this, {
        api: api
    });
};

Ext.extend(Ext.net.PageProxy, Ext.data.DataProxy, {
    ro : {},
    isDataProxy : true,

    doRequest : function (action, rs, params, reader, callback, scope, arg) {
        if (this.fireEvent("beforeload", this, params) !== false) {
            this.ro = {
                params  : params || {},
                request : {
                    callback : callback,
                    scope    : scope,
                    arg      : arg
                },
                reader   : reader,
                callback : this.loadResponse,
                scope    : this
            };

            var config = {},
                ac = scope.directEventConfig;

            ac.userSuccess = this.successHandler;
            ac.userFailure = this.errorHandler;
            ac.extraParams = params;
            ac.enforceFailureWarning = !this.hasListener("loadexception");

            Ext.apply(config, ac, { 
                control   : scope, 
                eventType : "postback", 
                action    : "refresh" 
            });
            
            Ext.net.DirectEvent.request(config);
        } else {
            callback.call(scope || this, null, arg, false);
        }
    },

    successHandler : function (response, result, context, type, action, extraParams) {
        var p = context.proxy;

        try {
            var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message || null, data: responseObj.data || {} };
        } catch (e) {
            context.fireEvent("loadexception", context, {}, response, e);
            context.fireEvent("exception", context, "remote", "read", {}, response, e);
            p.ro.request.callback.call(p.ro.request.scope, null, p.ro.request.arg, false);

            if (p.ro.request.scope.showWarningOnFailure) {
                Ext.net.DirectEvent.showFailure(response, e.message);
            }

            return;
        }

        if (result.success === false) {
            context.fireEvent("loadexception", context, {}, response, { message: result.msg });
            context.fireEvent("exception", context, "remote", "read", {}, response, { message: result.msg });
            p.ro.request.callback.call(p.ro.request.scope, null, p.ro.request.arg, false);

            if (p.ro.request.scope.showWarningOnFailure) {
                Ext.net.DirectEvent.showFailure(response, result.msg);
            }

            return;
        }

        try {
            var meta = p.ro.reader.meta,
                rebuild = false;

            if (Ext.isEmpty(meta.totalProperty)) {
                rebuild = true;
                meta.totalProperty = "total";
            }

            if (Ext.isEmpty(meta.root)) {
                rebuild = true;
                meta.root = "data";
            }

            if (rebuild) {
                delete p.ro.reader.ef;
                p.ro.reader.buildExtractors();
            }

            if (Ext.isEmpty(result.data[meta.root])) {
                result.data[meta.root] = [];
            }

            result = p.ro.reader.readRecords(result.data);

        } catch (ex) {
            p.fireEvent("loadexception", p, p.ro, response, ex);
            p.fireEvent("exception", p, "remote", "read", p.ro, response, ex);
            p.ro.request.callback.call(p.ro.request.scope, null, p.ro.request.arg, false);

            if (p.ro.request.scope.showWarningOnFailure) {
                Ext.net.DirectEvent.showFailure(response, ex.message);
            }

            return;
        }
        
        p.fireEvent("load", p, p.ro, p.ro.request.arg);
        p.ro.request.callback.call(p.ro.request.scope, result, p.ro.request.arg, true);

    },

    errorHandler : function (response, result, context, type, action, extraParams) {
        var p = context.proxy;

        p.fireEvent("loadexception", p, p.ro, response, {message : response.responseText});
        p.fireEvent("exception", p, "response", "read", p.ro, response, {message : response.responseText});
        p.ro.request.callback.call(p.ro.request.scope, null, p.ro.request.arg, false);

        if (p.ro.request.scope.showWarningOnFailure) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }
    }
});