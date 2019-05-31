'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer');
const pt = require('percentile');

let average  = 0;
let difference = 0;
let tk;
let difference_list = [0,0];
let slope = 0;
let sum_slope = 0;
let st;
let calcAverage = async function() {
    let last_list = [];
    while(true){
        await fxutil.sleep(500);
        tk = bf.ticker(); 
        if (tk === undefined){continue};
        last_list.push(tk.last);
        if (last_list.length > 2000){
            last_list.shift();
        };
        let plist = [];
        for (let j in last_list){plist.push(last_list[j])};
        let md = pt(50, plist);
        difference = tk.last - md;
        st = await fxutil.getSlopeAndCorrel(difference_list, difference, 30);
        console.log(' last: ' + tk.last + ' difference: ' + difference + ' indicator1: ' + st.s * Math.abs(st.c));
    };    
}

let previous_side;
let doTrade = async function() {
    let after_trade = false;
    let pos;
    previous_side = 'none';
    while(true){
        await fxutil.sleep(2500);
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
            if( difference > 500 && (previous_side === 'none' || previous_side == 'sell')){
                await doBuyTrade();
                previous_side = 'buy';
            };
            if(  difference < -500 && (previous_side === 'none' || previous_side == 'buy')){
                await doSellTrade();
                previous_side = 'sell';
            };
        } catch(error) {
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        };
    };
}

let doBuyTrade = async function(){
    await bf.createMarketOrder(0.01, 'buy');
    let max_difference = difference;
    let time_max = Date.now();
    let time_last = Date.now();
    while(time_last - time_max < 30000){
        if (max_difference < difference){
            max_difference = difference;
            time_max = Date.now();
        }
        time_last = Date.now();
        console.log(Math.ceil((time_last - time_max)/1000), max_difference);
        await fxutil.sleep(500);
    };
    await bf.createMarketOrder(0.01, 'sell');
}

let doSellTrade = async function(){
    await bf.createMarketOrder(0.01, 'sell');
    let min_difference = difference;
    let time_min = Date.now();
    let time_last = Date.now();
    while(time_last - time_min < 30000){
        if (min_difference > difference){
            min_difference = difference;
            time_min = Date.now();
        }
        time_last = Date.now();
        console.log(Math.ceil((time_last - time_min)/1000), min_difference);
        await fxutil.sleep(500);
    };
    await bf.createMarketOrder(0.01, 'buy');
};

exports.doTrade = async () => {
    bf.startTicker(500);
    bf.startSFD(10000);
    doTrade();
    calcAverage();
};
