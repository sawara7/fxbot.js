'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const ex = require('../core/bitflyer/realtime/execution');

let ind = 'none';
let calcIndicator = function() {
    ex.startExecutions('fxbtcjpy');
    ex.startTrimData(300,400);
    setInterval(
        () => {
            let buySizeList = [];
            let sellSizeList = [];
            let candle600 = ex.getCandle(300,0);
            let candle60 = ex.getCandle(30,0);
            for (let i of [15, 30, 60, 120, 180, 240, 300]){
                let executionsSize = ex.getSize(i, i-60);
                buySizeList.push(Math.ceil(executionsSize.buy*100)/100);
                sellSizeList.push(Math.ceil(executionsSize.sell*100)/100);
            }
            console.log(buySizeList,sellSizeList, candle600.max, candle60.max, candle600.min, candle60.min);
        if (buySizeList[1] > sellSizeList[1] && ind==='down'){
            ind = 'none';
            return;
        };
        if (sellSizeList[1] > buySizeList[1] && ind==='up'){
            ind = 'none';
            return;
        };
        if (buySizeList[0]*4 < sellSizeList[0] && candle600.max !== candle60.max && candle600.min !== candle60.min && ind==='none' ){
            ind = 'down';
            return;
        };
        if (sellSizeList[0]*4 < buySizeList[0] && candle600.max !== candle60.max && candle600.min !== candle60.min && ind==='none' ){
            ind = 'up';
            return;
        };
        console.log(ind);
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
            if( ind === 'down' && previous_side === 'none'){
                await bf.createMarketLimitOrder(200, 0.01, 'sell');
                previous_side = 'sell';
                continue;
            };
            if( ind === 'up' && previous_side === 'none'){
                await bf.createMarketLimitOrder(200, 0.01, 'buy');
                previous_side = 'buy';
                continue;
            };
            if( ind === 'none' && previous_side != 'none'){
                await bf.cancelAllOrder();
                await bf.closeAllPosition();
                previous_side = 'none';
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
    await fxutil.sleep(1000 * 60 * 1);
    doTrade();
};
