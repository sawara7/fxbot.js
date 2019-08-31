'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const tk = require('../core/bitflyer/realtime/ticker');
const bd = require('../core/bitflyer/realtime/board');
const ex = require('../core/bitflyer/realtime/execution');

let losscut = function(result) {
    return false;
};

let previous_sell_price = 0;
let previous_buy_price = 0;
let parentid1 = undefined;
let parentid2 = undefined;
exports.doTrade = async function() {
    tk.startTicker('fxbtcjpy');
    tk.startTicker('btcjpy');
    bd.startBoard('fxbtcjpy');
    await fxutil.sleep(1000);
    while (true){
        await fxutil.sleep(2000);
        try{
            let pos = await bf.getPositionBySide();
            if (pos.buy === 0 && pos.sell === 0 && Math.abs(tk.ticker.sfdSellPrice - previous_sell_price) > 10 ){
                try {
                    await bf.cancelParentOrder(parentid1.parent_order_acceptance_id);
                }catch(error){
                    console.log(error);
                };
                parentid1 = await bf.createStopLimitOrder('SELL', tk.ticker.sfdSellPrice+2, 1, 0.01);
            };
            previous_sell_price = tk.ticker.sfdSellPrice;
            // let sfd = tk.sfd();
            // console.log(sfd);
            // if (pos.sell === 0 && tk.ticker.sfdSellPrice != previous_sell_price){
            //     await bf.cancelAllOrder();
            //     await bf.createLimitOrder(0.01, 'sell', tk.ticker.sfdSellPrice);
            // };

            // if (pos.sell > 0 && tk.ticker.sfdBuyPrice != previous_buy_price){
            //     await bf.cancelAllOrder();
            //     await bf.createLimitOrder(0.01, 'buy', tk.ticker.sfdBuyPrice);
            // };
            // console.log(ret.asks.size,ret.asks.price,ret.bids.size,ret.bids.price);
            // console.log(tk.sfd());
            // previous_buy_price = tk.ticker.sfdBuyPrice;
            // previous_sell_price = tk.ticker.sfdSellPrice;
            // if(pos.sell < 0.3){
            // previous_price = ret.asks.price;
            // };
            // bd.showAll();

        }catch(error){
            console.log(error);
        }
    };
};
