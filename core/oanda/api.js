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

const DoOrderMarket = async (id, orderRequest)=>{
    ct.order.market(
        id,
        {
            'instrument': orderRequest.instrument,
            'units': orderRequest.units
        },
        (response) => {
            console.log(response.body)
        }
    )
    return 'ok';
};
exports.DoOrderMarket = DoOrderMarket;

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
