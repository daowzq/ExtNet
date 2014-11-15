
// @source data/HttpWriteProxy.js

Ext.net.HttpWriteProxy = function (conn) {
    Ext.net.HttpWriteProxy.superclass.constructor.call(this, {});
    
    this.conn = conn;
    this.useAjax = !conn || !conn.events;
        
    if (conn && conn.handleSaveResponseAsXml) {
        this.handleSaveResponseAsXml = conn.handleSaveResponseAsXml;
    }
};

Ext.extend(Ext.net.HttpWriteProxy, Ext.data.HttpProxy, {
    handleSaveResponseAsXml : false,
    
    save : function (params, reader, callback, scope, arg) {
        if (this.fireEvent("beforesave", this, params) !== false) {
            var o = {
                params   : params || {},
                request  : {
                    callback : callback,
                    scope    : scope,
                    arg      : arg
                },
                reader   : reader,
                scope    : this,
                callback : this.saveResponse
            };
            
            if (this.conn.json) {
                o.jsonData = params;
            }
            
            if (this.useAjax) {
                Ext.applyIf(o, this.conn);
                o.url = this.conn.url;
                
                if (this.activeRequest) {
                    Ext.Ajax.abort(this.activeRequest);
                }

                this.activeRequest = Ext.Ajax.request(o);
            } else {
                this.conn.request(o);
            }
        } else {
            callback.call(scope || this, null, arg, false);
        }
    },

    saveResponse : function (o, success, response) {
        delete this.activeRequest;
        
        if (!success) {
            this.fireEvent("saveexception", this, o, response, { message : response.statusText });
            this.fireEvent("exception", this, "response", "write", o, response, { message : response.statusText });
            o.request.callback.call(o.request.scope, null, o.request.arg, false);

            return;
        }
        
        var result;
        
        try {
            if (!this.handleSaveResponseAsXml) {
                var json = response.responseText,
                    responseObj = eval("(" + json + ")");
                    
                result = {
                    success : responseObj.success,
                    msg     : responseObj.message,
                    data    : responseObj.data
                };
            } else {
                var doc = response.responseXML,
                    root = doc.documentElement || doc,
                    q = Ext.DomQuery,
                    sv = q.selectValue("Success", root, false),
                    data = q.selectValue("Data", root, undefined);
                    
                success = sv !== false && sv !== "false";
                if (data) {
                    data = Ext.decode(data);
                }
                
                result = { 
                    success : success, 
                    msg     : q.selectValue("Message", root, ""),
                    data    : data
                };
            }
        } catch (e) {
            this.fireEvent("saveexception", this, o, response, e);
            this.fireEvent("exception", this, "remote", "write", o, response, e);
            o.request.callback.call(o.request.scope, null, o.request.arg, false);

            return;
        }
        
        if (result.success) {
            this.fireEvent("save", this, o, o.request.arg);
        } else {
            this.fireEvent("saveexception", this, o, response, { message : result.msg });
        }
        
        o.request.callback.call(o.request.scope, result, o.request.arg, result.success);
    }
});