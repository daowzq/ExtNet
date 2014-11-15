
// @source data/HttpProxy.js

Ext.data.HttpProxy.prototype.doRequest = function (action, rs, params, reader, cb, scope, arg) {
    var o = {
        method : (this.api[action]) ? this.api[action].method : undefined,
        request : {
            callback: cb,
            scope: scope,
            arg: arg
        },
        reader : reader,
        callback : this.createCallback(action, rs),
        scope : this
    };

    if (this.conn.json) {
        o.jsonData = params;

        if ((o.method || this.conn.method) === "GET") {
           o.params = params || {};
        }
    } else if (params.jsonData) {
        o.jsonData = params.jsonData;
    } else if (params.xmlData) {
        o.xmlData = params.xmlData;
    } else {
        o.params = params || {};
    }

    this.conn.url = this.buildUrl(action, rs);

    if (this.useAjax) {

        Ext.applyIf(o, this.conn);
        this.activeRequest[action] = Ext.Ajax.request(o);
    } else {
        this.conn.request(o);
    }

    this.conn.url = null;
};