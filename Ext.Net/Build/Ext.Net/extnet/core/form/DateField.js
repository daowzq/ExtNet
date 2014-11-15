
// @source core/form/DateField.js

Date.prototype.extadd = Date.prototype.add;

/* 
    Create override of Date.prototype.add function to work 
    around collision when using Microsoft AjaxControlToolkit 
*/
Ext.DatePicker.prototype.initComponent = Ext.DatePicker.prototype.initComponent.createInterceptor(function () {
    if (!this.msadd) {
        Date.prototype.msadd = Date.prototype.add;
        
        Date.prototype.add = function () {
            return this[typeof arguments[0] === "string" ? "extadd" : "msadd"].apply(this, arguments);
        };
    }
});

Ext.form.DateField.override({
    setDisabledDates : function (dd) {
        this.disabledDates = dd;
        this.disabledDatesRE = null;
        this.initDisabledDays();
        if (this.menu) {
            this.menu.picker.setDisabledDates(this.disabledDatesRE);
        }
    },
    
    onTriggerClick : function () {
        if (this.disabled) {
            return;
        }
        
        if (Ext.isEmpty(this.menu)) {
            this.menu = new Ext.menu.DateMenu({
                hideOnClick   : false,
                focusOnSelect : false 
            });
        }
        this.onFocus();

        Ext.apply(this.menu.picker, {
            minDate           : this.minValue,
            maxDate           : this.maxValue,
            disabledDatesRE   : this.disabledDatesRE,
            disabledDatesText : this.disabledDatesText,
            disabledDays      : this.disabledDays,
            disabledDaysText  : this.disabledDaysText,
            format            : this.format,
            showToday         : this.showToday,
            minText           : String.format(this.minText, this.formatDate(this.minValue)),
            maxText           : String.format(this.maxText, this.formatDate(this.maxValue))
        });

        if (this.cancelText) {
            Ext.apply(this.menu.picker, { cancelText : this.cancelText });
        }
        
        if (this.dayNames) {
            Ext.apply(this.menu.picker, { dayNames : this.dayNames });
        }
        
        if (this.monthNames) {
            Ext.apply(this.menu.picker, { monthNames : this.monthNames });
        }
        
        if (this.monthYearText) {
            Ext.apply(this.menu.picker, { monthYearText : this.monthYearText });
        }
        
        if (this.nextText) {
            Ext.apply(this.menu.picker, { nextText : this.nextText });
        }
        
        if (this.okText) {
            Ext.apply(this.menu.picker, { okText : this.okText });
        }
        
        if (this.prevText) {
            Ext.apply(this.menu.picker, { prevText : this.prevText });
        }
        
        if (this.startDay) {
            Ext.apply(this.menu.picker, { startDay : this.startDay });
        }
        
        if (this.todayText) {
            Ext.apply(this.menu.picker, { todayText : this.todayText });
        }
        
        if (this.todayTip) {
            Ext.apply(this.menu.picker, { todayTip : this.todayTip });
        }

        this.menu.on(Ext.apply({}, this.menuListeners, {
            scope : this
        }));
        
        this.menu.picker.setValue(this.getValue() || new Date());
        this.menu.show(this.el, "tl-bl?");
        this.menuEvents("on");
    }
});