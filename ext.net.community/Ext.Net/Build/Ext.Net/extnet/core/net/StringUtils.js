
// @source core/net/StringUtils.js

Ext.net.StringUtils = function () {
    return {
        startsWith : function (str, value) {
            return str.match("^" + value) !== null;
        },

        endsWith : function (str, value) {
            return str.match(value + "$") !== null;
        }
    };
}();