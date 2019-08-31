'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const bd = require('../core/bitflyer/realtime/board');
const ex = require('../core/bitflyer/realtime/execution');

let info;
let info2;
let side = "none";

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
    let order;
    while(true){
        await fxutil.sleep(1000);
        try {
            let diff = 2000;
            let loss_diff = 2000;

            // if order is active and no position
            if (order != undefined){
                let res = await bf.fetchParentOrder(order.parent_order_acceptance_id);
                if (res.parent_order_state === "ACTIVE"){
                    if (Math.abs(res.price - ex.executions.last.price) < 3000 && res.executed_size === 0){
                        continue;
                    };
                    if (res.executed_size === 0){
                        try {
                            await bf.cancelParentOrder(order.parent_order_acceptance_id);
                            console.log("cancel");
                        }catch(error){
                            console.log(error);
                        }
                        order = undefined;
                        continue;
                    };
                    continue;
                };
            }

            if ((info.asks.size - info.bids.size < -20) && (info2.buy - info2.sell) > 20){
                side = "SELL";
                order = await bf.createStopLimitOrder(side, ex.executions.last_sell, -diff, loss_diff, 0.01);
                side = "none";
            };
            if ((info.asks.size - info.bids.size > 20) && (info2.buy - info2.sell) < -20){
                side = "BUY";
                order = await bf.createStopLimitOrder(side, ex.executions.last_buy, diff, -loss_diff, 0.01);
                side = "none";
            };
        } catch(error) {
            side = "none";
            console.log(error);
            // await bf.cancelAllOrder();
        };
    };
};
