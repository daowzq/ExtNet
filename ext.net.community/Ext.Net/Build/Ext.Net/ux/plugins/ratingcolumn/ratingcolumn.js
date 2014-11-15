
// @source data/RateColumn.js

Ext.net.RatingColumn = function (config) {
    Ext.apply(this, config);
    
    if (!this.id) {
        this.id = Ext.id();
    }
    
    this.renderer = this.renderer.createDelegate(this);
};

Ext.net.RatingColumn.prototype = {    
    fixed : true,
    dataIndex : "rating",    
    allowChange : true,
    selectedCls : "rating-selected",
    unselectedCls : "rating-unselected", 
    editable : false,
    maxRating : 5,
    
    tickSize: 16, 
    roundToTick: true, 
    zeroSensitivity: 0.25, 

    onMouseDown : function(e, t){
        if(!this.editable){        
            return;
        }
        
        var rowIndex = this.grid.view.findRowIndex(t),        
            record = this.grid.getStore().getAt(rowIndex);          
     
        if (this.allowChange || !record.isModified(this.dataIndex)) { 
            var value = (e.getXY()[0] - Ext.fly(t).getX()) / this.tickSize; 
            if (value < this.zeroSensitivity) { 
                value = 0 
            } 
            if (this.roundToTick) { 
                value = Math.ceil(value); 
            } 
            this.grid.getStore().getAt(rowIndex).set(this.dataIndex, value); 
        } 
        
        e.stopEvent();
    },    
    
    init : function (grid) {
        this.grid = grid;
        
        var view = grid.getView();
        
        if (view.mainBody) {
            view.mainBody.on("mousedown", this.onMouseDown, this, { delegate : "."+this.id });
        } else {
            this.grid.on("render", function () {            
                this.grid.getView().mainBody.on("mousedown", this.onMouseDown, this, { delegate : "."+this.id });
            }, this);
        }       
    },
    
    destroy : function () {
        this.grid.getView().mainBody.un("mousedown", this.onMouseDown, this, { delegate : "."+this.id });
    },
    
    getCellEditor : Ext.emptyFn,
    
    renderer: function(value, meta){
        meta.css = "rating-cell";
        return String.format('<div class="{0} {1}" style="width:{2}px;{5}"><div class="{3}" style="width:{4}px">&nbsp;</div></div>',
               this.id,
               this.unselectedCls,
               Math.round(this.tickSize * this.maxRating),
               this.selectedCls,
               Math.round(this.tickSize * value),
               this.editable ? "cursor:pointer;" : "");
   	}
};

Ext.grid.Column.types.ratingcolumn = Ext.net.RatingColumn;

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}