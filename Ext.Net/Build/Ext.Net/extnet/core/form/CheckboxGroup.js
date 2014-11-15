
// @source core/form/CheckboxGroup.js

Ext.form.CheckboxGroup.prototype.onRender = Ext.form.CheckboxGroup.prototype.onRender.createSequence(function (ct, position) {
    if (this.fireChangeOnLoad) {
        var checked = false;
        this.eachItem(function (item) {
            if (item.checked) {
                checked = true;
                return false;
            }
        });
        if (checked) {
            this.fireChecked();
        }
    }
});

Ext.form.CheckboxGroup.override({
    getBox : function (id) {
        var box = null;
        
        this.eachItem(function (f) {
            if (id === f || f.dataIndex === id || f.tag === id || f.id === id || f.getName() === id) {
                box = f;
                return false;
            }
        });
        
        return box;
    }
});