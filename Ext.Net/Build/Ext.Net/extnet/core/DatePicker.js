
// @source core/DatePicker.js

Ext.DatePicker.prototype.initComponent = Ext.DatePicker.prototype.initComponent.createSequence(function () {
    var fn = function () { 
        this.getInputField().setValue(this.getValue().dateFormat("Y-m-d\\Th:i:s")); 
    };
    
    this.on("render", fn, this);
    this.on("select", fn, this);
});

Ext.DatePicker.prototype.onRender = Ext.DatePicker.prototype.onRender.createSequence(function (el) {
    this.getInputField().render(this.el.parent() || this.el);    
    this.initValue();    
    this.setReadOnly(this.readOnly);
});

//Ext.DatePicker.prototype.update = Ext.DatePicker.prototype.update.createSequence(function (date, forceRefresh) {
//    if (date.getTime() != (this.value ? this.value.clearTime(true) : new Date().clearTime()).getTime()) {
//        this.cells.removeClass("x-date-selected");    
//    }
//});

Ext.DatePicker.override({
    readOnly       : false,
    hideWithLabel  : true,
    isFormField    : true,
    
    getName        : Ext.form.Field.prototype.getName,
    initValue      : Ext.form.Field.prototype.initValue,
    isDirty        : Ext.form.Field.prototype.isDirty,
    reset          : Ext.form.Field.prototype.reset,
    isValid        : Ext.form.Field.prototype.isValid,
    validate       : Ext.form.Field.prototype.validate,
    processValue   : Ext.form.Field.prototype.processValue,
    validateValue  : Ext.form.Field.prototype.validateValue,
    getErrors      : Ext.form.Field.prototype.getErrors,
    clearInvalid   : Ext.emptyFn,
    markInvalid    : Ext.emptyFn,
    getRawValue    : Ext.form.Field.prototype.getValue,
    setRawValue    : Ext.form.Field.prototype.setValue,    
    getReadOnly    : Ext.form.Field.prototype.getReadOnly,
    adjustWidth    : Ext.form.Field.prototype.adjustWidth,
    hideNote       : Ext.form.Field.prototype.hideNote,
    showNote       : Ext.form.Field.prototype.showNote,
    hideFieldLabel : Ext.form.Field.prototype.hideFieldLabel,
    showFieldLabel : Ext.form.Field.prototype.showFieldLabel,
    initNote       : Ext.form.Field.prototype.initNote,
    
    getInputField : function () {
        if (!this.inputField) {
            this.inputField = new Ext.form.Hidden({ 
                id   : this.id + "_Input", 
                name : this.id + "_Input" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.inputField);
        }
        
        return this.inputField;
    },
    
    setReadOnly : function (readOnly) {
        if (this.rendered) {
            this.el.dom.readOnly = readOnly;
        }
        
        this.readOnly = readOnly;
        this.doDisabled(readOnly);
    },
    
    setDisabledDates : function (dd) {
        if (Ext.isArray(dd)) {
            this.disabledDates = dd;
            this.disabledDatesRE = null;
        } else {
            this.disabledDatesRE = dd;
            this.disabledDates = null;
        }
        this.initDisabledDays();
        this.update(this.value, true);
    },
    
    update : function(date, forceRefresh){
        if(this.rendered){
            var vd = this.activeDate, vis = this.isVisible();
            this.activeDate = date;
            if(!forceRefresh && vd && this.el){
                var t = date.getTime();
                if(vd.getMonth() == date.getMonth() && vd.getFullYear() == date.getFullYear()){
                    this.cells.removeClass('x-date-selected');
                    this.cells.each(function(c){
                       if(c.dom.firstChild.dateValue == t){
                           c.addClass('x-date-selected');
                           if(vis && !this.cancelFocus){
                               Ext.fly(c.dom.firstChild).focus(50);
                           }
                           return false;
                       }
                    }, this);
                    return;
                }
            }
            var days = date.getDaysInMonth(),
                firstOfMonth = date.getFirstDateOfMonth(),
                startingPos = firstOfMonth.getDay()-this.startDay;

            if(startingPos < 0){
                startingPos += 7;
            }
            days += startingPos;
            date = date.clone();
            date.setHours(1);

            var pm = date.add('mo', -1),
                prevStart = pm.getDaysInMonth()-startingPos,
                cells = this.cells.elements,
                textEls = this.textNodes,
                // convert everything to numbers so it's fast
                d = (new Date(pm.getFullYear(), pm.getMonth(), prevStart, this.initHour)),
                today = new Date(),
                sel = date.clearTime(true).getTime(),
                min = this.minDate ? this.minDate.clearTime(true) : Number.NEGATIVE_INFINITY,
                max = this.maxDate ? this.maxDate.clearTime(true) : Number.POSITIVE_INFINITY,
                ddMatch = this.disabledDatesRE,
                ddText = this.disabledDatesText,
                ddays = this.disabledDays ? this.disabledDays.join('') : false,
                ddaysText = this.disabledDaysText,
                format = this.format;
                
            if(this.showToday){
                var td = new Date().clearTime(),
                    disable = (td < min || td > max ||
                    (ddMatch && format && ddMatch.test(td.dateFormat(format))) ||
                    (ddays && ddays.indexOf(td.getDay()) != -1));

                if(!this.disabled){
                    this.todayBtn.setDisabled(disable);
                    this.todayKeyListener[disable ? 'disable' : 'enable']();
                }
            }

            var setCellClass = function(cal, cell){
                cell.title = '';
                var t = d.clearTime(true).getTime();
                cell.firstChild.dateValue = t;
                if(t == today){
                    cell.className += ' x-date-today';
                    cell.title = cal.todayText;
                }
                if(t == sel){
                    cell.className += ' x-date-selected';
                    if(vis){
                        Ext.fly(cell.firstChild).focus(50);
                    }
                }
                // disabling
                if(t < min) {
                    cell.className = ' x-date-disabled';
                    cell.title = cal.minText;
                    return;
                }
                if(t > max) {
                    cell.className = ' x-date-disabled';
                    cell.title = cal.maxText;
                    return;
                }
                if(ddays){
                    if(ddays.indexOf(d.getDay()) != -1){
                        cell.title = ddaysText;
                        cell.className = ' x-date-disabled';
                    }
                }
                if(ddMatch && format){
                    var fvalue = d.dateFormat(format);
                    if(ddMatch.test(fvalue)){
                        cell.title = ddText.replace('%0', fvalue);
                        cell.className = ' x-date-disabled';
                    }
                }
            };

            var i = 0;
            for(; i < startingPos; i++) {
                textEls[i].innerHTML = (++prevStart);
                d.setDate(d.getDate()+1);
                cells[i].className = 'x-date-prevday';
                setCellClass(this, cells[i]);
            }
            for(; i < days; i++){
                var intDay = i - startingPos + 1;
                textEls[i].innerHTML = (intDay);
                d.setDate(d.getDate()+1);
                cells[i].className = 'x-date-active';
                setCellClass(this, cells[i]);
            }
            var extraDays = 0;
            for(; i < 42; i++) {
                 textEls[i].innerHTML = (++extraDays);
                 d.setDate(d.getDate()+1);
                 cells[i].className = 'x-date-nextday';
                 setCellClass(this, cells[i]);
            }

            this.mbtn.setText(this.monthNames[date.getMonth()] + ' ' + date.getFullYear());

            if(!this.internalRender){
                var main = this.el.dom.firstChild,
                    w = main.offsetWidth;
                this.el.setWidth(w + this.el.getBorderWidth('lr'));
                Ext.fly(main).setWidth(w);
                this.internalRender = true;
                // opera does not respect the auto grow header center column
                // then, after it gets a width opera refuses to recalculate
                // without a second pass
                if(Ext.isOpera && !this.secondPass){
                    main.rows[0].cells[1].style.width = (w - (main.rows[0].cells[0].offsetWidth+main.rows[0].cells[2].offsetWidth)) + 'px';
                    this.secondPass = true;
                    this.update.defer(10, this, [date]);
                }
            }
        }
    }	
});