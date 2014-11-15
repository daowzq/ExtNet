
// @source core/form/MultiCombo.js

Ext.net.MultiCombo = Ext.extend(Ext.form.ComboBox, {
    delimiter     : ",",
    wrapBySquareBrackets : false,
    valueField    : "value",
    selectionMode : "checkbox",

    normalizeStringValues : function (s) {
	    if (!Ext.isEmpty(s, false)) {
	        var values = [],	        
	            re = /^\[{1}|\]{1}$/g;

            s =  s.toString().replace(re, "");

	        Ext.each(s.split(this.delimiter), function (item) {
	            values.push(item.trim());
	        });
	        s = values.join(this.delimiter);
	    }
	    
	    return s;
	},
	
	initSelection : function (selection) {
	    if (Ext.isEmpty(selection)) {
	        return;
	    }
	    
	    if (!this.view) {
	        this.selectionPredefined = selection;
	    }
	    
	    var getValuesFromSelection = (function (selection) {
	            var values = [];
	            Ext.each(selection, function (item) {
	            
	                if (!Ext.isEmpty(item.value, false)) {
	                    values.push(item.value);
	                }
	            }, this);
	            
	            return values.join(this.delimiter);
	        }).createDelegate(this, undefined, true),
	    
	        getAllValuesFromSelection = (function (selection) {
	            var values = [];
	            
	            Ext.each(selection, function (item) {
	                
	                if (!Ext.isEmpty(item.value, false)) {
	                    values.push(item.value);
	                } else if (!Ext.isEmpty(item.index)) {
	                    var r = this.store.getAt(item.index);

	                    if (!Ext.isEmpty(r)) {
	                        values.push(r.get(this.valueField));
	                    }
	                }

	            }, this);
	            return values.join(this.delimiter);
	        }).createDelegate(this, undefined, true),

	        setInitValues = (function  (selection) {            
                var values = getAllValuesFromSelection(selection);                
                if (!Ext.isEmpty(values, false)) {
                    this.setValue(values);
                }

                if (this.fireSelectOnLoad) {            
                    this.fireEvent("select", this, this.getSelectedRecords());
                }

                this.clearInvalid();
            }).createDelegate(this, undefined, true);

	    if (this.store.getCount() > 0) {
            setInitValues(selection);
        } else {
            var values = getValuesFromSelection(selection);

            if (!Ext.isEmpty(values, false)) {
                this.setValue(values);
            }

            this.store.on("load", setInitValues.createDelegate(this, [selection]), this, { single : true });
        }
	},	

    initComponent : function () {
		this.editable = false;

		if (!this.tpl) {
			this.tpl = '<tpl for="."><div class="x-combo-list-item {[this.getItemClass()]}">' +
				'<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
			    '<div class="x-mcombo-text">{' + this.displayField + '}</div></div></tpl>';

	        this.tpl = new Ext.XTemplate(this.tpl, {
	            getItemClass : (function () {
	                if (this.selectionMode === "selection") {
	                    return "x-mcombo-nimg-item";
	                }

	                return "x-mcombo-img-item";

	            }).createDelegate(this),

	            getImgClass : (function (values) {
	                if (this.selectionMode === "selection") {
	                    return "";
	                }

	                var found = false;

	                Ext.each(this.checkedRecords, function (record) {
	                    // do not replace == by ===
	                    if (values[this.valueField] == record.get(this.valueField)) {
	                        found = true;
	                        return false;
	                    }
	                }, this);

	                return found ? "x-grid3-check-col-on" : "x-grid3-check-col";
	            }).createDelegate(this, [], true)
	        });
		} 

		this.checkedRecords = [];

        Ext.net.MultiCombo.superclass.initComponent.apply(this, arguments);
        
        if (this.selectionPredefined) {
	        this.initSelection(this.selectionPredefined);
	    }

        this.on("beforequery", this.onBeforeQuery);
    }, 

    clearValue : function () {
		Ext.net.MultiCombo.superclass.clearValue.call(this);
		this.checkedRecords = [];
		delete this.selectionPredefined;
		this.store.clearFilter();
		this.store.fireEvent("datachanged", this.store);
		this.saveSelection();
	}, 

	getText : function () {
		var s = this.getValue(this.displayField).replace(new RegExp(RegExp.escape(this.delimiter), "g"), this.delimiter + " ");

		if (this.wrapBySquareBrackets) {
		    s = "[" + s + "]";
		}

		return s;
	},	

	getValue : function (field) {
		var value = [];

		Ext.each(this.checkedRecords, function (record) {
			value.push(record.get(field || this.valueField));
		}, this);

		return value.join(this.delimiter);
	},

	setValue : function (v) {
		if (v) {
			v = this.normalizeStringValues(v);

			this.store.clearFilter();		
			var values = v.split(this.delimiter),
			    unselected = [];	

			Ext.each(this.checkedRecords, function (r) {
			    var found = false;

			    Ext.each(values, function (value) {
				    // do not replace == by ===
				    if (r.get(this.valueField) == value) {
				        found = true;
				        return false;
				    }
				}, this);
		
				if (!found) {
				    unselected.push(r);
				}
			}, this);

			this.checkedRecords = [];

		    Ext.each(unselected, function (r) {
		        this.deselectRecord(r);			    
		    }, this);

		    this.store.each(function (r) {
			    Ext.each(values, function (value) {
			        // do not replace == by ===
			        if (r.get(this.valueField) == value) {
			            this.checkedRecords.push(r);    
			            this.selectRecord(r);
			            return false;
			        }
			    }, this);					
		    }, this);

			this.value = this.getValue();
			this.setRawValue(this.getText());

			if (this.hiddenField) {
				this.hiddenField.value = this.value;
			}

			if (this.el) {
				this.el.removeClass(this.emptyClass);
			}

			this.saveSelection();
		} else {
			this.clearValue();
		}		
	},	

	onBeforeQuery : function (qe) {
		qe.query = this.normalizeStringValues(qe.query);
	},

	checkOnBlur : Ext.emptyFn,
	beforeBlur : Ext.emptyFn,

	triggerBlur : function () {		
		this.store.clearFilter();
		Ext.net.MultiCombo.superclass.triggerBlur.call(this);
	},

	initList : function () {
	    Ext.net.MultiCombo.superclass.initList.call(this);	    
	    
	    if (this.selectionPredefined) {
	        this.initSelection(this.selectionPredefined);
	        delete this.selectionPredefined;
	    }

	    if (this.selectionMode !== "checkbox") {
	        this.view.overClass = "x-multi-selected";
	        this.view.mon(this.view.getTemplateTarget(), {
                "mouseover": this.view.onMouseOver,
                "mouseout": this.view.onMouseOut,
                scope: this.view
            });
        }
	},

	onSelect : function (record, index) {
        if (this.fireEvent("beforeselect", this, record, index) !== false) {
			if (this.checkedRecords.indexOf(record) === -1) {
			    this.checkedRecords.push(record);
			} else {
			    this.checkedRecords.remove(record);
			    this.deselectRecord(record);
			}

			if (this.store.isFiltered()) {
				this.doQuery(this.allQuery);
			}

			this.setValue(this.getValue());
            this.fireEvent("select", this, record, index);
        }
	},	

	isSelected : function (record) {
	    if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        return this.checkedRecords.indexOf(record) !== -1;
	},

	//private
	select : function (index, scrollIntoView) {  
	    if (this.selectionMode === "checkbox") {
	        Ext.net.MultiCombo.superclass.select.call(this, index, scrollIntoView);
	    }
    },

    //private
    deselectRecord : function (record) {        
        if (!this.view) {
            return;
        }

        switch (this.selectionMode) {
        case "checkbox":
            this.view.refreshNode(this.store.indexOf(record));
            break;
        case "selection":
            if (this.view.isSelected(this.store.indexOf(record))) {
                this.view.deselect(this.store.indexOf(record));
            }

            break;
        case "all":
            if (this.view.isSelected(this.store.indexOf(record))) {
                this.view.deselect(this.store.indexOf(record));
            }

            this.view.refreshNode(this.store.indexOf(record));
            break;
	    }
    },

    //private
    selectRecord : function (record) {        
        if (!this.view) {
            return;
        }

        switch (this.selectionMode) {
        case "checkbox":
            this.view.refreshNode(this.store.indexOf(record));
            break;
        case "selection":
            if (!this.view.isSelected(this.store.indexOf(record))) {
                this.view.select(this.store.indexOf(record), true);
            }

            break;
        case "all":
            if (!this.view.isSelected(this.store.indexOf(record))) {
                this.view.select(this.store.indexOf(record), true);
            }

            this.view.refreshNode(this.store.indexOf(record));	            
            break;
	    }
    },

	selectAll : function () {
        this.checkedRecords = [];
        this.store.each(function (record) {
            this.checkedRecords.push(record);    
        }, this);

        this.doQuery(this.allQuery);
        this.setValue(this.getValue());
    },    

    clearSelections : function () {
        this.clearValue();
    },

    deselectItem : function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        if (this.checkedRecords.indexOf(record) !== -1) {
            this.checkedRecords.remove(record);
		    this.deselectRecord(record);

		    if (this.store.isFiltered()) {
			    this.doQuery(this.allQuery);
		    }

		    this.setValue(this.getValue());
		}
    },

    selectItem : function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        if (this.checkedRecords.indexOf(record) === -1) {
            this.checkedRecords.push(record);
		    this.selectRecord(record);

		    if (this.store.isFiltered()) {
			    this.doQuery(this.allQuery);
		    }

		    this.setValue(this.getValue());
        }
    },
    
    getSelectedRecords : function () {
        return this.checkedRecords;
    },

    getSelectedIndexes : function () {
        var indexes = [];

		Ext.each(this.checkedRecords, function (record) {
			indexes.push(this.store.indexOf(record));
		}, this);

		return indexes;
    },

    getSelectedValues : function () {
	    var values = [];

		Ext.each(this.checkedRecords, function (record) {
			values.push(record.get(this.valueField));
		}, this);

		return values;
	},

	getSelectedText : function () {
	    var text = [];

		Ext.each(this.checkedRecords, function (record) {
			text.push(record.get(this.displayField));
		}, this);

		return text;
	},

	getSelection : function () {
	    var selection = [];

		Ext.each(this.checkedRecords, function (record) {
			selection.push({
			    text  : record.get(this.displayField),
			    value : record.get(this.valueField),
			    index : this.store.indexOf(record)
			});
		}, this);
		
		return selection;
	},
	
	saveSelection: function () {
	    this.getSelectionField().setValue(Ext.encode(this.getSelection()));
	},
    
    getSelectionField : function () {
        if (!this.selectionField) {
            this.selectionField = new Ext.form.Hidden({ id : this.id + "_Selection", name : this.id + "_Selection" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectionField);		
        }

        return this.selectionField;
    }
});
 
Ext.reg("netmulticombo", Ext.net.MultiCombo); 