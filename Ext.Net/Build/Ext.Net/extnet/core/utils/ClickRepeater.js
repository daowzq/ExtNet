// @source core/utils/ClickRepeater.js

Ext.net.ClickRepeater = function (config) {
    this.addEvents(
        "leftclick",
        "rightclick",
        "middleclick"
    );

    Ext.net.ClickRepeater.superclass.constructor.call(this, config.el, config);
};

Ext.extend(Ext.net.ClickRepeater, Ext.util.ClickRepeater, {
    ignoredButtons : [],
    btnEvents : {
        0 : "leftclick", 
        1 : "middleclick", 
        2 : "rightclick"
    },
    
    enable : function () {
        if (this.disabled) {
            this.el.on("mousedown", this.handleMouseDown, this);
            if ((this.preventDefault || this.stopDefault) && !this.isButtonIgnored(0)) {
                this.el.on("click", this.eventOptions, this);
            }
            if ((this.preventDefault || this.stopDefault) && !this.isButtonIgnored(2)) {
                this.el.on("contextmenu", this.eventOptions, this);
            }
        }
        this.disabled = false;
    },
    
    isButtonIgnored : function (e) {
        var ignored = false;

        Ext.each(this.ignoredButtons, function (b) {
            if (b == (e.button || e)) {
                ignored = true;
                return false;
            }
        }, this);
        
        return ignored;
    },
    
    handleMouseDown : function (e) {
        clearTimeout(this.timer);
        this.el.blur();

        if (this.pressClass) {
            this.el.addClass(this.pressClass);
        }
        
        this.mousedownTime = new Date();

        Ext.getDoc().on("mouseup", this.handleMouseUp, this);
        this.el.on("mouseout", this.handleMouseOut, this);

        if (!this.isButtonIgnored(e)) {
            this.fireEvent("mousedown", this, e);
            this.fireClick(e);
        }

        if (this.accelerate) {
            this.delay = 400;
	    }

        this.timer = this.click.defer(this.delay || this.interval, this, [e]);
    },
    
    click : function (e) {
        if (!this.isButtonIgnored(e)) {
            this.fireClick(e);
        }

        this.timer = this.click.defer(this.accelerate ?
            this.easeOutExpo(this.mousedownTime.getElapsed(),
                400,
                -390,
                12000) :
            this.interval, this, [e]);
    },
    
    fireClick : function (e) {        
        if (this.fireEvent("click", this, e) !== false) {
            this.fireEvent(this.btnEvents[e.button] || "click", this, e);
        }        
    },
    
    handleMouseReturn : function (e) {
        this.el.un("mouseover", this.handleMouseReturn, this);
        
        if (this.pressClass) {
            this.el.addClass(this.pressClass);
        }
        
        this.click(e);
    },
    
    handleMouseUp : function (e) {
        clearTimeout(this.timer);
        this.el.un("mouseover", this.handleMouseReturn, this);
        this.el.un("mouseout", this.handleMouseOut, this);
        Ext.getDoc().un("mouseup", this.handleMouseUp, this);
        this.el.removeClass(this.pressClass);
        
        if (!this.isButtonIgnored(e)) {
            this.fireEvent("mouseup", this, e);
        }
    }
});