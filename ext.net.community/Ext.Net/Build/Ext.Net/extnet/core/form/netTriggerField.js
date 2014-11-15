
// @source core/form/TriggerField.js

Ext.net.TriggerField = Ext.extend(Ext.form.TriggerField, {
    standardTrigger : false,

    initTrigger : function () {
        var ts = this.trigger.select(".x-form-trigger", true), triggerField = this;
        
        this.wrap.setStyle("overflow", "hidden");
        
        ts.each(function (t, all, index) {
            t.hide = function () {
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = "none";
                triggerField.el.setWidth(w - triggerField.trigger.getWidth());
            };
            
            t.show = function () {
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = "";
                this.dom.removeAttribute("hidden");
                triggerField.el.setWidth(w - triggerField.trigger.getWidth());
            };

            t.on("click", this.onCustomTriggerClick, this, { index : index, t : t, tag: t.getAttributeNS("ext", "tid"), preventDefault : true });
            t.addClassOnOver("x-form-trigger-over");
            t.addClassOnClick("x-form-trigger-click");
        }, this);
        
        this.triggers = ts.elements;
    }
});

Ext.reg("nettrigger", Ext.net.TriggerField);