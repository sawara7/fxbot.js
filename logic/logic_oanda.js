'use strict';
const fxutil = require('../core/utils');
const oa = require('../core/oanda/api');

exports.doTrade = async function() {
    oa.CancelAllOrder(oa.env.accountID_sub3, 'USD_JPY');

    setInterval(
        () => {
            try{
                oa.GetPricing(
                    oa.env.accountID_sub3,
                    ['USD_JPY']
                    );
            }catch(error){
                console.log(error);
            };
        }, 1000 * 2
    );

    setInterval(
        () => {
            try{
                oa.UpdateOpenOrders(oa.env.accountID_sub3, 'USD_JPY');
            }catch(error){
                console.log(error);
            };
        }, 1000 * 3
    );

    setInterval(
        () => {
            try{
                let p;
                let plist = oa.pricing();
                if (plist == undefined){
                    return;
                };
                for (p of plist){
                    if (p.instrument === 'USD_JPY'){
                        break;
                    };
                };
                let ods = oa.GetOpenOrders();
                if (ods.buy.state === "PENDING"){
                    //cancel
                    if(Number(ods.buy.price) - Number(p.asks[0].price) > 0.005){
                        oa.CancelOrder(oa.env.accountID_sub3, ods.buy.id);
                    };
                };
                if (ods.sell.state === "PENDING"){
                    //cancel
                    if(Number(p.bids[0].price) - Number(ods.sell.price) > 0.005){
                        oa.CancelOrder(oa.env.accountID_sub3, ods.sell.id);
                    };
                };
            }catch(error){
                console.log(error);
            };
        }, 1000 * 3
    );

    setInterval(
        () => {
            try {
                let ods = oa.GetOpenOrders().sell;
                if (ods.state !== "FILLED" && ods.state !== "" && ods.state !== "CANCELLED"){
                    return;
                }
                let price = 0;
                for (let p of oa.pricing()){
                    if (p.instrument === 'USD_JPY'){
                        price = Number(p.bids[0].price)-0.002;
                    };
                };
                let OrderRequest = {
                    'instrument': 'USD_JPY',
                    'units': -1000,
                    'price': (Math.floor(price*1000)/1000).toString(),
                    // 'priceBound' : (Math.floor((price - 0.001)*1000)/1000).toString(),
                    'takeProfitOnFill': {
                        'price': (Math.floor((price - 0.01)*1000)/1000).toString()
                    },
                    'stopLossOnFill': {
                        'price': (Math.floor((price + 0.1)*1000)/1000).toString()
                    }
                };
                oa.DoMarketIfTouchedOrder(
                    oa.env.accountID_sub3,
                    OrderRequest
                );
            }catch(error){
                console.log(error);
            }
        }, 1000 * 10
    );

    setInterval(
        () => {
            try {
                let ods = oa.GetOpenOrders().buy;
                if (ods.state !== "FILLED" && ods.state !== "" && ods.state !== "CANCELLED"){
                    return;
                }
                let price = 0;
                for (let p of oa.pricing()){
                    if (p.instrument === 'USD_JPY'){
                        price = Number(p.asks[0].price) + 0.002;
                    };
                };
                let OrderRequest = {
                    'instrument': 'USD_JPY',
                    'units': 1000,
                    'price': (Math.floor(price*1000)/1000).toString(),
                    // 'priceBound' : (Math.floor((price - 0.001)*1000)/1000).toString(),
                    'takeProfitOnFill': {
                        'price': (Math.floor((price + 0.01)*1000)/1000).toString()
                    },
                    'stopLossOnFill': {
                        'price': (Math.floor((price - 0.1)*1000)/1000).toString()
                    }
                };
                oa.DoMarketIfTouchedOrder(
                    oa.env.accountID_sub3,
                    OrderRequest
                );
            }catch(error){
                console.log(error);
            }
        }, 1000 * 10
    );

    while(true){
        await fxutil.sleep(10000);
    };
};
