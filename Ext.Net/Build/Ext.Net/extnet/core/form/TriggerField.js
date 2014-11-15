
// @source core/form/TriggerField.js

Ext.form.TriggerField.override({
    standardTrigger : true,

    checkTab : function (e, me) {
        if (!e.getKey) {
            var t = e;
            e = me;
            me = t;
        }

        if (e.getKey() === e.TAB && !this.inEditor) {
            this.triggerBlur();
        }
    },

    getTriggerWidth : function () {
        var tw = this.trigger.getWidth(),
            noTrigger = true;

        if (tw < 1) {
            tw = 0;

            Ext.each(this.triggers, function (t) {
                if (t.dom.style.display !== "none") {
                    noTrigger = false;
                    tw += this.defaultTriggerWidth;
                }
            }, this);

            if (this.trigger && noTrigger) {
                if (this.trigger.dom.style.display !== "none") {
                    noTrigger = false;
                    tw += this.defaultTriggerWidth;
                }
            }

            if (noTrigger) {
                return 0;
            }
        }

        return tw;
    },

    getNoteWidthAjustment : function () {
        return this.getTriggerWidth();
    },

    initComponent : function () {
        Ext.form.TriggerField.superclass.initComponent.call(this);

        this.addEvents("triggerclick");

        if (this.triggersConfig) {

            var cn = [], triggerCfg, 
                isSimple,
                i = 0;

            for (i; i < this.triggersConfig.length; i++) {
                var trigger = this.triggersConfig[i],
                    triggerIcon = trigger.iconCls || this.triggerClass;  /*|| "x-form-ellipsis-trigger"*/

                triggerCfg = {
                    "ext:tid": trigger.tag || "",
                    tag: "img",
                    "ext:qtip": trigger.qtip || "",
                    src: Ext.BLANK_IMAGE_URL,
                    cls: "x-form-trigger" + (trigger.triggerCls || "") + " " + triggerIcon
                };

                if (Ext.net.StringUtils.startsWith(triggerIcon || "", "x-form-simple")) {
                    if (i !== 0 || this.shiftLastSimpleIcon) {
                        triggerCfg.cls += " shift-trigger";
                    }

                    isSimple = true;
                }

                if (trigger.hideTrigger) {
                    Ext.apply(triggerCfg, { style: "display:none", hidden: true });

                }

                cn.push(triggerCfg);
            }

            if (this.standardTrigger) {
                triggerCfg = {
                    tag: "img",
                    src: Ext.BLANK_IMAGE_URL,
                    cls: "x-form-trigger"
                };

                if (!Ext.isEmpty(this.triggerClass, false)) {
                    triggerCfg.cls += " " + this.triggerClass;
                }

                if (Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {
                    triggerCfg.cls += " shift-trigger";
                    isSimple = true;
                }

                if (this.hideTrigger) {
                    Ext.apply(triggerCfg, { style: "display:none", hidden: true });
                    this.hideTrigger = false;
                }

                if (this.firstBaseTrigger) {
                    cn.splice(0, 0, triggerCfg);
                } else {
                    cn.push(triggerCfg);
                }
            }

            if (isSimple) {
                this.addClass("clear-right");
            }

            this.triggerConfig = {
                tag: "span",
                cls: "x-form-twin-triggers",
                cn: cn
            };
        }

        if (Ext.isEmpty(this.triggersConfig) && Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {
            this.addClass("clear-right");
        }
    },

    getTrigger : function (index) {
        return this.triggers[index];
    },

    initTrigger : function () {
        if (!this.triggersConfig) {
            this.mon(this.trigger, "click", this.onTriggerClick, this, { preventDefault: true });
            this.trigger.addClassOnOver("x-form-trigger-over");
            this.trigger.addClassOnClick("x-form-trigger-click");

            return;
        }

        var ts = this.trigger.select(".x-form-trigger", true), triggerField = this;

        this.wrap.setStyle("overflow", "hidden");

        ts.each(function (t, all, index, length) {
            t.hide = function () {
                var w = triggerField.wrap.getWidth();

                if (w === 0) {
                    w = triggerField.wrap.getStyleSize().width;
                }

                this.hidden = true;
                this.dom.style.display = "none";
                triggerField.el.setWidth(w - triggerField.getTriggerWidth());
            };

            t.show = function () {
                var w = triggerField.wrap.getWidth();

                if (w === 0) {
                    w = triggerField.wrap.getStyleSize().width || 0;
                }

                this.dom.style.display = "";
                this.dom.removeAttribute("hidden");
                this.hidden = false;
                triggerField.el.setWidth(w - triggerField.getTriggerWidth());
            };

            if ((this.firstBaseTrigger && index === 0) || (!this.firstBaseTrigger && index === (all.getCount() - 1))) {
                t.on("click", this.onTriggerClick, this);
            } else {
                t.on("click", this.onCustomTriggerClick, this, {
                    index   : index,
                    t       : t,
                    tag     : t.getAttributeNS("ext", "tid"),
                    preventDefault : true
                });
            }

            t.addClassOnOver("x-form-trigger-over");
            t.addClassOnClick("x-form-trigger-click");
        }, this);

        this.triggers = ts.elements;
    },

    onCustomTriggerClick : function (evt, el, o) {
        if (!this.disabled) {
            this.fireEvent("triggerclick", this, o.t, o.index, o.tag, evt);
        }
    },

    initDefaultWidth : function () {
        if (!this.width) {
            var w = this.el.getWidth(),
                tw = this.getTriggerWidth();

            if (w < 1) {
                w = 90 - tw;
                this.el.setWidth(w);
            }

            this.wrap.setWidth(w + tw);
        }
    },

    onRender : function (ct, position) {
        this.doc = Ext.isIE ? Ext.getBody() : Ext.getDoc();
        Ext.form.TriggerField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({
            cls: "x-form-field-wrap x-form-field-trigger-wrap"
        });

        this.trigger = this.wrap.createChild(this.triggerConfig || {
            tag: "img",
            src: Ext.BLANK_IMAGE_URL,
            cls: "x-form-trigger " + this.triggerClass
        });

        this.initTrigger();
        this.initDefaultWidth();

        this.resizeEl = this.positionEl = this.wrap;
        
        /* fix for Chrome : trigger is misaligned if Note is used*/
        if (this.trigger && this.trigger.setStyle && Ext.isWebKit && this.note) {
            this.trigger.setStyle("position", "inherit");
            this.trigger.setStyle.defer(10, this.trigger, ["position", "absolute"]);
        }
    },

    removeTriggersWidth : function (w) {
        if (!Ext.isNumber(w) || w === 0) {
            return;
        }

        var tw = this.getTriggerWidth();

        if (Ext.isNumber(w)) {
            this.el.setWidth(w - tw);
        }

        this.wrap.setWidth((this.el.getWidth() || (w - tw)) + tw);
    },

    onResize : function (w, h) {
        Ext.form.TriggerField.superclass.onResize.call(this, w, h);
        this.removeTriggersWidth(w);
    },

    autoSize : function () {
        if (!this.grow || !this.rendered) {
            return;
        }

        if (!this.metrics) {
            this.metrics = Ext.util.TextMetrics.createInstance(this.el);
        }

        var el = this.el,
            v = el.dom.value,
            d = document.createElement("div");

        d.appendChild(document.createTextNode(v));
        v = d.innerHTML;
        Ext.removeNode(d);
        d = null;
        v += "&#160;";

        var w = Math.min(this.growMax, Math.max(this.metrics.getWidth(v) + /* add extra padding */10, this.growMin)),
            tw = this.getTriggerWidth();

        this.el.setWidth(w);
        this.wrap.setWidth(w + tw);
        this.fireEvent("autosize", this, w + tw);
    }
});