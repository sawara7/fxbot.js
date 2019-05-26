'use strict';
const ccxt = require ('ccxt');
const ss = require('simple-statistics');
const fxutil = require('./utils');
const bf = require('./bitflyer');

let doTrade = async function() {
    let price;
    while(true){
        await fxutil.sleep(10000);
        let tk = bf.ticker(); 
        if ( tk === undefined){
            continue;
        };
        try {
            let pos = await bf.getPositionBySide();
            let od = await bf.getCurrentOpenOrder();
            let l  = await bf.getOpenOrderLengthBySide();
            if (od === undefined){
                // await bf.createLimitOrderPair(tk.ask, 0.01, 110, -10);
            } else if(od.side === 'sell' && pos.buy <= 0.01){
                await bf.createLimitOrderPair(tk.bid, 0.01, -10, 110);
            } else if(od.side === 'buy' && pos.sell <= 0.01){
                await bf.createLimitOrderPair(tk.ask, 0.01, 110, -10);
            } else {
                // await bf.createLimitOrderPair(tk.ask, 0.01, 110, -10);
            };
            console.log(pos, od.side);
        } catch(error) {
            console.log(error);
        };
    };
}

let ret;
(async () => {
    bf.startTicker(500);
    doTrade();
})();