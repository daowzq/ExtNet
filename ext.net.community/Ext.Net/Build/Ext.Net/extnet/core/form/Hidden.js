
// @source core/form/Hidden.js

Ext.form.Hidden.override({
    setValue : function (v) {
        var temp = this.rendered ? this.el.dom.value : this.value;
        
        this.value = v;
        
        if (this.rendered) {
            this.el.dom.value = (v === null || v === undefined ? "" : v);
            this.validate();
        }
        
        // do not replace != by !==
        if (v != temp) {
            this.fireEvent("change");
        }
    }
});