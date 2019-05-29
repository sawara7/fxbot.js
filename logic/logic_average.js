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
        if (last_list.length > 200){
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
    let after_trade = false;
    let pos;
    let previous_side = 'sell';
    const TARGET_AMOUNT = 0.01;
    while(true){
        await fxutil.sleep(2500);
        try{
            if (bf.sfd() > 4.85){
                continue;
            };
            pos = await bf.getPositionBySide();
        }catch(error){
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        }
        try {
            if( 300 < difference && !after_trade && previous_side === 'sell'){
                await bf.cancelAllOrder();
                if (pos.sell >0){
                    await bf.createMarketOrder(pos.sell, 'buy');
                };
                bf.createLimitOrderPairAwait(tk.ask, 400, TARGET_AMOUNT, 'buy');
                after_trade = true;
                previous_side = bf.change_side(previous_side);
            };
            if( -300 > difference && !after_trade && previous_side === 'buy'){
                await bf.cancelAllOrder();
                if (pos.buy >0){
                    await bf.createMarketOrder(pos.buy, 'sell');
                };
                bf.createLimitOrderPairAwait(tk.bid, 400, TARGET_AMOUNT, 'sell');
                after_trade = true;
                previous_side = bf.change_side(previous_side);
            };
            after_trade = false;
        } catch(error) {
            console.log(error);
            await fxutil.sleep(10000);
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
