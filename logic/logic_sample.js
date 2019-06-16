'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const bd = require('../core/bitflyer/realtime/board');
const ex = require('../core/bitflyer/realtime/execution');

let info;
let info2;

let losscut = function(result) {
    if (result.side === "sell" && info.asks.size > info.bids.size * 1.5 ){
        return true;
    };
    if (result.side === "buy" && info.bids.size > info.asks.size*1.5){
        return true;
    }
};

exports.doTrade = async function() {
    bd.startBoard("fxbtcjpy");
    ex.startExecutions("fxbtcjpy");
    ex.startTrimData(600,400);
    let side = "none";
    setInterval(
        () => {
            info  = bd.getDiff(60000,3000);
            info2 = ex.getSize(10,0);
            console.log(Math.ceil(info.asks.diff), Math.ceil(info.asks.size), Math.ceil(info2.buy), Math.ceil(info.bids.diff), Math.ceil(info.bids.size), Math.ceil(info2.sell), Math.ceil(ex.executions.last_buy),Math.ceil(ex.executions.last_sell));
        }, 500
    );

    while(true){
        await fxutil.sleep(1000);
        try {
            if (info.asks.size * 1.5 < info.bids.size ){
                // await bf.createLimitOrderPairAwait(ex.executions.last_sell-100, 1500, 0.01, "buy",losscut);
                side = "buy";
            };
            if (info.asks.size > info.bids.size * 1.5){
                // await bf.createLimitOrderPairAwait(ex.executions.last_buy + 100, 1500, 0.01, "sell",losscut);
                side = "sell";
            };
        } catch(error) {
            side = "none";
            console.log(error);
        };
    };
};
