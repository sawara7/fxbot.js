'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer');
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
    ex.startTrimData(600,400);
    setInterval(
        () => {
            let result = [];
            for (let i of [30,60,120,180,240,300]){
                executionsSize = ex.getSize(i);
                result.push(executionsSize.buy>executionsSize.sell);
            }
        ind = 'none';
        let p;
        for (let r of result){
            if (p === undefined){
                p = r;
                if (p){
                    ind = 'up';
                }else{
                    ind = 'down';
                }
            }else if (p!==r){
                ind = 'none';
                break;
            }
        }
        if (ind !== 'none'){
            console.log(ind);
        }
        },500);
    };

let previous_side = 'buy';
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
            if( ind === 'down' && previous_side === 'buy'){
                previous_side = 'sell';
                console.log('sell');
                await bf.createLimitOrderPairAwait(ex.getCandle(10).min, 500, 0.05, 'sell', losscut);
                continue;
            };
            if( ind === 'up' &&  previous_side === 'sell'){
                previous_side = 'buy';
                console.log('buy');
                await bf.createLimitOrderPairAwait(ex.getCandle(10).max, 500, 0.05, 'buy', losscut);
                continue;
            };
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
    await fxutil.sleep(5000);
    doTrade();
};
