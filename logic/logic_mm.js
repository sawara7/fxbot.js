'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const ex = require('../core/bitflyer/realtime/execution');

let losscut = async function(result) {
    let ret = false;
    let slope_buy = fxutil.getSlope(ex.executions.buy.price);
    let slope_sell = fxutil.getSlope(ex.executions.sell.price);
    let tk = await bf.getTickerOneshot();
    let value = 0;
    if (result.side === "buy"){
        value = result.price - tk.bid;
        if (value < -1000  || slope_sell > 30 ){
            ret = true;
        };
    }else if (result.side === "sell"){
        value = tk.ask - result.price;
        if (value < -1000  || slope_buy < -30){
            ret = true;
        };
    };
    console.log("value : ", value);
    if (ret === true){
        console.log('=============================losscut================================')
    }
    return ret;
};

let doTrade = async function() {
    while(true){
        try{
            if (bf.sfd() > 4.85){
                continue;
            };
        }catch(error){
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        }
        try {
            let slope_buy = fxutil.getSlope(ex.executions.buy.price) * Math.abs(fxutil.getCorrel(ex.executions.buy.price));
            let slope_sell = fxutil.getSlope(ex.executions.sell.price) * Math.abs(fxutil.getCorrel(ex.executions.sell.price));
            console.log(slope_buy,slope_sell);
            if (slope_buy < -2){
                await bf.createMarketOrder(0.05, 'sell');
            };
            if (slope_sell > 2){
                await bf.createMarketOrder(0.05, 'buy');
            };
            console.log(bf.trade_result);
        } catch(error) {
            console.log(error);
            await fxutil.sleep(1000);
            continue;
        };
        await fxutil.sleep(1000);
    };
};

exports.doTrade = async () => {
    bf.startTicker(10000);
    bf.startSFD(10000);
    ex.startExecutions('fxbtcjpy');
    ex.startTrimData(30,400);
    doTrade();
};
