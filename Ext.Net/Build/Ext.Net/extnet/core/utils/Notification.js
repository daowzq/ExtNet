
// @source core/utils/Notification.js

Ext.net.Notification = function () {
    Ext.MessageBox.notify = function (title, msg) {
        if (Ext.isString(title)) {
            Ext.net.Notification.show({
                title: title,
                html: msg || ""
            });
        } else {
            Ext.net.Notification.show(title);
        }
    };

    var notifications = [];

    return {
        show: function (config) {
            config = Ext.applyIf(config || {}, {
                width: 200,
                height: 100,
                autoHide: true,
                plain: false,
                resizable: false,
                draggable: false,
                bodyStyle: "padding:3px;text-align:center",
                alignToCfg: {
                    el: document,
                    position: "br-br",
                    offset: [-20, -20]
                },
                showMode: "grid", /* "grid|stack" */
                closeVisible: false,
                bringToFront: false,
                pinEvent: "none",
                hideDelay: 2500,
                shadow: false,
                showPin: false,
                pinned: false,
                showFx: {
                    fxName: "slideIn",
                    args: ["b", { duration: 1}]
                },
                hideFx: {
                    fxName: "ghost",
                    args: ["b", { duration: 1}]
                },

                /*functions*/
                focus: Ext.emptyFn,

                stopHiding: function () {
                    this.removeClass("x-notification-auto-hide");
                    this.pinned = true;

                    if (this.autoHide) {
                        this.hideTask.cancel();
                    }
                },

                isStandardAlign: function () {
                    return this.alignToCfg.el == document && this.alignToCfg.position === "br-br";
                },

                getStatndardAlign: function () {
                    var w = [],
                        i = 0;

                    for (i; i < notifications.length; i++) {
                        var window = notifications[i];

                        if (window.isStandardAlign()) {
                            w.push(window);
                        }
                    }

                    return w;
                },

                getOffset: function () {
                    var offset = [], predefinedOffset = this.alignToCfg.offset || [-20, -20];
                    //need clone
                    offset.push(predefinedOffset[0]);
                    offset.push(predefinedOffset[1]);

                    if (this.showMode === "grid" && this.isStandardAlign()) {
                        var saw = this.getStatndardAlign(),
                            height = this.getSize().height - offset[1],
                            width = this.getSize().width - offset[0],
                            yPos = Ext.fly(this.alignToCfg.el).getViewSize().height - height,
                            xPos = Ext.fly(this.alignToCfg.el).getViewSize().width - width,
                            found = false,
                            isIntersect = function (tBox, box) {
                                tBox.x2 = tBox.x + tBox.width;
                                tBox.y2 = tBox.y + tBox.height;

                                box.x2 = box.x + box.width;
                                box.y2 = box.y + box.height;

                                if ((tBox.x2 - box.x) <= 0 || (box.x2 - tBox.x) <= 0) {
                                    return false;
                                }

                                if ((tBox.y2 - box.y) <= 0 || (box.y2 - tBox.y) <= 0) {
                                    return false;
                                }

                                return true;
                            };

                        while (xPos >= 0 && !found) {
                            while (yPos >= 0 && !found) {
                                var intersect = false,
                                    i = 0;

                                for (i; i < saw.length; i++) {
                                    var window = saw[i];

                                    if (isIntersect({ x: xPos, y: yPos, width: width, height: height }, window.getBox())) {
                                        intersect = true;
                                        break;
                                    }
                                }

                                found = !intersect;

                                if (!found) {
                                    yPos -= height;
                                }
                            }

                            if (!found) {
                                yPos = Ext.fly(this.alignToCfg.el).getViewSize().height - height;
                                xPos -= width;
                            }
                        }

                        if (found) {
                            offset[0] = offset[0] + ((xPos + width) - Ext.fly(this.alignToCfg.el).getViewSize().width);
                            offset[1] = offset[1] + ((yPos + height) - Ext.fly(this.alignToCfg.el).getViewSize().height);
                        }
                    }

                    return offset;
                },
                animShow: function () {
                    var offset = this.getOffset();
                    notifications.push(this);
                    this.alignOffset = offset;
                    this.el.alignTo(this.alignToCfg.el || document, this.alignToCfg.position || "br-br", offset);

                    if (Ext.isArray(this.showFx.args) && this.showFx.args.length > 0) {
                        this.showFx.args[this.showFx.args.length - 1] = Ext.apply(this.showFx.args[this.showFx.args.length - 1], { callback: this.afterShow, scope: this });
                    } else {
                        this.showFx.args = [{ callback: this.afterShow, scope: this}];
                    }

                    this.el[this.showFx.fxName].apply(this.el, this.showFx.args);
                },
                animHide: function () {
                    if (Ext.isArray(this.hideFx.args) && this.hideFx.args.length > 0) {
                        this.hideFx.args[this.hideFx.args.length - 1] = Ext.apply(this.hideFx.args[this.hideFx.args.length - 1], { callback: this.doClose, scope: this });
                    } else {
                        this.showFx.args = [{ callback: this.doClose, scope: this}];
                    }

                    this.el[this.hideFx.fxName].apply(this.el, this.hideFx.args);
                }
            });

            config.cls = config.cls || "";
            config.cls += " x-notification" + (config.autoHide ? " x-notification-auto-hide" : "");

            var w = new Ext.Window(config),
                mOver = function (e, t) {
                    if (!this.pinned) {
                        this.hideTask.cancel();
                        this.delayed = true;
                    }
                },
                mOut = function (e, t) {
                    if (!this.pinned) {
                        this.hideTask.delay(this.hideDelay);
                        this.delayed = false;
                    }
                };

            w.on("render", function () {
                if (this.autoHide) {
                    this.body.on("mouseover", mOver, this);
                    this.body.on("mouseout", mOut, this);
                    this.header.on("mouseover", mOver, this);
                    this.header.on("mouseout", mOut, this);
                }

                if (this.contentEl) {
                    Ext.fly(this.contentEl).removeClass("x-hide-offsets");
                }
            }, w);

            w.afterRender = w.afterRender.createSequence(function () {
                if (this.showPin) {
                    this.pin = function (e, tool) {
                        tool.hide();
                        this.tools.pin.show();
                        this.hideTask.cancel();
                        this.pinned = true;
                    };

                    this.unpin = function (e, tool) {
                        tool.hide();
                        this.tools.unpin.show();
                        this.hide();
                        this.pinned = false;
                    };

                    this.addTool({
                        id: "unpin",
                        handler: this.pin,
                        hidden: this.pinned,
                        scope: this
                    });

                    this.addTool({
                        id: "pin",
                        handler: this.unpin,
                        hidden: !this.pinned,
                        scope: this
                    });
                }
            });

            w.toFront = function (e) {
                var aw = Ext.WindowMgr.getActive();

                this.manager.bringToFront(this);

                if (!Ext.isEmpty(aw) && aw !== this && !this.bringToFront && aw.manager) {
                    aw.manager.bringToFront(aw);
                    aw.manager.bringToFront.defer(10, aw.manager, [aw]);
                }

                return this;
            };

            w.focus = Ext.emptyFn;

            w.afterShow = w.afterShow.createSequence(function () {
                if (this.pinEvent !== "none") {
                    this.body.on(this.pinEvent, this.stopHiding, this);
                    this.on(this.pinEvent, this.stopHiding, this);
                }

                if (this.autoHide && !this.delayed && !this.pinned) {
                    this.hideTask.delay(this.hideDelay);
                }
            });

            w.on("beforedestroy", function () {
                var i = 0;

                for (i; i < notifications.length; i++) {
                    if (notifications[i].id == this.id) {
                        notifications.remove(this);
                        break;
                    }
                }

                if (this.contentEl) {
                    var ce = Ext.get(this.contentEl), el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();

                    ce.addClass("x-hidden");
                    el = el.dom;
                    el.appendChild(ce.dom);
                }

                if (this.initialConfig.id) {
                    window[this.initialConfig.id] = undefined;
                }
            }, w);

            if (config.autoHide) {
                w.hideTask = new Ext.util.DelayedTask(w.hide, w);
            }

            if (config.closeVisible) {
                var i = notifications.length - 1;

                for (i; i >= 0; i--) {
                    notifications[i].destroy();
                }
            }
            
            w.on("beforehide", function () {
                this.el.disableShadow();
            }, w);

            w.show(config.alignToCfg.el || document);

            return w;
        }
    };
}();