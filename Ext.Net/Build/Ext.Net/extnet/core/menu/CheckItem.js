
// @source core/menu/CheckItem.js

Ext.menu.CheckItem.prototype.onRender = Ext.menu.CheckItem.prototype.onRender.createSequence(function (el) {
    this.getCheckedField().render(Ext.net.ResourceMgr.getAspForm() || this.el.parent() || this.el);
});

Ext.menu.CheckItem.override({
    getCheckedField : function () {
        if (!this.checkedField) {
            this.checkedField = new Ext.form.Hidden({ 
                id   : this.id + "_Checked", 
                name : this.id + "_Checked" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.checkedField);	
        }
        
        return this.checkedField;
    }
});