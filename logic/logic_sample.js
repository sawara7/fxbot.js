'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const bd = require('../core/bitflyer/realtime/board');
const ex = require('../core/bitflyer/realtime/execution');

let info;
let info2;
let side = "none";

let losscut = function(result) {
    if ((info.asks.size - info.bids.size > 20) && (info2.buy - info2.sell < -20) && side === "buy"){
        return true;
    };
    if ((info.asks.size - info.bids.size < -20) && (info2.buy - info2.sell > 20) && side === "sell"){
        return true;
    };
};

exports.doTrade = async function() {
    bd.startBoard("fxbtcjpy");
    ex.startExecutions("fxbtcjpy");
    ex.startTrimData(600,400);
    setInterval(
        () => {
            info  = bd.getDiff(60000,3000);
            info2 = ex.getSize(10,0);
            console.log(Math.ceil(info.asks.size - info.bids.size), Math.ceil(info2.buy - info2.sell), Math.ceil(info2.buy));
        }, 500
    );

    while(true){
        await fxutil.sleep(1000);
        try {
            if ((info.asks.size - info.bids.size > 25) && (info2.buy - info2.sell < -25) ){
                side = "sell";
                await bf.createLimitOrderPairAwait(ex.executions.last_sell-100, 1000, 0.04, "sell",losscut);
                side = "none";
            };
            if ((info.asks.size - info.bids.size < -25) && (info2.buy - info2.sell > 25) ){
                side = "buy";
                await bf.createLimitOrderPairAwait(ex.executions.last_buy + 100, 1000, 0.04, "buy",losscut);
                side = "none";
            };
        } catch(error) {
            side = "none";
            console.log(error);
        };
    };
};
