const env = require('../../_env');
const oanda = require("@oanda/v20/context");
const ct = new oanda.Context(env.uri, 443, true, '');
exports.env = env;
ct.setToken(env.apiToken);

const TARGET_INSTRUMENT1 = 'ZAR_JPY';
const TARGET_UNIT1 = 20;
const TARGET_INSTRUMENT2 = 'USD_JPY';
const TARGET_UNIT2 = 20;
const MAX_TRADE_COUNT = 500;
const TARGET_ID = env.accountID_sub3;

const ORDER_REQUEST_1 = {
    'instrument': TARGET_INSTRUMENT1,
    'units': TARGET_UNIT1
};

const ORDER_REQUEST_2 = {
    'instrument': TARGET_INSTRUMENT2,
    'units': TARGET_UNIT2
};

let pricing;
exports.pricing = () =>{
    return pricing;
};

const CancelAllOrder = async(id, pair) => {
    ct.order.list(
        id,
        pair,
        (response) => {
            console.log(response.body);
            for (o of response.body.orders){
                ct.order.cancel(id, o.id, ()=>{});
            };
        });
};
exports.CancelAllOrder = CancelAllOrder;

const CancelOrder = async(id, orderid) => {
    ct.order.cancel(id, orderid, ()=>{});
};
exports.CancelOrder = CancelOrder;

let openOrders = {
    "buy":{
        "id":0,
        "state":"",
        "price":0,
        "time":0
    },
    "sell":{
        "id":0,
        "state":"",
        "price":0,
        "time":0
    }
}

exports.GetOpenOrders = () => {
    return openOrders;
};

exports.UpdateOpenOrders = (id,pair) =>{
    ct.order.get(
        id,
        openOrders.buy.id,
        (response) => {
            if ("order" in response.body){
                openOrders.buy.state = response.body.order.state;
                openOrders.buy.price = response.body.order.price;
                openOrders.buy.time  = response.body.order.createTime;
            };
        });
    ct.order.get(
        id,
        openOrders.sell.id,
        (response) => {
            if ("order" in response.body){
                openOrders.sell.state = response.body.order.state;
                openOrders.sell.price = response.body.order.price;
                openOrders.sell.time  = response.body.order.createTime;
            };
        });
    
};

// const CancelAllOrder = async(id, pair) => {
//     ct.order.list(
//         id,
//         pair,
//         (response) => {
//             console.log(response.body);
//             for (o of response.body.orders){
//                 ct.order.cancel(id, o.id, ()=>{});
//             };
//         });
// };
// exports.CancelAllOrder = CancelAllOrder;

const DoLimitOrder = async (id, orderRequest)=>{
    ct.order.limit(
        id,
        {
            'instrument': orderRequest.instrument,
            'units': orderRequest.units,
            'price': orderRequest.price,
            'takeProfitOnFill': orderRequest.takeProfitOnFill,
            'stopLossOnFill': orderRequest.stopLossOnFill
        },
        (response) => {
            console.log(response.body)
        }
    )
    return 'ok';
};
exports.DoLimitOrder = DoLimitOrder;

const DoStopOrder = async (id, orderRequest)=>{
    ct.order.stop(
        id,
        {
            'instrument': orderRequest.instrument,
            'units': orderRequest.units,
            'price': orderRequest.price,
            'priceBound': orderRequest.priceBound,
            'takeProfitOnFill': orderRequest.takeProfitOnFill,
            'stopLossOnFill': orderRequest.stopLossOnFill
        },
        (response) => {
            console.log(response.body)
        }
    )
    return 'ok';
};
exports.DoStopOrder = DoStopOrder;

const DoMarketIfTouchedOrder = async (id, orderRequest)=>{
    ct.order.marketIfTouched(
        id,
        {
            'instrument': orderRequest.instrument,
            'units': orderRequest.units,
            'price': orderRequest.price,
            'priceBound': orderRequest.priceBound,
            'takeProfitOnFill': orderRequest.takeProfitOnFill,
            'stopLossOnFill': orderRequest.stopLossOnFill
        },
        (response) => {
            if (response.statusCode === "201"){
                if (orderRequest.units < 0){
                    openOrders.sell.id = response.body.orderCreateTransaction.id;
                }else{
                    openOrders.buy.id = response.body.orderCreateTransaction.id;
                };
            };
        }
    )
    return 'ok';
};
exports.DoMarketIfTouchedOrder = DoMarketIfTouchedOrder;

const GetPricing = async(id, instruments) =>{
    ct.pricing.get(
        id,
        {
            'instruments' : instruments
        },
        (response) => {
            pricing = response.body.prices;
        }
    )
};
exports.GetPricing = GetPricing;

const DoTrailingStopOrder = async (id, pair, TrailingStopLossOrderRequest)=>{
    try {
        ct.trade.list(
            id,
            pair,
            (response) => {
                console.log(response.body);
                if (response.body.trades.length === 0){
                    return;
                };
                ct.order.trailingStopLoss(
                    id,
                    {
                        'tradeID': response.body.trades[0].id,
                        'distance': TrailingStopLossOrderRequest.distance,
                        'triggerCondition': TrailingStopLossOrderRequest.triggerCondition
                    },
                    (response) => {
                        console.log(response.body)
                    }
                );
            });
    }catch(error){
        console.log(error);
    }
};
exports.DoTrailingStopORder = DoTrailingStopOrder;

let trade_counts = 0;
let StartTrade = async () => {
    setInterval( () => {
        try{
        ct.trade.list(
            TARGET_ID,
            ORDER_REQUEST_2,
            DoTradesLoop);
        }catch(error){
            console.log(error);
        }
    }, 1000 * 60 * 1);

    setInterval( () => {
        try{
            if (trade_counts < 500){
                DoOrderMarket(TARGET_ID, ORDER_REQUEST_2);
            };
        }catch(error){
            console.log(error);
        }
    }, 1000 * 60 * 10);
};
exports.StartTrade = StartTrade;

let DoTradesLoop = async (trades) => {
    trade_counts = trades.body.trades.length;
    let minus_pl = 0;
    for (let t of trades.body.trades) {
        minus_id = t.id;
        minus_pl = t.unrealizedPL;
        break;
    };
    for (let t of trades.body.trades) {
        if (minus_pl > t.unrealizedPL){
            minus_pl = t.unrealizedPL;
            minus_id = t.id;
        };
    };
    let ids = [];
    ids.push(minus_id);
    let plus_pl = 0;
    for (let t of trades.body.trades) {
        if (t.unrealizedPL > 1){
            ids.push(t.id);
            plus_pl += t.unrealizedPL;
        };
        if (minus_pl + plus_pl > 1){
            break;  
        };
    };

    if (minus_pl + plus_pl < 0){
        return;  
    };

    for (let id of ids){
        ct.trade.close(
            TARGET_ID,
            id,
            {},
            (response) => {
                // Do Nothing
            });
    };
};
exports.DoTradesLoop = DoTradesLoop;
