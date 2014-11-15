
// @source core/Slider.js

Ext.Slider.prototype.onRender = Ext.Slider.prototype.onRender.createSequence(function (el) {
    this.getValueField().render(this.el.parent() || this.el);
});

Ext.Slider.prototype.initComponent = Ext.Slider.prototype.initComponent.createSequence(function () {    
    this.valuesState = {};
    this.on("change", function (el, newValue, thumb) {
        var sb = [],
            i = 0;

        for (i; i < this.thumbs.length; i++) {
            sb.push(this.thumbs[i].value);
        }
        
        this.getValueField().setValue(sb.join(","));
    });
});

Ext.Slider.override({    
    getValueField : function () {
        if (!this.valueField) {
            this.valueField = new Ext.form.Hidden({ 
                id   : this.id + "_Value", 
                name : this.id + "_Value"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.valueField);	
        }
        
        return this.valueField;
    }
});

Ext.form.SliderField.override({
    initComponent : function () {
        var cfg;

        if (this.initialConfig.slider) {
            cfg = this.initialConfig.slider;
        } else {        
            cfg = Ext.copyTo({
                id : this.id + "-slider"
            }, this.initialConfig, ["vertical", "minValue", "maxValue", "decimalPrecision", "keyIncrement", "increment", "clickToChange", "animate"]);
            
            // only can use it if it exists.
            if (this.useTips) {
                var plug = this.tipText ? {getText: this.tipText} : {};
                cfg.plugins = [new Ext.slider.Tip(plug)];
            }
        }
        
        this.slider = cfg.render ? cfg : new Ext.Slider(cfg);
        Ext.form.SliderField.superclass.initComponent.call(this);
    }
});