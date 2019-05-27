'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer');

let average  = 0;
let difference = 0;
let tk;
let calcAverage = async function() {
    let last_list = [];
    while(true){
        await fxutil.sleep(500);
        tk = bf.ticker(); 
        if (tk === undefined){continue};
        last_list.push(tk.last);
        if (last_list.length > 800){
            last_list.shift();
        };
        let sum = 0;
        for (let i in last_list) {sum += last_list[i]};
        average = sum/last_list.length;
        difference = Math.ceil(tk.last - average);
        console.log('ave: ' + Math.ceil(average) + ' last: ' + tk.last + ' difference: ' + difference);
    };    
}

let doTrade = async function() {
    let pos;
    const TARGET_AMOUNT = 0.05;
    while(true){
        await fxutil.sleep(2000);
        try{
            if (bf.sfd() > 4.5){
                continue;
            };
            pos = await bf.getPositionBySide();
        }catch(error){
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        }
        try {
            if( 200 < difference && pos.buy === 0){
                await bf.cancelAllOrder();
                if (pos.sell >0){
                    await bf.createMarketOrder(pos.sell, 'buy');
                }
                await bf.createLimitOrderPair(tk.bid, TARGET_AMOUNT, 400, -10);
            };
            if(-200 > difference && pos.sell === 0){
                await bf.cancelAllOrder();
                if (pos.buy >0){
                    await bf.createMarketOrder(pos.buy, 'sell');
                };
                await bf.createLimitOrderPair(tk.ask, TARGET_AMOUNT, -10, 400);
            };
        } catch(error) {
            await fxutil.sleep(10000);
            console.log(error);
            continue;
        };
    };
}

exports.doTrade = async () => {
    bf.startTicker(500);
    bf.startSFD(10000);
    doTrade();
    calcAverage();
};
