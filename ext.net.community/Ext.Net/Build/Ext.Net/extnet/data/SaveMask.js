
// @source data/SaveMask.js

Ext.net.SaveMask = function (el, config) {
    this.el = Ext.get(el);
    
    Ext.apply(this, config);
    
    if (this.writeStore) {
        this.writeStore.on("beforesave", this.onBeforeSave, this);
        this.writeStore.on("save", this.onSave, this);
        this.writeStore.on("saveexception", this.onSave, this);
        this.writeStore.on("commitdone", this.onSave, this);
        this.writeStore.on("commitfailed", this.onSave, this);
        this.removeMask = Ext.value(this.removeMask, false);
    }
};

Ext.net.SaveMask.prototype = {
    msg      : "Saving...",
    msgCls   : "x-mask-loading",
    disabled : false,
    
    disable  : function () {
        this.disabled = true;
    },
    
    enable : function () {
        this.disabled = false;
    },

    onSave : function () {
        this.el.unmask(this.removeMask);
    },

    onBeforeSave : function () {
        if (!this.disabled) {
            this.el.mask(this.msg, this.msgCls);
        }
    },

    show : function () {
        this.onBeforeSave();
    },

    hide : function () {
        this.onSave();    
    },

    destroy : function () {
        if (this.writeStore) {
            this.writeStore.un("beforesave", this.onBeforeSave, this);
            this.writeStore.un("save", this.onSave, this);
            this.writeStore.un("saveexception", this.onSave, this);
            this.writeStore.un("commitdone", this.onSave, this);
            this.writeStore.un("commitfailed", this.onSave, this);
        }
    }
};