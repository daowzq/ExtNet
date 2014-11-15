
// @source data/DataView.js

Ext.DataView.prototype.initComponent = Ext.DataView.prototype.initComponent.createSequence(function () {
    this.initSelection();    
    
    if (this.store) {
        if (this.store.getCount() > 0) {
            this.on("render", this.doSelection, this, { single : true, delay : 100 });
        } else {
            this.store.on("load", this.doSelection, this, { single : true, delay : 100 });
        }
    }
});

Ext.DataView.prototype.onRender = Ext.DataView.prototype.onRender.createSequence(function () {
    this.getSelectionField().render(this.el.parent() || this.el);
});

Ext.DataView.override({

    getSelectionField : function () {
        if (!this.selectionField) {
            this.selectionField = new Ext.form.Hidden({ id: this.id + "_SN", name: this.id + "_SN" });
			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectionField);
        }

        return this.selectionField;
    },

    updateSelection : function () {
        var records = [];

        var selectedRecords = this.getSelectedRecords(),
            i = 0;

        for (i; i < selectedRecords.length; i++) {
            if (!Ext.isEmpty(selectedRecords[i])) {
                records.push({ RecordID: selectedRecords[i].id, RowIndex: this.store.indexOfId(selectedRecords[i].id) });
            }
        }

        this.hSelField.setValue(Ext.encode(records));
    },

    doSelection : function () {
        var data = this.selectedData,
            silent = true;

        if (!Ext.isEmpty(this.fireSelectOnLoad)) {
            silent = !this.fireSelectOnLoad;
        }

        if (!Ext.isEmpty(data)) {
            if (silent) {
                this.suspendEvents();
            }

            if (data.length > 0) {
                var indexes = [],
                    record,
                    i = 0;

                for (i; i < data.length; i++) {
                    if (!Ext.isEmpty(data[i].recordID)) {
                        record = this.store.getById(data[i].recordID);
                        
                        if (!Ext.isEmpty(record)) {
                            indexes.push(this.store.indexOf(record));
                        }
                    } else if (!Ext.isEmpty(data[i].rowIndex)) {
                        indexes.push(data[i].rowIndex);
                    }
                }
                this.select(indexes);

                if (silent) {
                    this.updateSelection();
                }
            }

            if (silent) {
                this.resumeEvents();
            }
        }
    },

    initSelection : function () {
        this.hSelField = this.getSelectionField();
        this.on("selectionchange", this.updateSelection, this);
    },

    getRowsValues : function (selectedOnly) {
        if (Ext.isEmpty(selectedOnly)) {
            selectedOnly = true;
        }

        var records = (selectedOnly ? this.getSelectedRecords() : this.store.getRange()) || [],
            values = [],
            i;

        for (i = 0; i < records.length; i++) {
            if (Ext.isEmpty(records[i])) {
                continue;
            }
            
            var obj = {}, dataR;

            if (this.store.metaId()) {
                obj[this.store.metaId()] = records[i].id;
            }

            dataR = Ext.apply(obj, records[i].data);
            dataR = this.store.prepareRecord(dataR, records[i], {});

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    submitData : function (selectedOnly) {
        this.store.submitData(this.getRowsValues(selectedOnly || false));
    }
});