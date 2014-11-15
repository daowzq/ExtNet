
// @source core/layout/ColumnLayout.js

/**
* @class Ext.net.ColumnLayout
* @extends Ext.layout.ColumnLayout
* This is the layout style of choice for creating structural layouts in a multi-column format where the width of each column can be specified as a percentage or fixed width, but the height is allowed to vary based on the content. 
*/
Ext.net.ColumnLayout = Ext.extend(Ext.layout.ContainerLayout, {
    monitorResize : true,
    extraCls      : "x-column",
    scrollOffset  : 0,
    margin        : 0,
    split         : false,
    fitHeight     : true,
    background    : false,

    // private
    isValidParent : function (c, target) {
        return this.innerCt && (c.getPositionEl ? c.getPositionEl() : c.getEl()).dom.parentNode == this.innerCt.dom;
    },

    renderAll : function (ct, target) {
        if (this.split && !this.splitBars) {
            this.splitBars = [];
            this.margin = this.margin || 5;
        }

        Ext.net.ColumnLayout.superclass.renderAll.apply(this, arguments);
    },
    
    getLayoutTargetSize : function () {
        var target = this.container.getLayoutTarget(), 
            ret;

        if (target) {
            ret = target.getViewSize();

            // IE in strict mode will return a width of 0 on the 1st pass of getViewSize.
            // Use getStyleSize to verify the 0 width, the adjustment pass will then work properly
            // with getViewSize
            if (Ext.isIE && Ext.isStrict && ret.width === 0) {
                ret =  target.getStyleSize();
            }

            ret.width -= (target.getPadding("lr") +  this.scrollOffset);
            ret.height -= target.getPadding("tb");
        }

        return ret;
    },

    // private
    onLayout : function (ct, target) {
        var cs = ct.items.items, len = cs.length, c, cel, i;       
                
        if (!this.innerCt) {
            target.addClass("x-column-layout-ct");
            
            if (this.background) {
                target.addClass("x-column-layout-bg-ct");
            }
            
            this.innerCt = target.createChild({ cls : "x-column-inner" });
            this.innerCt.createChild({ cls : "x-clear" });
        }
        
        this.renderAll(ct, this.innerCt);

        //var size = Ext.isIE && ((target.dom != Ext.getBody().dom) && (target.dom != (Ext.net.ResourceMgr.getAspForm() || {}).dom)) ? target.getStyleSize() : target.getViewSize();
        var size = this.getLayoutTargetSize();

        if (size.width < 1 && size.height < 1) { // display none?
            return;
        }

        var w = size.width,
            h = size.height;
        
        this.availableWidth = w;
        
        var pw = this.availableWidth, 
            lastProportionedColumn;

        if (this.split) {
            this.maxWidth = pw - ((this.minWidth + 5) * (len ? (len - 1) : 1));
        }

        if (this.fitHeight) {
            this.innerCt.setSize(w, h);
        } else {
            this.innerCt.setWidth(w);
        }

        for (i = 0; i < len; i++) {
            c = cs[i];
            cel = c.getPositionEl();

            if (this.margin && (i < (len - 1))) {
                cel.setStyle("margin-right", this.margin + "px");
            }
            
            if (c.columnWidth) {
                lastProportionedColumn = i;
            } else {
                pw -= c.getSize().width;
            }
            
            if (i < (len - 1)) {
                pw -= (cel.getMargins("lr") || this.margin);
            }
        }

        var remaining = (pw = pw < 0 ? 0 : pw),
            splitterPos = 0, 
            cw, 
            cmargin;
        
        for (i = 0; i < len; i++) {
            c = cs[i];
            cel = c.getPositionEl();
            
            if (c.columnWidth) {
                cw = (i === lastProportionedColumn) ? remaining : Math.floor(c.columnWidth * pw);
                
                cmargin = cel.getMargins("lr");

                if (!cmargin && (i < (len - 1))) {
                    cmargin = this.margin;
                }
                
                cmargin = 0;
                
                if (this.fitHeight) {
                    c.setSize(cw - cmargin, h);
                } else {
                    c.setSize(cw - cmargin);
                }
                
                remaining -= cw;
            } else if (this.fitHeight) {
                c.setHeight(h);
            }

            if (this.split) {
                cw = cel.getWidth();

                if (i < (len - 1)) {
                    splitterPos += cw;
                    
                    if (this.splitBars[i]) {
                        this.splitBars[i].el.setHeight(h);
                    } else {
                        this.splitBars[i] = new Ext.SplitBar(this.innerCt.createChild({
                            cls   : "x-layout-split x-layout-split-west",
                            style : {
                                top    : "0px",
                                left   : splitterPos + "px",
                                height : h + "px"
                            }
                        }), cel);
                        this.splitBars[i].index = i;
                        this.splitBars[i].leftComponent = c;
                        this.splitBars[i].addListener("resize", this.onColumnResize, this);
                        this.splitBars[i].minSize = Math.max(c.boxMinWidth || 5, 5);
                    }

                    splitterPos += this.splitBars[i].el.getWidth();
                }

                delete c.columnWidth;
            }
        }

        if (this.split) {
            this.setMaxWidths();
        }
        
        if (Ext.isIE) {
            if (i = target.getStyle("overflow") && i !== "hidden" && !this.adjustmentPass) {
                var ts = this.getLayoutTargetSize();

                if (ts.width !== size.width) {
                    this.adjustmentPass = true;
                    this.onLayout(ct, target);
                }
            }
        }

        delete this.adjustmentPass;
    },

    //  On column resize, explicitly size the Components to the left and right of the SplitBar
    onColumnResize : function (sb, newWidth) {
        if (sb.dragSpecs.startSize) {
            sb.leftComponent.setWidth(newWidth);
            
            var items = this.container.items.items,
                expansion = newWidth - sb.dragSpecs.startSize,
                i, 
                c, 
                w,
                len;
            
            for (i = sb.index + 1, len = items.length; expansion && i < len; i++) {
                c = items[i];
                w = c.el.getWidth();
                    
                newWidth = w - expansion;
                
                if (newWidth < this.minWidth) {
                    c.setWidth(this.minWidth);
                } else if (newWidth > this.maxWidth) {
                    expansion -= (newWidth - this.maxWidth);
                    c.setWidth(this.maxWidth);
                } else {
                    c.setWidth(c.el.getWidth() - expansion);
                    break;
                }
            }
            this.setMaxWidths();
        }
    },

    setMaxWidths : function () {
        var items = this.container.items.items,
            spare = items[items.length - 1].el.dom.offsetWidth - 100,
            i = items.length - 2;

        for (i; i > -1; i--) {
            var sb = this.splitBars[i], 
                sbel = sb.el, 
                c = items[i], 
                cel = c.el,
                itemWidth = cel.dom.offsetWidth;

            sbel.setStyle("left", (cel.getX() - Ext.fly(cel.dom.parentNode).getX() + itemWidth) + "px");
            sb.maxSize = itemWidth + spare;
            sb.setCurrentSize(itemWidth);
            spare = itemWidth - 100;
        }
    },

    onResize : function () {
        if (this.split) {
            var items = this.container.items.items, tw = 0, c, i;

            if (items[0].rendered) {
                for (i = 0; i < items.length; i++) {
                    c = items[i];
                    tw += c.el.getWidth() + c.el.getMargins("lr");
                }
                for (i = 0; i < items.length; i++) {
                    c = items[i];
                    c.columnWidth = (c.el.getWidth() + c.el.getMargins("lr")) / tw;
                }
            }
        }
        Ext.net.ColumnLayout.superclass.onResize.apply(this, arguments);
    }
});

Ext.reg("netcolumn", Ext.net.ColumnLayout);

Ext.Container.LAYOUTS.netcolumn = Ext.net.ColumnLayout;