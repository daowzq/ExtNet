
// @source core/form/NumberField.js

Ext.form.NumberField.prototype.setValue = Ext.form.NumberField.prototype.setValue.createSequence(function (v) {
    if (this.trimTrailedZeros === false) {
        var value = this.getValue(),
            strValue;
        
        if (!Ext.isEmpty(value, false)) {
            strValue = value.toFixed(this.decimalPrecision).replace(".", this.decimalSeparator);    
            this.setRawValue(strValue);
        }
    }
});

Ext.form.NumberField.override({
    negativeText : "Negative numbers are not allowed (you entered '{0}')",
    
    getErrors : function (value) {
        var errors = Ext.form.NumberField.superclass.getErrors.apply(this, arguments);
        
        value = value || this.processValue(this.getRawValue());
        
        if (value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
            return errors;
        }
        
        value = String(value).replace(this.decimalSeparator, ".");
        
        if (isNaN(value)) {
            errors.push(String.format(this.nanText, value));
        }
        
        var num = this.parseValue(value);
        
        if (num < this.minValue) {
            errors.push(String.format(this.minText, this.minValue));
        }
        
        if (num > this.maxValue) {
            errors.push(String.format(this.maxText, this.maxValue));
        }
        
        if (!this.allowNegative && num < 0) {
            errors.push(String.format(this.negativeText, value));
        }
        
        return errors;
    }
});