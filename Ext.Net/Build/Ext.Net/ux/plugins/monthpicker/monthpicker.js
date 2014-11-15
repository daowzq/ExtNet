Ext.ux.MonthPicker = function (config) {
    Ext.apply(this, config);
}

Ext.ux.MonthPicker.prototype = {
    first: true,
    
    init: function (picker) {
        this.picker = picker;
        
        if (picker.parseDate) {
            picker.onTriggerClick = picker.onTriggerClick.createSequence(this.onClick, this);
            picker.parseDate = picker.parseDate.createInterceptor(this.setDefaultMonthDay, this).createSequence(this.restoreDefaultMonthDay, this);
        }
        else {
            this.picker = {
                menu : {
                    picker : picker
                }
            };
            this.isDatePicker = true;
            picker.on("render", this.onClick, this);
        }
    },

    setDefaultMonthDay: function () {
        this.oldDateDefaults = Date.defaults.d;
        Date.defaults.d = 1;
        return true;
    },

    restoreDefaultMonthDay: function (ret) {
        Date.defaults.d = this.oldDateDefaults;
        return ret;
    },

    onClick: function (e, el, opt) {
        var p = this.picker.menu.picker;
        if (p.activateDate) {
            p.activeDate = p.activeDate.getFirstDateOfMonth();
        }
        if (p.value) {
            p.value = p.value.getFirstDateOfMonth();
        }
        p.showMonthPicker();
        p.monthPicker.stopFx();
        if (!p.disabled) {
            if (this.first) {
                this.first = false;
                
                if (this.isDatePicker) {
                    p.monthPicker.child("button.x-date-mp-cancel").hide();
                    p.monthPicker.child("button.x-date-mp-ok").hide();
                    p.hideMonthPicker = Ext.emptyFn;
                }

                if (typeof p.mun == 'function') {
                    p.mun(p.monthPicker, 'click', p.onMonthClick, p);
                    p.mun(p.monthPicker, 'dblclick', p.onMonthDblClick, p);
                } else {
                    p.monthPicker.un('click', p.onMonthClick)
                    p.monthPicker.un('dblclick', p.onMonthDblClick)
                }
                p.onMonthClick = p.onMonthClick.createSequence(this.pickerClick, this);
                p.onMonthDblClick = p.onMonthDblClick.createSequence(this.pickerDblclick, this);
                p.mon(p.monthPicker, 'click', p.onMonthClick, p);
                p.mon(p.monthPicker, 'dblclick', p.onMonthDblClick, p);
            }
            p.monthPicker.show();
        }
    },

    pickerClick: function (e, t) {
        var picker = this.picker;
        var el = new Ext.Element(t);
        if (el.is('button.x-date-mp-cancel')) {
            picker.menu.hide();
        } else if (el.is('button.x-date-mp-ok')) {
            var p = picker.menu.picker;
            p.setValue(p.activeDate.getFirstDateOfMonth());
            p.fireEvent('select', p, p.value);
        }
        else if (this.isDatePicker) {
            this.picker.menu.picker.onMonthDblClick(e, t);
        }
    },

    pickerDblclick: function (e, t) {
        var el = new Ext.Element(t);
        var parent = el.parent();
        if (parent && (parent.is('td.x-date-mp-month') || parent.is('td.x-date-mp-year'))) {
            var p = this.picker.menu.picker;
            p.setValue(p.activeDate.getFirstDateOfMonth());
            p.fireEvent('select', p, p.value);
        }
    }
};

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}