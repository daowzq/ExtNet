/*!
 * Ext JS Library 3.0.0
 * Copyright(c) 2006-2009 Ext JS, LLC
 * licensing@extjs.com
 * http://www.extjs.com/license
 */


Ext.ux.TabScrollerMenu =  Ext.extend(Object, {
	pageSize       : 10,
	maxText        : 15,
	menuPrefixText : 'Items',
	constructor    : function (config) {
		config = config || {};
		Ext.apply(this, config);
	},
	init : function (tabPanel) {
		Ext.apply(tabPanel, this.parentOverrides);
		
		tabPanel.tabScrollerMenu = this;
		var thisRef = this;
		tabPanel.addEvents("afterscrollbuttons");
		tabPanel.on("tabchange", tabPanel.refreshScrollButtons, tabPanel, {delay : 10});
		
		tabPanel.on({
			render : {
				scope  : tabPanel,
				single : true,
				fn     : function () { 
					var newFn = tabPanel.createScrollers.createSequence(thisRef.createPanelsMenu, this);
					tabPanel.createScrollers = newFn;
				}
			}
		});
	},
	
	// private && sequeneced
	createPanelsMenu : function () {
		var h = this.stripWrap.dom.offsetHeight;
		
		//move the right menu item to the left 18px
		var rtScrBtn = this.header.dom.firstChild;
		Ext.fly(rtScrBtn).applyStyles({
			right : '18px'
		});
		
		var stripWrap = Ext.get(this.strip.dom.parentNode);
		stripWrap.applyStyles({
			 'margin-right' : '36px'
		});
		
		// Add the new righthand menu
		var scrollMenu = this.header.insertFirst({
			cls:'x-tab-tabmenu-right'
		});
		scrollMenu.setHeight(h);
		scrollMenu.addClassOnOver('x-tab-tabmenu-over');
		scrollMenu.on('click', this.showTabsMenu, this);	
		
		this.scrollLeft.show = this.scrollLeft.show.createSequence(function () {
			scrollMenu.show();														 						 
		});
		
		this.scrollLeft.hide = this.scrollLeft.hide.createSequence(function () {
			scrollMenu.hide();								
		});
		
	},
	// public
	getPageSize : function () {
		return this.pageSize;
	},
	// public
	setPageSize : function (pageSize) {
		this.pageSize = pageSize;
	},
	// public
	getMaxText : function () {
		return this.maxText;
	},
	// public
	setMaxText : function (t) {
		this.maxText = t;
	},
	getMenuPrefixText : function () {
		return this.menuPrefixText;
	},
	setMenuPrefixText : function (t) {
		this.menuPrefixText = t;
	},
	// private && applied to the tab panel itself.
	parentOverrides : {
		// all execute within the scope of the tab panel
		// private	
		showTabsMenu : function (e) {		
			if  (this.tabsMenu) {
				this.tabsMenu.destroy();
                this.un('destroy', this.tabsMenu.destroy, this.tabsMenu);
                this.tabsMenu = null;
			}
            this.tabsMenu =  new Ext.menu.Menu();
            this.on('destroy', this.tabsMenu.destroy, this.tabsMenu);

            this.generateTabMenuItems();

            var target = Ext.get(e.getTarget());
			var xy     = target.getXY();
//
			//Y param + 24 pixels
			xy[1] += 24;
			
			this.tabsMenu.showAt(xy);
		},
		// private	
		generateTabMenuItems : function () {
			var curActive  = this.getActiveTab(),
			    totalItems = this.items.getCount(),
			    pageSize   = this.tabScrollerMenu.getPageSize(),
			    menuItems = [],
				addedItems = 0,
				isPaging,
				startSub;
			
			for (var i = 0 ; i < totalItems; i++) {
				var item = this.items.get(i);
				
				if (!(Ext.fly(this.getTabEl(item)).isVisible())) {
				    continue;
				}
				
				if(menuItems.length == pageSize){
				    startSub = Math.floor((addedItems - 1) / pageSize) * pageSize + 1;
				    this.tabsMenu.add({
					    text : this.tabScrollerMenu.getMenuPrefixText() + ' '  + startSub + ' - ' + (startSub + menuItems.length - 1),
					    menu : menuItems
				    });
				    isPaging = true;
				    menuItems = [];
				}
				
				menuItems.push(this.autoGenMenuItem(item));
				addedItems += 1;								
			}
			
			if (menuItems.length > 0) {					
				if(isPaging){
				    startSub = Math.floor((addedItems - 1) / pageSize) * pageSize + 1;
				    this.tabsMenu.add({
					    text : this.tabScrollerMenu.menuPrefixText  + ' ' + startSub + ' - ' + (startSub + menuItems.length - 1),
					    menu : menuItems
				    });
				}
				else{
				    Ext.each(menuItems, function (item) {
				       if (item.tabToShow.id != curActive.id) {
					        this.tabsMenu.add(item);
				       }
			        }, this);
				}
			}
		},
		// private
		autoGenMenuItem : function (item) {
			var maxText = this.tabScrollerMenu.getMaxText();
			var text    = Ext.util.Format.ellipsis(item.title, maxText);
			
			return {
				text      : text,
				handler   : this.showTabFromMenu,
				scope     : this,
				disabled  : item.disabled,
				tabToShow : item,
				iconCls   : item.iconCls
			}
		
		},
		// private
		showTabFromMenu : function (menuItem) {
			this.setActiveTab(menuItem.tabToShow);
		},
		
		getScrollAnim : function () {
            return {duration:this.scrollDuration, callback: this.afterScrollButtons, scope: this};
        },
        
        refreshScrollButtons : function () {
            if (!this.tabsScrolled) {
                this.autoScrollTabs();        
                this.tabsScrolled = true;
            }
        },
        
        afterScrollButtons : function () {
            this.updateScrollButtons();    
            this.refreshScrollButtons();
        }
	}	
});

Ext.reg('tabscrollermenu', Ext.ux.TabScrollerMenu);

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}