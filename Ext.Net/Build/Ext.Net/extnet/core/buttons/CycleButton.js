
// @source core/buttons/CycleButton.js

Ext.CycleButton.prototype.setActiveItem = Ext.CycleButton.prototype.setActiveItem.createSequence(function (item, suppressEvent) {
    if (!this.forceIcon) {
        if (item.icon) {
            this.setIcon(item.icon);
        }
    }
});

Ext.override(Ext.CycleButton, {
    initComponent : function () {
        this.addEvents("change");

        if (this.changeHandler) {
            this.on("change", this.changeHandler, this.scope || this);
            delete this.changeHandler;
        }

        this.itemCount = this.menu.items.length;

        this.menu.cls = "x-cycle-menu";
        
        var checked = 0, 
            item,
            i = 0,
            len;
        
        for (i, len = this.itemCount; i < len; i++) {
            item = this.menu.items[i];

            item.group = item.group || this.id;

            item.itemIndex = i;
            item.checkHandler = this.checkHandler;
            item.scope = this;
            item.checked = item.checked || false;

            if (item.checked) {
                checked = i;
            }
        }
        
        Ext.CycleButton.superclass.initComponent.call(this);

        this.on("click", this.toggleSelected, this);
        this.setActiveItem(checked, true);
    },
    
    showMenuArrow : function () {
        var el = this.el.child("td.x-btn-mc em");
        
        if (!Ext.isEmpty(el)) {
            el.addClass("x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));
        }
    },
    
    hideMenuArrow : function () {
        var bottom = this.arrowAlign === "bottom" ? "-bottom" : "",
            el = this.el.child("td.x-btn-mc em.x-btn-split" + bottom);
        
        if (!Ext.isEmpty(el)) {
            el.removeClass("x-btn-split" + bottom);
        }
    }
});