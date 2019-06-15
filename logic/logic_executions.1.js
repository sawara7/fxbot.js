'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const ex = require('../core/bitflyer/realtime/execution');

let executionsSize;
let ind = 'none';

let losscut = function(result) {
    let ret = false;
    if (result.side === "buy"){
        if (result.price - ex.getCandleBuySide(150).close < -1500){
            ret = true;
        };
    }else if (result.side === "sell"){
        if (ex.getCandleSellSide(150).close - result.price < -1500){
            ret = true;
        };
    };
    return ret;
};

let calcIndicator = function() {
    ex.startExecutions('fxbtcjpy');
    ex.startTrimData(10 * 18, 500);
    let previous = 'none';
    setInterval(
        () => {
            let result = [];
            for (let i = 0;  i < 18;  i++  ){
                executionsSize = ex.getSize((i+1)*10, i*10);
                result.push(Math.ceil((executionsSize.buy - executionsSize.sell)*100)/100);
            }
            console.log(result);
            let ret = {
                'buy' : 0,
                'sell': 0
            };
            for (let i in result){
                if (result[i] > 0){
                    ret.buy += 1;
                }
            };
            for (let i in result){
                if (result[i] < 0){
                    ret.sell += 1;
                };
            };
            if (ret.buy/(result.length) > 0.6){
                ind = 'up';
            }else if (ret.sell/(result.length) > 0.6){
                ind = 'down';
            }else{
                ind = 'none';
            }

            console.log(ind);
        },400);
    };

let previous_side = 'none';
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
            if( ind === 'down' && previous_side === 'none'){
                previous_side = 'sell';
                console.log('sell');
                await bf.createMarketOrder(0.01, 'sell');
                continue;
            };
            if( ind === 'up' && previous_side === 'none'){
                previous_side = 'buy';
                console.log('buy');
                await bf.createMarketOrder(0.01, 'buy');
                continue;
            };
            if (ind === 'none'){
                previous_side = 'none';
                await bf.closeAllPosition();
            }
        } catch(error) {
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        };
        await fxutil.sleep(1000);
    };
};

exports.doTrade = async () => {
    bf.startTicker(10000);
    bf.startSFD(10000);
    calcIndicator();
    await fxutil.sleep(1000 * 60 * 1);
    doTrade();
};
