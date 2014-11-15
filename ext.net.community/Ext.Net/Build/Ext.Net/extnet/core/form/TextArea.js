
// @source core/form/TextArea.js

Ext.override(Ext.form.TextArea, {
    initComponent : function () {
        Ext.form.TextArea.superclass.initComponent.call(this);
        
        if (this.maxLength !== Number.MAX_VALUE && this.truncate === true) {
            this.on("invalid", function () {
                if (this.getValue().length > this.maxLength) {
                    this.setValue(this.getValue().substr(0, this.maxLength));
                }
            });
        }
    }
});