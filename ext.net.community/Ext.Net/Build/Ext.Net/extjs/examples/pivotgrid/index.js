/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.onReady(function() {
    var SaleRecord = Ext.data.Record.create([
        {name: 'id',       type: 'int'},
        {name: 'person',   type: 'string'},
        {name: 'product',  type: 'string'},
        {name: 'city',     type: 'string'},
        {name: 'state',    type: 'string'},
        {name: 'month',    type: 'int'},
        {name: 'quarter',  type: 'int'},
        {name: 'year',     type: 'int'},
        {name: 'quantity', type: 'int'},
        {name: 'sales',    type: 'int'}
    ]);
    
    var myStore = new Ext.data.Store({
        url: 'data.json',
        autoLoad: true,
        reader: new Ext.data.JsonReader({
            root: 'rows',
            idProperty: 'id'
        }, SaleRecord)
    });
    
    var pivotGrid = new Ext.grid.PivotGrid({
        store     : myStore,
        aggregator: 'sum',
        measure   : 'sales',
        
        leftAxis: [
            {
                title: 'Product',
                width: 60,
                dataIndex: 'product'
            },
            {
                title: 'City',
                dataIndex: 'city'
            },
            {
                title: 'Salesperson',
                width: 120,
                dataIndex: 'person'
            }
        ],
        
        topAxis: [
            {
                title: 'Year',
                dataIndex: 'year'
            },
            {
                title: 'Quarter',
                width: 60,
                dataIndex: 'quarter'
            }
        ]
    });
    
    var win = new Ext.Window({
        title   : 'Sales by Region',
        height  : 400,
        width   : 1000,
        items   : pivotGrid,
        layout  : 'fit',
        closable: true
    });
    
    win.show();
    
    
    function buildData(count) {
        count = count || 1000;
        
        var products = ['Ladder', 'Spanner', 'Chair', 'Hammer'],
            states   = ['CA', 'NY', 'UK', 'AZ', 'TX'],
            cities   = ['San Francisco', 'Palo Alto', 'London', 'Austin'],
            people   = ['Tommy Maintz', 'Abe Elias', 'Ed Spencer', 'Jamie Avins'],
            records  = [],
            i;
        
        for (i = 0; i < count; i++) {
            records.push({
                id      : i + 1,
                product : products[Math.floor(Math.random() * products.length)],
                city    : cities[Math.floor(Math.random() * cities.length)],
                state   : states[Math.floor(Math.random() * states.length)],
                quantity: Math.floor(Math.random() * 10000),
                sales   : Math.floor(Math.random() * 50),
                month   : Math.ceil(Math.random() * 12),
                quarter : Math.ceil(Math.random() * 4),
                year    : 2010 - Math.floor(Math.random() * 2),
                person  : people[Math.floor(Math.random() * people.length)]
            });
        }
        
        return records;
    };
});
