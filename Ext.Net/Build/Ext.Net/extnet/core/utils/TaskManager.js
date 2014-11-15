
// @source core/utils/TaskManager.js

Ext.net.TaskResponse = { 
    stopTask : -1, 
    stopAjax : -2 
};

Ext.net.TaskManager = function (config) {
    Ext.apply(this, config || {});
    this.initManager.defer(this.autoRunDelay || 50, this);
};

Ext.extend(Ext.net.TaskManager, Ext.util.Observable, {
    tasksConfig: [],
    
    getTasks : function () {
        return this.tasks;
    },

    initManager : function () {
        this.runner = new Ext.util.TaskRunner(this.interval || 10);

        var task,
            i = 0;
                    
        this.tasks = [];

        for (i; i < this.tasksConfig.length; i++) {
            task = this.createTask(this.tasksConfig[i]);
            this.tasks.push(task);
            
            if (task.executing && task.autoRun) {
                this.startTask(task);
            }
        }
    },
    
    addTask : function (taskConfig) {
        var task = this.createTask(taskConfig);
        this.tasks.push(task);
        
        if (task.executing && task.autoRun) {
            this.startTask(task);
        }
    },
    
    removeTask : function (task) {
        task = this.getTask(task);
        if (!Ext.isEmpty(task)) {
            this.stopTask(task);
            this.tasks.remove(task);
        }
    },

    getTask : function (id) {
        if (typeof id === "object") {
            return id;
        } else if (typeof id === "string") {
            var i = 0;

            for (i; this.tasks.length; i++) {
                if (this.tasks[i].id === id) {
                    return this.tasks[i];
                }
            }
        } else if (typeof id === "number") {
            return this.tasks[id];
        }
        return null;
    },

    startTask : function (task) {
        if (this.executing) {
            return;
        }

        task = this.getTask(task);

        if (task.onstart) {
            task.onstart.apply(task.scope || task);
        }

        this.runner.start(task);
    },

    stopTask : function (task) { 
        this.runner.stop(this.getTask(task)); 
    },

    startAll : function () {
        var i = 0;

        for (i; i < this.tasks.length; i++) {
            this.startTask(this.tasks[i]);
        }
    },

    stopAll : function () { 
        this.runner.stopAll(); 
    },

    //private
    createTask : function (config) {
        return Ext.apply({}, config, {
            owner     : this,
            executing : true,
            interval  : 1000,
            autoRun   : true,
            onStop    : function (t) {
                this.executing = false;
                
                if (this.onstop) {
                    this.onstop();
                }
            },
            run : function () {
                if (this.clientRun) {
                    var rt = this.clientRun.apply(arguments);

                    if (rt === Ext.net.TaskResponse.stopAjax) {
                        return;
                    } else if (rt === Ext.net.TaskResponse.stopTask) {
                        return false;
                    }
                }
                
                if (this.serverRun) {
                    var o = this.serverRun();
                    o.control = this.owner;
                    Ext.net.DirectEvent.request(o);
                }
            }
        });
    },
    
    destroy : function () {
        var ns = this.ns || Ext.net.ResourceMgr.ns,
            id = this.itemId || this.proxyId;        
            
        if (ns && id) {                
            if (Ext.isObject(ns) && ns[id]) {
                try {
                    delete ns[id];
                } catch (e) {
                    ns[id] = undefined;
                }
            } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                try {
                    delete Ext.ns(ns)[id];
                } catch (f) {
                    Ext.ns(ns)[id] = undefined;
                }
            }
        } else if (window[this.proxyId]) {
            window[this.proxyId] = null;
        }
        
        this.stopAll();
        delete this.tasks;
        delete this.runner;
    }
});