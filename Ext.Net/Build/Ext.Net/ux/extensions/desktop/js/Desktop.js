/*
* Ext JS Library 2.2
* Copyright(c) 2006-2008, Ext JS, LLC.
* licensing@extjs.com
* 
* http://extjs.com/license
*/

Ext.ux.StartMenu = Ext.extend(Ext.menu.Menu, {
    toolsWidth: 100,
    
    initComponent : function (config) {
        Ext.ux.StartMenu.superclass.initComponent.call(this, config);
        var tools = this.toolItems;
        this.toolItems = new Ext.util.MixedCollection();
        if (tools) {
            this.addTool.apply(this, tools);
        }
    },

    // private
    onRender : function (ct, position) {
        Ext.ux.StartMenu.superclass.onRender.call(this, ct, position);
        var el = this.el.addClass('ux-start-menu');

        var header = el.createChild({
            tag: "div",
            cls: "x-window-header x-unselectable x-panel-icon " + this.iconCls
        });
        //header.setStyle('padding', '6px 0 0 0');
        this.header = header;
        var headerText = header.createChild({
            tag: "span",
            cls: "x-window-header-text"
        });
        var tl = header.wrap({
            cls: "ux-start-menu-tl"
        });
        var tr = header.wrap({
            cls: "ux-start-menu-tr"
        });
        var tc = header.wrap({
            cls: "ux-start-menu-tc"
        });

        this.menuBWrap = el.createChild({
            tag: "div",
            cls: "x-window-body x-border-layout-ct ux-start-menu-body"
        });
        var ml = this.menuBWrap.wrap({
            cls: "ux-start-menu-ml"
        });
        var mc = this.menuBWrap.wrap({
            cls: "x-window-mc ux-start-menu-bwrap"
        });

        this.menuPanel = this.menuBWrap.createChild({
            tag: "div",
            cls: "x-panel x-border-panel ux-start-menu-apps-panel"
        });
        this.toolsPanel = this.menuBWrap.createChild({
            tag: "div",
            cls: "x-panel x-border-panel ux-start-menu-tools-panel"
        });

        var bwrap = ml.wrap({ cls: "x-window-bwrap" });
        var bc = bwrap.createChild({
            tag: "div",
            cls: "ux-start-menu-bc"
        });
        var bl = bc.wrap({
            cls: "ux-start-menu-bl x-panel-nofooter"
        });
        var br = bc.wrap({
            cls: "ux-start-menu-br"

        });
//        bc.setStyle({
//            height: '0px',
//            padding: '0 0 6px 0'
//        });


        this.ul.appendTo(this.menuPanel);

        var toolsUl = this.toolsPanel.createChild({
            tag: "ul",
            cls: "x-menu-list"
        });

        this.mon(toolsUl, 'click', this.onClick, this);
        this.mon(toolsUl, 'mouseover', this.onMouseOver, this);
        this.mon(toolsUl, 'mouseout', this.onMouseOut, this);

        this.items.each(function (item) {
            item.parentMenu = this;
        }, this);

        this.toolItems.each(
            function (item) {
                var li = document.createElement("li");
                li.className = "x-menu-list-item";
	            toolsUl.dom.appendChild(li);
	            item.render(li);
                item.parentMenu = this;
	        }, this);

        this.toolsUl = toolsUl;

        this.menuBWrap.setStyle("position", "relative");
        this.menuBWrap.setHeight(this.height);
        this.on("show", function () {
            this.menuBWrap.setHeight(this.height - (this.header.getHeight() || 22) - 6);            
        }, this, {single: true});

        this.menuPanel.setStyle({
        	padding: "2px",
        	position: "absolute",
        	overflow: "auto"
        });

        this.toolsPanel.setStyle({
        	padding: "2px 4px 2px 2px",
        	position: "absolute",
        	overflow: "auto"
        });

        this.setTitle(this.title);
    },

    // private
    findTargetItem: function (e) {
        var t = e.getTarget(".x-menu-list-item", this.ul, true);
        if (t && t.menuItemId) {
            if (this.items.get(t.menuItemId)) {
                return this.items.get(t.menuItemId);
            } else {
                return this.toolItems.get(t.menuItemId);
            }
        }
    },

    /**
    * Displays this menu relative to another element
    * @param {Mixed} element The element to align to
    * @param {String} position (optional) The {@link Ext.Element#alignTo} anchor position to use in aligning to
    * the element (defaults to this.defaultAlign)
    * @param {Ext.ux.StartMenu} parentMenu (optional) This menu's parent menu, if applicable (defaults to undefined)
    */
    show: function (el, pos, parentMenu) {
        this.parentMenu = parentMenu;
        if (!this.el) {
            this.render();
        }

        this.fireEvent("beforeshow", this);
        this.showAt(this.el.getAlignToXY(el, pos || this.defaultAlign), parentMenu, false);

        var tPanelWidth = this.toolsWidth;
        var box = this.menuBWrap.getBox();
        this.menuPanel.setWidth(box.width - tPanelWidth);
        this.menuPanel.setHeight(box.height);

        this.toolsPanel.setWidth(tPanelWidth);
        this.toolsPanel.setX(box.x + box.width - tPanelWidth);
        this.toolsPanel.setHeight(box.height);
    },

    addTool: function () {
        var a = arguments, l = a.length, item;
        for (var i = 0; i < l; i++) {
            var el = a[i];

            if (el.render) { // some kind of Item
                item = this.addToolItem(el);
            } else if (typeof el == "string") { // string
                if (el == "separator" || el == "-") {
                    item = this.addToolSeparator();
                } else {
                    item = this.addText(el);
                }
            } else if (el.tagName || el.el) { // element
                item = this.addElement(el);
            } else if (typeof el == "object") { // must be menu item config?
                item = this.addToolMenuItem(el);
            }
        }
        return item;
    },

    /**
    * Adds a separator bar to the Tools
    * @return {Ext.menu.Item} The menu item that was added
    */
    addToolSeparator: function () {
        return this.addToolItem(new Ext.menu.Separator({ itemCls: 'ux-toolmenu-sep' }));
    },

    addToolItem: function (item) {
        this.toolItems.add(item);
        if (this.ul) {
            var li = document.createElement("li");
            li.className = "x-menu-list-item";
            this.ul.dom.appendChild(li);
            item.render(li, this);
            this.delayAutoWidth();
        }
        return item;
    },

    addToolMenuItem: function (config) {
        if (!(config instanceof Ext.menu.Item)) {
            if (config.xtype) {
                config = Ext.ComponentMgr.create(config, "menuitem");
            }
            else if (typeof config.checked == "boolean") { // must be check menu item config?
                config = new Ext.menu.CheckItem(config);
            } else {
                config = new Ext.menu.Item(config);
            }
        }
        return this.addToolItem(config);
    },

    setTitle: function (title, iconCls) {
        this.title = title;
        this.header.child('span').update(title);
        return this;
    }
});

/**
* @class Ext.ux.TaskBar
* @extends Ext.util.Observable
*/
Ext.ux.TaskBar = function (app) {
    this.app = app;
    this.init();
}

Ext.extend(Ext.ux.TaskBar, Ext.util.Observable, {
    init: function () {
        this.startMenu = new Ext.ux.StartMenu(Ext.apply({
            height: 300,
            shadow: true,
            title: "&nbsp;",
            width: 300
        }, this.app.startConfig));

        this.startBtn = new Ext.Button(Ext.apply({
            text: 'Start',
            id: 'ux-startbutton',
            iconCls: 'start',
            menu: this.startMenu,
            menuAlign: 'bl-tl',
            renderTo: 'ux-taskbar-start',
            clickEvent: 'mousedown',
            template: new Ext.Template(
				'<table cellspacing="0" class="x-btn {3}"><tbody><tr>',
				'<td class="ux-startbutton-left"><i>&#160;</i></td>',
                '<td class="ux-startbutton-center"><em class="{5} unselectable="on">',
                    '<button class="x-btn-text {2}" type="BUTTON" style="height:30px;">{0}</button>',
                '</em></td>',
                '<td class="ux-startbutton-right"><i>&#160;</i></td>',
				"</tr></tbody></table>")
         }, this.app.startButtonConfig));

        var width = this.startBtn.getEl().getWidth()+10;

        var sbBox = new Ext.BoxComponent({
            el: 'ux-taskbar-start',
            id: 'TaskBarStart',
            minWidth: width,
            region: 'west',
            split: true,
            width: width
        });

        this.tbPanel = new Ext.ux.TaskButtonsPanel({
            el: 'ux-taskbuttons-panel',
            id: 'TaskBarButtons',
            region: 'center'
        });

        var container = new Ext.ux.TaskBarContainer({
            el: 'ux-taskbar',
            layout: 'border',
            items: [sbBox, this.tbPanel]
        });

        return this;
    },

    addTaskButton: function (win) {
        return this.tbPanel.addButton(win, 'ux-taskbuttons-panel');
    },

    removeTaskButton: function (btn) {
        this.tbPanel.removeButton(btn);
    },

    setActiveButton: function (btn) {
        this.tbPanel.setActiveButton(btn);
    }
});



/**
* @class Ext.ux.TaskBarContainer
* @extends Ext.Container
*/
Ext.ux.TaskBarContainer = Ext.extend(Ext.Container, {
    initComponent: function () {
        Ext.ux.TaskBarContainer.superclass.initComponent.call(this);

        this.el = Ext.get(this.el) || Ext.getBody();
        this.el.setHeight = Ext.emptyFn;
        this.el.setWidth = Ext.emptyFn;
        this.el.setSize = Ext.emptyFn;
        this.el.setStyle({
            overflow: 'hidden',
            margin: '0',
            border: '0 none'
        });
        this.el.dom.scroll = 'no';
        this.allowDomMove = false;
        this.autoWidth = true;
        this.autoHeight = true;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        this.renderTo = this.el;
    },

    fireResize : function (w, h) {
        this.onResize(w, h, w, h);
        this.fireEvent('resize', this, w, h, w, h);
    }
});



/**
* @class Ext.ux.TaskButtonsPanel
* @extends Ext.BoxComponent
*/
Ext.ux.TaskButtonsPanel = Ext.extend(Ext.BoxComponent, {
    activeButton: null,
    enableScroll: true,
    scrollIncrement: 0,
    scrollRepeatInterval: 400,
    scrollDuration: .35,
    animScroll: true,
    resizeButtons: true,
    buttonWidth: 168,
    minButtonWidth: 118,
    buttonMargin: 2,
    buttonWidthSet: false,

    initComponent: function () {
        Ext.ux.TaskButtonsPanel.superclass.initComponent.call(this);
        this.on('resize', this.delegateUpdates);
        this.items = [];

        this.stripWrap = Ext.get(this.el).createChild({
            cls: 'ux-taskbuttons-strip-wrap',
            cn: {
                tag: 'ul', cls: 'ux-taskbuttons-strip'
            }
        });
        this.stripSpacer = Ext.get(this.el).createChild({
            cls: 'ux-taskbuttons-strip-spacer'
        });
        this.strip = new Ext.Element(this.stripWrap.dom.firstChild);

        this.edge = this.strip.createChild({
            tag: 'li',
            cls: 'ux-taskbuttons-edge'
        });
        this.strip.createChild({
            cls: 'x-clear'
        });
    },

    addButton: function (win) {
        var li = this.strip.createChild({ tag: 'li' }, this.edge); // insert before the edge
        var btn = new Ext.ux.TaskBar.TaskButton(win, li);

        this.items.push(btn);

        if (!this.buttonWidthSet) {
            this.lastButtonWidth = btn.container.getWidth();
        }

        this.setActiveButton(btn);
        return btn;
    },

    removeButton: function (btn) {
        var li = document.getElementById(btn.container.id);
        btn.destroy();
        li.parentNode.removeChild(li);

        var s = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            if (this.items[i] != btn) {
                s.push(this.items[i]);
            }
        }
        this.items = s;

        this.delegateUpdates();
    },

    setActiveButton: function (btn) {
        this.activeButton = btn;
        this.delegateUpdates();
    },

    delegateUpdates: function () {
        /*if (this.suspendUpdates) {
        return;
        }*/
        if (this.resizeButtons && this.rendered) {
            this.autoSize();
        }
        if (this.enableScroll && this.rendered) {
            this.autoScroll();
        }
    },

    autoSize: function () {
        var count = this.items.length;
        var ow = this.el.dom.offsetWidth;
        var aw = this.el.dom.clientWidth;

        if (!this.resizeButtons || count < 1 || !aw) { // !aw for display:none
            return;
        }

        var each = Math.max(Math.min(Math.floor((aw - 4) / count) - this.buttonMargin, this.buttonWidth), this.minButtonWidth); // -4 for float errors in IE
        var btns = this.stripWrap.dom.getElementsByTagName('button');

        this.lastButtonWidth = Ext.get(btns[0].id).findParent('li').offsetWidth;

        for (var i = 0, len = btns.length; i < len; i++) {
            var btn = btns[i];

            var tw = Ext.get(btns[i].id).findParent('li').offsetWidth;
            var iw = btn.offsetWidth;

            btn.style.width = (each - (tw - iw)) + 'px';
        }
    },

    autoScroll: function () {
        var count = this.items.length;
        var ow = this.el.dom.offsetWidth;
        var tw = this.el.dom.clientWidth;

        var wrap = this.stripWrap;
        var cw = wrap.dom.offsetWidth;
        var pos = this.getScrollPos();
        var l = this.edge.getOffsetsTo(this.stripWrap)[0] + pos;

        if (!this.enableScroll || count < 1 || cw < 20) { // 20 to prevent display:none issues
            return;
        }

        wrap.setWidth(tw); // moved to here because of problem in Safari

        if (l <= tw) {
            wrap.dom.scrollLeft = 0;
            //wrap.setWidth(tw); moved from here because of problem in Safari
            if (this.scrolling) {
                this.scrolling = false;
                this.el.removeClass('x-taskbuttons-scrolling');
                this.scrollLeft.hide();
                this.scrollRight.hide();
            }
        } else {
            if (!this.scrolling) {
                this.el.addClass('x-taskbuttons-scrolling');
            }
            tw -= wrap.getMargins('lr');
            wrap.setWidth(tw > 20 ? tw : 20);

            if (!this.scrolling) {
                if (!this.scrollLeft) {
                    this.createScrollers();
                } else {
                    this.scrollLeft.show();
                    this.scrollRight.show();
                }
            }
            this.scrolling = true;

            if (pos > (l - tw)) { // ensure it stays within bounds
                wrap.dom.scrollLeft = l - tw;
            } else { // otherwise, make sure the active button is still visible
                this.scrollToButton(this.activeButton, true); // true to animate
            }
            this.updateScrollButtons();
        }
    },

    createScrollers: function () {
        var h = this.el.dom.offsetHeight; //var h = this.stripWrap.dom.offsetHeight;

        // left
        var sl = this.el.insertFirst({
            cls: 'ux-taskbuttons-scroller-left'
        });
        sl.setHeight(h);
        sl.addClassOnOver('ux-taskbuttons-scroller-left-over');
        this.leftRepeater = new Ext.util.ClickRepeater(sl, {
            interval: this.scrollRepeatInterval,
            handler: this.onScrollLeft,
            scope: this
        });
        this.scrollLeft = sl;

        // right
        var sr = this.el.insertFirst({
            cls: 'ux-taskbuttons-scroller-right'
        });
        sr.setHeight(h);
        sr.addClassOnOver('ux-taskbuttons-scroller-right-over');
        this.rightRepeater = new Ext.util.ClickRepeater(sr, {
            interval: this.scrollRepeatInterval,
            handler: this.onScrollRight,
            scope: this
        });
        this.scrollRight = sr;
    },

    getScrollWidth: function () {
        return this.edge.getOffsetsTo(this.stripWrap)[0] + this.getScrollPos();
    },

    getScrollPos: function () {
        return parseInt(this.stripWrap.dom.scrollLeft, 10) || 0;
    },

    getScrollArea: function () {
        return parseInt(this.stripWrap.dom.clientWidth, 10) || 0;
    },

    getScrollAnim: function () {
        return {
            duration: this.scrollDuration,
            callback: this.updateScrollButtons,
            scope: this
        };
    },

    getScrollIncrement: function () {
        return (this.scrollIncrement || this.lastButtonWidth + 2);
    },

    /* getBtnEl : function (item) {
    return document.getElementById(item.id);
    }, */

    scrollToButton: function (item, animate) {
        item = item.el.dom.parentNode; // li
        if (!item) { return; }
        var el = item; //this.getBtnEl(item);
        var pos = this.getScrollPos(), area = this.getScrollArea();
        var left = Ext.fly(el).getOffsetsTo(this.stripWrap)[0] + pos;
        var right = left + el.offsetWidth;
        if (left < pos) {
            this.scrollTo(left, animate);
        } else if (right > (pos + area)) {
            this.scrollTo(right - area, animate);
        }
    },

    scrollTo: function (pos, animate) {
        this.stripWrap.scrollTo('left', pos, animate ? this.getScrollAnim() : false);
        if (!animate) {
            this.updateScrollButtons();
        }
    },

    onScrollRight: function () {
        var sw = this.getScrollWidth() - this.getScrollArea();
        var pos = this.getScrollPos();
        var s = Math.min(sw, pos + this.getScrollIncrement());
        if (s != pos) {
            this.scrollTo(s, this.animScroll);
        }
    },

    onScrollLeft: function () {
        var pos = this.getScrollPos();
        var s = Math.max(0, pos - this.getScrollIncrement());
        if (s != pos) {
            this.scrollTo(s, this.animScroll);
        }
    },

    updateScrollButtons: function () {
        var pos = this.getScrollPos();
        this.scrollLeft[pos === 0 ? 'addClass' : 'removeClass']('ux-taskbuttons-scroller-left-disabled');
        this.scrollRight[pos >= (this.getScrollWidth() - this.getScrollArea()) ? 'addClass' : 'removeClass']('ux-taskbuttons-scroller-right-disabled');
    }
});



/**
* @class Ext.ux.TaskBar.TaskButton
* @extends Ext.Button
*/
Ext.ux.TaskBar.TaskButton = function (win, el) {
    this.win = win;
    Ext.ux.TaskBar.TaskButton.superclass.constructor.call(this, {
        iconCls: win.iconCls,
        text: Ext.util.Format.ellipsis(win.title, win.desktop.app.textLengthToTruncate || 12),
        renderTo: el,
        handler: function () {
            if (win.minimized || win.hidden) {
                win.origShow();
            } else if (win == win.manager.getActive()) {
                win.minimize();
            } else {
                win.toFront();
            }
        },
        clickEvent: 'mousedown',
        template: new Ext.Template(
			'<table cellspacing="0" class="x-btn {3}"><tbody><tr>',
			'<td class="ux-taskbutton-left"><i>&#160;</i></td>',
            '<td class="ux-taskbutton-center"><em class="{5} unselectable="on">',
                '<button class="x-btn-text {2}" type="BUTTON" style="height:28px;">{0}</button>',
            '</em></td>',
            '<td class="ux-taskbutton-right"><i>&#160;</i></td>',
			"</tr></tbody></table>") 
    });
};

Ext.extend(Ext.ux.TaskBar.TaskButton, Ext.Button, {
    onRender: function () {
        Ext.ux.TaskBar.TaskButton.superclass.onRender.apply(this, arguments);

        this.cmenu = new Ext.menu.Menu({
            items: [{
                text: 'Restore',
                handler: function () {
                    if (!this.win.isVisible()) {
                        this.win.origShow();
                    } else {
                        this.win.restore();
                    }
                },
                scope: this
            }, {
                text: 'Minimize',
                handler: this.win.minimize,
                scope: this.win
            }, {
                text: 'Maximize',
                handler: this.win.maximize,
                scope: this.win
            }, '-', {
                text: 'Close',
                handler: this.closeWin.createDelegate(this, this.win, true),
                scope: this.win
}]
            });

            this.cmenu.on('beforeshow', function () {
                var items = this.cmenu.items.items;
                var w = this.win;
                items[0].setDisabled(w.maximized !== true && w.hidden !== true);
                items[1].setDisabled(w.minimized === true);
                items[2].setDisabled(w.maximized === true || w.hidden === true);
            }, this);

            this.el.on('contextmenu', function (e) {
                e.stopEvent();

                if (!this.cmenu.el) {
                    this.cmenu.render();
                }
                var xy = e.getXY();
                xy[1] -= this.cmenu.el.getHeight();
                this.cmenu.showAt(xy);
            }, this);
        },

        setText: function (text) {
            this.text = text;

            if (this.el) {
                this.el.child("td.ux-taskbutton-center " + this.buttonSelector).update(text);
            }
            this.doAutoWidth();

            return this;
        },

        closeWin: function (cMenu, e, win) {
            if (win.closeAction == 'hide') {
                win.hide();
                win.taskButton.setVisible(false);
            }
            else {
                if (!win.isVisible()) {
                    win.origShow();
                } else {
                    win.restore();
                }
                win.close();
            }
        },
		
		onDestroy : function () {
            this.cmenu.destroy();
        }
    });

    Ext.Desktop = function (app) {
        this.taskbar = new Ext.ux.TaskBar(app);
	this.xTickSize = this.yTickSize = 1;
        var taskbar = this.taskbar;

        var desktopEl = Ext.get('x-desktop');
        var taskbarEl = Ext.get('ux-taskbar');
        var shortcuts = Ext.get('x-shortcuts');

        var windows = new Ext.WindowGroup();

        var dlgWin = Ext.MessageBox.getDialog("&#160;");

        dlgWin.manager = windows;
        dlgWin.manager.register(dlgWin);

        var activeWindow;

        function minimizeWin(win) {
            win.minimized = true;
            win.isMinimize = true;
            win.hide();
        }

        function markActive(win) {
            if (activeWindow && activeWindow != win) {
                markInactive(activeWindow);
            }
            taskbar.setActiveButton(win.taskButton);
            activeWindow = win;
            Ext.fly(win.taskButton.el).addClass('active-win');
            win.minimized = false;
        }

        function markInactive(win) {
            if (win == activeWindow) {
                activeWindow = null;
                Ext.fly(win.taskButton.el).removeClass('active-win');
            }
        }

        function removeWin(win) {
            taskbar.removeTaskButton(win.taskButton);
            layout();
        }

        function hideWin(win) {
            if (!win.isMinimize) {
                win.taskButton.setVisible(false);
            }
            win.isMinimize = false;

            layout();
        }

        function showWin(win) {
            win.taskButton.setVisible(true);
            layout();
        }

        function layout() {
            desktopEl.setHeight(Ext.lib.Dom.getViewHeight() - taskbarEl.getHeight());
        }
        Ext.EventManager.onWindowResize(layout);

        this.layout = layout;

        this.createWindow = function (config, cls) {

            var win = new (cls || Ext.net.DesktopWindow)(
                Ext.applyIf(config, {
                    manager: windows,
                    desktop: this
                })
            );

            return win;
        };

        this.tuneDesktopWindow = function (win) {
            if (win.tuned) {
                return win;
            }
            
            if (!win.rendered) {
                win.render(desktopEl);
            }
	    
	    win.dd.xTickSize = this.xTickSize;
            win.dd.yTickSize = this.yTickSize;
	    if (win.resizer) {
            	win.resizer.widthIncrement = this.xTickSize;
            	win.resizer.heightIncrement = this.yTickSize;
            }
	    
            win.taskButton = taskbar.addTaskButton(win);
            if (!win.showInTaskbar) {
                win.taskButton.addClass("x-hidden");
            }

            win.cmenu = new Ext.menu.Menu({
                items: [

            ]
            });

            win.setAnimateTarget(win.taskButton.el);

            win.on({
                'activate': {
                    fn: markActive
                },
                'beforeshow': {
                    fn: markActive
                },
                'deactivate': {
                    fn: markInactive
                },
                'minimize': {
                    fn: minimizeWin
                },
                'hide': {
                    fn: hideWin
                },
                'show': {
                    fn: showWin
                },
                'close': {
                    fn: removeWin
                }
            });

            layout();
            
            win.tuned = true;

            return win;
        };

        this.getManager = function () {
            return windows;
        };

        this.getWindow = function (id) {
            return windows.get(id) || window[id];
        };

        this.getWinWidth = function () {
            var width = Ext.lib.Dom.getViewWidth();

            return width < 200 ? 200 : width;
        };

        this.getWinHeight = function () {
            var height = (Ext.lib.Dom.getViewHeight() - taskbarEl.getHeight());

            return height < 100 ? 100 : height;
        };

        this.getWinX = function (width) {
            return (Ext.lib.Dom.getViewWidth() - width) / 2
        };

        this.getWinY = function (height) {
            return (Ext.lib.Dom.getViewHeight() - taskbarEl.getHeight() - height) / 2;
        };

        this.setBackgroundColor = function (color) {
            if (color) {
                Ext.get(document.body).setStyle("background-color", color);
            }
        };

        this.setFontColor = function (color) {
            if (color) {
                if (!Ext.util.CSS.updateRule(".x-shortcut-text", "color", color)) {
					Ext.net.ResourceMgr.registerCssClass("", ".x-shortcut-text { color: " + color + "; }", false);        
				}
            }
        };

        this.setWallpaper = function (imageUrl) {
            var waitDialog = Ext.MessageBox.wait('Loading wallpaper...', 'Please wait');
            var image = new Image();
            image.src = imageUrl;
            var checkTask = new Ext.util.DelayedTask(function () {
                if (image.complete) {
                    checkTask.cancel();
                    waitDialog.hide();
                    document.body.background = image.src;
                } else {
                    checkTask.delay(200);
                }
            }, this);
            checkTask.delay(200);
        };
	
	this.setTickSize = function(xTickSize, yTickSize) {
	        this.xTickSize = xTickSize;
	        if (arguments.length == 1) {
	            this.yTickSize = xTickSize;
	        } else {
	            this.yTickSize = yTickSize;
	        }
	        windows.each(function(win) {
	            win.dd.xTickSize = this.xTickSize;
	            win.dd.yTickSize = this.yTickSize;
	            win.resizer.widthIncrement = this.xTickSize;
	            win.resizer.heightIncrement = this.yTickSize;
	        },
	        this);
    	};
	
	this.cascade = function() {
	        var x = 0,
	        y = 0;
	        windows.each(function(win) {
	            if (win.isVisible() && !win.maximized) {
	                win.setPosition(x, y);
	                x += 20;
	                y += 20;
	            }
	        },
	        this);
	    };

	this.tile = function() {
	        var availWidth = desktopEl.getWidth(true);
	        var x = this.xTickSize;
	        var y = this.yTickSize;
	        var nextY = y;
	        windows.each(function(win) {
	            if (win.isVisible() && !win.maximized) {
	                var w = win.el.getWidth();

	                //              Wrap to next row if we are not at the line start and this Window will go off the end
	                if ((x > this.xTickSize) && (x + w > availWidth)) {
	                    x = this.xTickSize;
	                    y = nextY;
	                }

	                win.setPosition(x, y);
	                x += w + this.xTickSize;
	                nextY = Math.max(nextY, y + win.el.getHeight() + this.yTickSize);
	            }
	        },
	        this);
	};

        this.col = null;
        this.row = null;

        this.isOverrun = function (y) {
            return y > (Ext.lib.Dom.getViewHeight() - taskbarEl.getHeight())
        };

        this.initShortcuts = function () {
            if (shortcuts) {
                this.col = { index: 1, x: 10 };
                this.row = { index: 1, y: 10 };
                var items = shortcuts.query('dt');
                for (var i = 0, len = items.length; i < len; i++) {
                    var item = Ext.Element.get(items[i])
                    var x = item.getAttributeNS('ext', 'X');
                    var y = item.getAttributeNS('ext', 'Y');

                    if (Ext.isEmpty(x) || Ext.isEmpty(y)) {
                        this.setPosition(item);
                    }
                    else {
                        x = eval(x.replace('{DX}', 'Ext.lib.Dom.getViewWidth()'));
                        y = eval(y.replace('{DY}', '(Ext.lib.Dom.getViewHeight() - taskbarEl.getHeight())'));
                        item.setXY([x, y]);
                    }
                }
            }
        };

        this.setPosition = function (item) {
            if (this.isOverrun(this.row.y + 64) && ((this.row.y + 64) > 74)) {
                this.col = {
                    index: this.col.index++,
                    x: this.col.x + 68
                };
                this.row = {
                    index: 1,
                    y: 10
                };
            }

            item.setXY([
			this.col.x,
			this.row.y
		]);

            this.row.index++;
            this.row.y = this.row.y + 74;
        };

        this.showWindow = function (windowID) {
            if (Ext.isEmpty(windowID)) {
                return;
            }

            var win = this.getWindow(windowID);

            this.tuneDesktopWindow(win);
            win.taskButton.setText(Ext.util.Format.ellipsis(win.title, win.desktop.app.textLengthToTruncate || 12));
            win.origShow();

            return true;
        }

        Ext.EventManager.onWindowResize(this.initShortcuts, this, { delay: 500 });

        layout();

        if (shortcuts) {
            shortcuts.on('click', function (e, t) {
                if (t = e.getTarget('dt', shortcuts)) {
                    var id = t.id.replace('-shortcut', '');
                    var isCustom = Ext.fly(t).getAttributeNS('ext', 'custom') || false;
                    if (isCustom) {
                        this.app.fireEvent("shortcutclick", id, e);
                        e.stopEvent();
                        return;
                    }

                    e.stopEvent();
                    var module = app.getModule(id);
                    if (module) {
                        module.createWindow();
                    }
                }
            }, this);           

//            var startDrag = function (x, y) {
//                var dragEl = Ext.get(this.getDragEl());
//                var el = Ext.get(this.getEl());

//                dragEl.applyStyles({ border: '', 'z-index': 2000 });
//                dragEl.update(el.dom.innerHTML);
//                dragEl.addClass(el.dom.className + ' dd-proxy');
//            }

//            var arrayOfdt = document.getElementsByTagName('dt');

//            for (i in arrayOfdt) {
//                if (arrayOfdt[i].id != null) {
//                    Ext.get(arrayOfdt[i].id).dd = new Ext.dd.DDProxy(arrayOfdt[i].id, 'group');
//                    Ext.get(arrayOfdt[i].id).dd.startDrag = startDrag;
//                }
//            }
        }
    };

    Ext.app.App = function (cfg) {
        Ext.apply(this, cfg);
        this.addEvents({
            'ready': true,
            'beforeunload': true,
            'shortcutclick': true
        });

        if (this.listeners) {
            this.on(this.listeners);
            delete this.listeners;
        }
        if (cfg.id) {
            window[cfg.id] = this;
        }
        if(!Ext.isReady){
           Ext.onReady(this.initApp, this);
        }
        else{
            this.initApp();
        }
    };

    Ext.extend(Ext.app.App, Ext.util.Observable, {
        isReady: false,
        startMenu: null,
        modules: null,

        getStartConfig: function () {
        },

        getStartButtonConfig: function () {
        },

        initApp: function () {

            this.startConfig = this.startConfig || this.getStartConfig.call(window);
            this.startButtonConfig = this.startButtonConfig || this.getStartButtonConfig.call(window);

            this.desktop = new Ext.Desktop(this);
            this.desktop.app = this;
			
			if (this.xTickSize) {
                this.desktop.xTickSize = this.xTickSize;
            }
			
			if (this.yTickSize) {
                this.desktop.yTickSize = this.yTickSize;
            }

            this.launcher = this.desktop.taskbar.startMenu;

            this.modules = this.getModules();

            if (this.modules) {
                this.initModules(this.modules);
            }
            
            this.launcher.insert(0, "-");
            this.launcher.remove(0);

            this.init();

            if (this.backgroundColor) {
                this.desktop.setBackgroundColor(this.backgroundColor);
            }

            if (this.shortcutTextColor) {
                this.desktop.setFontColor(this.shortcutTextColor);
            }

            if (this.wallpaper) {
                this.desktop.setWallpaper(this.wallpaper);
            }

            this.desktop.initShortcuts();

            this.initAutoRun();

            Ext.getBody().addClass('x-desktop-body');            

            Ext.EventManager.on(window, 'beforeunload', this.onUnload, this);
            this.fireEvent('ready', this);
            this.isReady = true;
        },

        getModules: Ext.emptyFn,
        init: Ext.emptyFn,

        initModules: function (ms) {
            for (var i = 0, len = ms.length; i < len; i++) {
                var m = ms[i];

                if (!Ext.isEmpty(m.launcher)) {
                    this.launcher.add(m.launcher);
                }
                m.app = this;
            }
        },

        initAutoRun: function () {
            if (this.modules) {
                for (var i = 0; i < this.modules.length; i++) {
                    var m = this.modules[i];
                    if (m.autoRun) {
                        var autoRunTask = new Ext.util.DelayedTask(function (task, mod) {
                            if (mod.createWindow()) {
                                task.cancel();
                            } else {
                                task.delay(200, undefined, undefined, [task, mod]);
                            }
                        }, this);
                        autoRunTask.delay(200, undefined, undefined, [autoRunTask, this.modules[i]]);
                    }
                }
            }
        },

        getModule: function (name) {
            var ms = this.modules;
            for (var i = 0, len = ms.length; i < len; i++) {
                if (ms[i].id == name || ms[i].appType == name) {
                    return ms[i];
                }
            }

            return '';
        },

        onReady: function (fn, scope) {
            if (!this.isReady) {
                this.on('ready', fn, scope);
            } else {
                fn.call(scope, this);
            }
        },

        getDesktop: function () {
            return this.desktop;
        },

        onUnload: function (e) {
            if (this.fireEvent('beforeunload', this) === false) {
                e.stopEvent();
            }
        }
    });

    Ext.app.Module = function (config) {
        Ext.apply(this, config);
        Ext.app.Module.superclass.constructor.call(this);
        this.init();
    }

    Ext.extend(Ext.app.Module, Ext.util.Observable, {
        init: function () {
            if (!Ext.isEmpty(this.launcher) && !Ext.isEmpty(this.windowID)) {
                this.launcher = this.launcher.render ? this.launcher : Ext.ComponentMgr.create(this.launcher, "menuitem");
                this.launcher.on("click", this.createWindow, this);
            }
        },
        createWindow: function () {
            if (Ext.isEmpty(this.windowID)) {
                return;
            }

            var desktop = this.app.getDesktop();
            var win = desktop.getWindow(this.windowID);

            desktop.tuneDesktopWindow(win);            
            win.origShow();

            return true;
        }
    });

    Ext.net.DesktopWindow = function (config) {
        if (config.modal) {
            config.minimizable = false;
        }
        Ext.net.DesktopWindow.superclass.constructor.call(this, config);
    }    
    
    Ext.extend(Ext.net.DesktopWindow, Ext.Window, {
        lazyRender : true,
        showInTaskbar : true,
        
        show: function () {
            this.desktop.tuneDesktopWindow(this);
            this.taskButton.setText(Ext.util.Format.ellipsis(this.title, this.desktop.app.textLengthToTruncate || 12));
            this.origShow();
        },
        
        initComponent: function () {
            Ext.net.DesktopWindow.superclass.initComponent.call(this); 
            
            if (!this.lazyRender) {
                this.render(Ext.get("x-desktop"));
            }
        },

        origShow: function () {
            Ext.net.DesktopWindow.superclass.show.call(this, arguments.length > 0 ? arguments : undefined);
        },

        center: function () {
            if (this.rendered && this.el.isVisible()) {
                this.origCenter();
            }
            else {
                this.on("show", function () { this.origCenter(); }, this, { single: true });
            }
        },

        origCenter: function () {
            Ext.net.DesktopWindow.superclass.center.call(this);
        },

        minimize: function () {
            if (this.modal) {
                return;
            }

            this.fireEvent("minimize", this);
        }
    });
    Ext.reg("desktopwindow", Ext.net.DesktopWindow);

    if (typeof Sys !== "undefined") { Sys.Application.notifyScriptLoaded(); }
