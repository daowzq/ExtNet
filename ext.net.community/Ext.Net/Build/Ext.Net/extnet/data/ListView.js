
// @source data/ListView.js

Ext.ListView.prototype.onResize = Ext.ListView.prototype.onResize.createSequence(function (w, h) {
    if (Ext.isNumber(h)) {
        this.innerBody.dom.parentNode.style.height = (h - this.innerHd.dom.parentNode.offsetHeight) + "px";
    }
});

Ext.ListView.override({
    //column can be index or dataindex
    setColumnHeader : function (column, header) {
        if (Ext.isString(column)) {
            Ext.each(this.columns, function (c, i) {
                if (c.dataIndex === column) {
                    column = i;
                    return false;
                }
            }, this);
        }
        column++;
        Ext.fly(this.id + "-xlhd-" + column).update(header);
    }
});