'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const ex = require('../core/bitflyer/realtime/execution');

let ind = 'none';
let threshold_losscut = 0;
let threshold_close_price = 0;

let losscut = async function(result) {
    let ret = false;
    let tk = await bf.getTickerOneshot();
    let value = 0;
    if (result.side === "buy"){
        value = result.price - tk.bid;
        if (value < -threshold_losscut){
            ret = true;
        };
    }else if (result.side === "sell"){
        value = tk.ask - result.price;
        if (value < -threshold_losscut){
            ret = true;
        };
    };
    console.log("value : ", value);
    if (ret === true){
        console.log('=============================losscut================================')
    }
    return ret;
};

let calcIndicator = function() {
    ex.startExecutions('fxbtcjpy');
    ex.startTrimData(60,400);
    setInterval(
        () => {
            let result = [];
            let inds = {
                "diff_buy" : 0,
                "diff_sell": 0,
                "amount_buy": 0,
                "amount_sell": 0,
                "indbuy" :0,
                "indsell":0
            }
            for (let i of [5, 10, 15]){
                let executionsSize = ex.getSize(i, i-5);
                let candleBuy  = ex.getCandleBuySide(i, i-5);
                let candleSell = ex.getCandleSellSide(i, i-5);
                let condition_amount = executionsSize.buy > executionsSize.sell && executionsSize.buy > 1
                let condition_price_buy  = candleBuy.close - candleBuy.open;
                let condition_price_sell = candleSell.close - candleSell.open;
                if (!isNaN(condition_price_buy)){
                    inds.diff_buy += condition_price_buy;
                };
                if (!isNaN(condition_price_sell)){
                    inds.diff_sell += condition_price_sell;
                }
                inds.amount_buy += executionsSize.buy;
                inds.amount_sell += executionsSize.sell;
            }
            threshold_losscut = ex.getPercentile(99, 60, 0) - ex.getPercentile(1, 60, 0);
            threshold_close_price = ex.getPercentile(60, 60, 0) - ex.getPercentile(40, 60, 0);
            inds.indbuy = Math.ceil(inds.diff_buy / inds.amount_buy);
            inds.indsell = Math.ceil(inds.diff_sell / inds.amount_sell);
            console.log(Math.ceil(inds.diff_buy), Math.ceil(inds.diff_sell), inds.indbuy, inds.indsell, threshold_losscut, threshold_close_price);
        ind = 'none';
        let p;
        if (inds.indbuy > 10 && inds.indsell > 10){
            ind = 'up';
        }
        if (inds.indbuy < -10 && inds.indsell < -10){
            ind = 'down';
        }
        if (ind !== 'none'){
            console.log(ind);
            console.log(bf.trade_result);
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
            if( ind === 'down'){
                previous_side = 'sell';
                console.log('sell');
                let tk = await bf.getTickerOneshot(); 
                await bf.createLimitOrderPairAwait(tk.ask, threshold_close_price, 0.03, 'sell', losscut);
                continue;
            };
            if( ind === 'up'){
                previous_side = 'buy';
                console.log('buy');
                let tk = await bf.getTickerOneshot();
                await bf.createLimitOrderPairAwait(tk.bid, threshold_close_price, 0.03, 'buy', losscut);
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
    await fxutil.sleep(1000 * 30 * 1);
    doTrade();
};
