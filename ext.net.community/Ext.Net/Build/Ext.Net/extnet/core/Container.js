
// @source core/Container.js

Ext.override(Ext.Container, {
    addAndDoLayout : function (comp) {
        var c = this.add(comp);
        this.doLayout();
        
        return c;
    },
    
    insertAndDoLayout : function (index, comp) {
        var c = this.insert(index, comp);
        this.doLayout();
        
        return c;
    }
});

Ext.Container.prototype.initComponent = Ext.Container.prototype.initComponent.createSequence(function () {
    if (this.autoDoLayout === true) {
        this.on("afterrender", this.doLayout, this, { delay : 10 });
    }
});