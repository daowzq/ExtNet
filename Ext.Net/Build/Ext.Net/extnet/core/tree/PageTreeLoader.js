
// @source core/tree/PageTreeLoader.js

Ext.net.PageTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
    load : function (node, callback) {
        if (this.clearOnLoad) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        
        if (this.doPreload(node)) {
            if (typeof callback === "function") {
                callback();
            }
        } else {
            this.requestData(node, callback);
        }
    },

    requestData : function (node, callback) {
        if (this.fireEvent("beforeload", this, node, callback) !== false) {
            var config = {};

            Ext.apply(config, {
                control       : node.getOwnerTree(),
                eventType     : "postback",
                action        : "nodeload",
                userSuccess   : this.handleSuccess,
                userFailure   : this.handleFailure,
                argument      : { callback : callback, node : node },
                extraParams   : this.getParams(node),
                method        : this.method,
                timeout       : this.timeout || 30000,
                isUpload      : this.isUpload,
                viewStateMode : this.viewStateMode,
                type          : this.type,
                url           : this.url,
                formProxyArg  : this.formProxyArg,
                eventMask     : this.eventMask
            });
            
            Ext.net.DirectEvent.request(config);

        } else {
            if (typeof callback === "function") {
                callback();
            }
        }
    },

    handleFailure : function (response, result, context, type, action, extraParams) {
        var loader = context.getLoader(),
            a;
            
        loader.transId = false;
        
        a = response.argument;
        
        loader.fireEvent("loadexception", loader, a.node, response, result.errorMessage || response.statusText);
        
        if (typeof a.callback === "function") {
            a.callback(loader, a.node);
        }
    },

    handleSuccess : function (response, result, context, type, action, extraParams) {
        var loader = context.getLoader(),
            serviceResponse = result.serviceResponse || {},
            a;

        loader.transId = false;
        
        a = response.argument;
        
        loader.processResponse(response, serviceResponse.data || [], a.node, a.callback);
        loader.fireEvent("load", loader, a.node, response);
    },

    getParams : function (node) {
        var buf = {}, 
            bp = this.baseParams,
            key;
        
        for (key in bp) {
            if (typeof bp[key] !== "function") {
                buf[key] = bp[key];
            }
        }
        
        buf.node = node.id;
        return buf;
    },

    processResponse : function (response, data, node, callback) {
        try {
            var o = data,
                i = 0,
                len;

            node.beginUpdate();
            
            for (i, len = o.length; i < len; i++) {
                var n = this.createNode(o[i]);

                if (n) {
                    node.appendChild(n);
                }
            }
            
            node.endUpdate();
            
            if (typeof callback === "function") {
                callback(this, node);
            }
        } catch (e) {
            this.handleFailure(response);
        }
    }
});