'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const tk = require('../core/bitflyer/realtime/ticker');
const bd = require('../core/bitflyer/realtime/board');
const ex = require('../core/bitflyer/realtime/execution');

let orders = {
    "1": {
        "BUY": undefined,
        "SELL": undefined
    }
    // "2": {
    //     "BUY": undefined,
    //     "SELL": undefined
    // }
};

let GetParam = () =>{
    let ticker = tk.ticker["FX_BTC_JPY"];
    let mid = Math.ceil(Number(ticker.best_bid) + (Number(ticker.best_ask) - Number(ticker.best_bid)/2));
    return {
        "SELL":{
            "price": mid,
            "diff1": -1,
            // "diff2": 100
        },
        // "BUY":{
            // "price": Number(ticker.best_bid),
            // "diff1": -1,
            // "diff2": -100
        // }
    }
};

exports.doTrade = async function() {
    tk.startTicker('fxbtcjpy');
    while(true){
        try {
            for (let lot in orders){            
                for (let s of ["SELL"]){
                    await fxutil.sleep(1000 * 5);

                    // Check Order State
                    if (orders[lot][s] != undefined ){
                        let ticker = tk.ticker["FX_BTC_JPY"];
                        let res = await bf.fetchParentOrder(orders[lot][s].parent_order_acceptance_id);
                        
                        // if order is active and no position
                        if (res.parent_order_state === "ACTIVE"){
                            if (Math.abs(res.price - ticker.ltp) < 1500 && res.executed_size === 0){
                                continue;
                            };
                            if (res.executed_size == 0){
                                try {
                                    await bf.cancelParentOrder(orders[lot][s].parent_order_acceptance_id);
                                }catch(error){
                                    console.log(error);
                                }
                                orders[lot][s] = undefined;
                                continue;
                            };
                            // if (Math.abs(res.price - ticker.ltp) > 2000 && res.executed_size >= 0.01){
                            //     await bf.cancelParentOrder(orders[lot][s].parent_order_acceptance_id);
                            //     await bf.createMarketOrder2(res.size - res.executed_size,  bf.change_side(s));
                            //     orders[lot][s] = undefined;
                            //     console.log("test")
                            //     continue;
                            // };
                            continue;
                        };

                        // if order is rejected
                        if (res.parent_order_state === "REJECTED"){
                            if (Number(res.executed_size) === 0.01){
                                try{
                                    await bf.createMarketOrder2(0.01,  bf.change_side(s));
                                }catch(error){
                                    console.log(error);
                                }
                            };
                            orders[lot][s] = undefined;
                            continue;
                        };
                    };

                    // Execute new Order
                    let param = GetParam();
                    try{
                        orders[lot][s] = await bf.createStopLimitOrder(s, param[s].price, param[s].diff1, param[s].diff2, 0.01);
                    }catch(error){
                        orders[lot][s] = undefined;
                        console.log(error);
                    };
                };
            };
        } catch(error) {
            console.log(error);
        };
    };
};
