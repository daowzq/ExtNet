
// @source data/ImageCommandColumn.js

Ext.net.ImageCommandColumn = function (config) {
    Ext.apply(this, config);
    
    if (!this.id) {
        this.id = Ext.id();
    }

    //this.renderer = this.renderer.createDelegate(this);

    Ext.net.ImageCommandColumn.superclass.constructor.call(this);    
};

Ext.extend(Ext.net.ImageCommandColumn, Ext.util.Observable, {
    dataIndex    : "",
    header       : "",
    menuDisabled : true,
    sortable     : false,

    init : function (grid) {
        this.grid = grid;

        var view = this.grid.getView();
        
        if (this.grid.rendered) {
            view.mainBody.on("click", this.onClick, this);

            if (view.lockedBody) {
                view.lockedBody.on("click", this.onClick, this);
            }
        } else {
            this.grid.afterRender = grid.afterRender.createSequence(function () {
                view.mainBody.on("click", this.onClick, this);

                if (view.lockedBody) {
                    view.lockedBody.on("click", this.onClick, this);
                }
            }, this);
        }
        
        var sm = grid.getSelectionModel();
        
        this.commands = this.commands || [];
        
        if (sm.id === "checker") {
            sm.onMouseDown = sm.onMouseDown.createInterceptor(this.onMouseDown, this);
        } else if (sm.selectRows) {       
            sm.handleMouseDown = sm.handleMouseDown.createInterceptor(this.rmHandleMouseDown, this);
        } else {
            sm.handleMouseDown = sm.handleMouseDown.createInterceptor(this.handleMouseDown, this);
        }
        
        this.renderer = this.renderer.createDelegate(this);

        if (view.groupTextTpl && this.groupCommands) {
            view.processEvent = view.processEvent.createInterceptor(function (name, e) {
                if (name === "mousedown" && e.getTarget(".group-row-imagecommand")) {
                    return false;
                }
            });

            view.doGroupStart = view.doGroupStart.createInterceptor(function (buf, group, cs, store, colCount) {
                var preparedCommands = [], 
                    i,
                    groupCommands = this.commandColumn.groupCommands;
                    
                group.cls = (group.cls || "") + " group-imagecmd-ct";
                
                var groupId = group ? group.groupId.replace(/ext-gen[0-9]+-gp-/, "") : null;
                
                if (this.commandColumn.prepareGroupCommands) {  
                    groupCommands = Ext.net.clone(this.commandColumn.groupCommands);
                    this.commandColumn.prepareGroupCommands(this.grid, groupCommands, groupId, group);
                }
                
                for (i = 0; i < groupCommands.length; i++) {
                    var cmd = groupCommands[i];
                    
                    cmd.tooltip = cmd.tooltip || {};
                    
                    var command = {
                        command    : cmd.command,
                        cls        : cmd.cls,
                        iconCls    : cmd.iconCls,
                        hidden     : cmd.hidden,
                        text       : cmd.text,
                        style      : cmd.style,
                        qtext      : cmd.tooltip.text,
                        qtitle     : cmd.tooltip.title,
                        hideMode   : cmd.hideMode,
                        rightAlign : cmd.rightAlign || false
                    };                  
                    
                    if (this.commandColumn.prepareGroupCommand) {
                        this.commandColumn.prepareGroupCommand(this.grid, command, groupId, group);
                    }

                    if (command.hidden) {
                        var hideMode = command.hideMode || "display";
                        command.hideCls = "x-hide-" + hideMode;
                    }

                    if (command.rightAlign) {
                        command.align = "right-group-imagecommand";
                    } else {
                        command.align = "";
                    }

                    preparedCommands.push(command);
                }
                group.commands = preparedCommands;
            });
            
            view.groupTextTpl = '<div class="group-row-imagecommand-cell">' + view.groupTextTpl + '</div>' + this.groupCommandTemplate;
            view.commandColumn = this;
            view.processEvent  = view.processEvent.createInterceptor(this.interceptMouse, this);
        }
    },
    
    onMouseDown : function (e, t) {
        return this.interceptMouse("mousedown", e);
    },
    
    rmHandleMouseDown : function (g, rowIndex, e) {
        return this.interceptMouse("mousedown", e);
    },
    
    handleMouseDown : function (g, row, cell, e) {
        return this.interceptMouse("mousedown", e);
    },
    
    interceptMouse : function (name, e) {
        if ((name === "mousedown" && e.getTarget(".group-row-imagecommand", this.grid.view.mainBody)) ||
                e.getTarget(".row-imagecommand ", this.grid.view.mainBody)) {
            e.stopEvent();
            return false;
        }
    },

    renderer : function (value, meta, record, row, col, store) {
        meta.css = meta.css || "";
        meta.css += " row-imagecommand-cell";

        if (this.commands) {
            var preparedCommands = [],
                commands = this.commands;
            
            if (this.prepareCommands) {                
                commands = Ext.net.clone(this.commands);
                this.prepareCommands(this.grid, commands, record, row);
            }
            
            var i = 0;
                        
            for (i; i < commands.length; i++) {
                var cmd = commands[i];
                
                cmd.tooltip = cmd.tooltip || {};
                
                var command = {
                    command  : cmd.command,
                    cls      : cmd.cls,
                    iconCls  : cmd.iconCls,
                    hidden   : cmd.hidden,
                    text     : cmd.text,
                    style    : cmd.style,
                    qtext    : cmd.tooltip.text,
                    qtitle   : cmd.tooltip.title,
                    hideMode : cmd.hideMode
                };                
                
                if (this.prepareCommand) {
                    this.prepareCommand(this.grid, command, record, row);
                }

                if (command.hidden) {
                    var hideMode = command.hideMode || "display";
                    command.hideCls = "x-hide-" + hideMode;
                }
                
                if (Ext.isIE6 && Ext.isEmpty(cmd.text, false)) {
                    command.noTextCls = "no-row-imagecommand-text";
                }

                preparedCommands.push(command);
            }
            
            return this.getRowTemplate().apply({ commands : preparedCommands });
        }
        return "";
    },

    commandTemplate :
		'<div class="row-imagecommands">' +
		  '<tpl for="commands">' +
		     '<div cmd="{command}" class="row-imagecommand {cls} {noTextCls} {iconCls} {hideCls}" ' +
		     'style="{style}" ext:qtip="{qtext}" ext:qtitle="{qtitle}">' +
		        '<tpl if="text"><span ext:qtip="{qtext}" ext:qtitle="{qtitle}">{text}</span></tpl>' +
		     '</div>' +
		  '</tpl>' +
		'</div>',

    groupCommandTemplate :
		 '<tpl for="commands">' +
		    '<div cmd="{command}" class="group-row-imagecommand {cls} {iconCls} {hideCls} {align}" ' +
		      'style="{style}" ext:qtip="{qtext}" ext:qtitle="{qtitle}"><span ext:qtip="{qtext}" ext:qtitle="{qtitle}">{text}</span></div>' +
		 '</tpl>',

    getRowTemplate : function () {
        if (Ext.isEmpty(this.rowTemplate)) {
            this.rowTemplate = new Ext.XTemplate(this.commandTemplate);
        }

        return this.rowTemplate;
    },

    onClick : function (e, target) {
        var view = this.grid.getView(), 
            cmd,
            t = e.getTarget(".row-imagecommand");
            
        if (t) {
            cmd = Ext.fly(t).getAttributeNS("", "cmd");
            
            if (Ext.isEmpty(cmd, false)) {
                return;
            }
            
            var row = e.getTarget(".x-grid3-row");
            
            if (row === false) {
                return;
            }
            
            var colIndex = this.grid.view.findCellIndex(target.parentNode.parentNode);
            
            if (colIndex !== this.grid.getColumnModel().getIndexById(this.id)) {
                return;
            }

            this.grid.fireEvent("command", cmd, this.grid.store.getAt(row.rowIndex), row.rowIndex, colIndex);
        }

        t = e.getTarget(".group-row-imagecommand");
        
        if (t) {
            var group = view.findGroup(target),
                groupId = group ? group.id.replace(/ext-gen[0-9]+-gp-/, "") : null;
                
            cmd = Ext.fly(t).getAttributeNS("", "cmd");
            
            if (Ext.isEmpty(cmd, false)) {
                return;
            }

            this.grid.fireEvent("groupcommand", cmd, groupId, this.getRecords(group.id));
        }
    },

    getRecords : function (groupId) {
        if (groupId) {
            groupId = Ext.util.Format.htmlEncode(groupId);
            var records = this.grid.store.queryBy(function (record) {
                    return record._groupId === groupId;
                });
                
            return records ? records.items : [];
        }
        
        return [];
    },
    
    destroy : function () {
        this.grid.getView().mainBody.un("click", this.onClick, this);
        if (this.grid.getView().lockedBody) {
            this.grid.getView().lockedBody.un("click", this.onClick, this);
        }
    }
});