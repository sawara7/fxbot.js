const ccxt = require ('ccxt');
const env = require('./_env');
const utils = require('./utils');

let ticker;
let bf = new ccxt.bitflyer ({
    apiKey: env.apiKey,
    secret: env.secret});

exports.checkOrderStatus = async function(id, symbol, status, timeout, interval){
    let flag = true;
    let time = 0;
    while (flag) {
        time += interval;
        if (timeout !== 0 && time > timeout){
            return 'timeout';
        }
        let result = await bf.fetchOrder(id, symbol, {'product_code': 'FX_BTC_JPY'});
        if (result.status === status){
            console.log('order status is ' + status);
            return result;
        }
        await sleep(interval);
    }
}

exports.change_side = function(side) {
    if (side == 'BUY' || side == 'buy') {
        return 'sell';
    } else if (side == 'SELL' || side == 'sell'){
        return 'buy';
    }
};

exports.closeAllPosition = async function (currency) {
    let res;
    let size = 0;
    let side;
    while(true){
        await sleep(1000);
        res = await bf.private_get_getpositions({'product_code':'FX_BTC_JPY'});
        if (res.length === 0){
            return true;
        };
        for (let i in res) {
            size += res[i].size;
            side = res[i].side;
        };
        if (size < 0.01){
            return true;
        }
        let order = await bf.createOrder("FX_BTC_JPY", 'market', change_side(side), size);
    }    
}

exports.cancelAllOrder = async function () {
    let res;
    while(true){
        res = await bf.fetchOpenOrders('FX_BTC_JPY');
        if (res.length === 0) {
            return true;
        };
        for (let i in res) {
            await bf.cancelOrder(res[i].id, res[i].symbol);
        };
        await sleep(1000);
    }
}

exports.createLimitOrderPair = async function(price, amount, ask_offset, bid_offset) {
    bf.createOrder(
        'BTC/JPY','limit','buy',amount,price - bid_offset,{ "product_code" : "FX_BTC_JPY"}
    );
    bf.createOrder(
        'BTC/JPY','limit','sell',amount,price + ask_offset,{ "product_code" : "FX_BTC_JPY"}
    );
}

exports.getPositionBySide = async function(){
    let res;
    let buy_size = 0;
    let sell_size = 0;
    res = await bf.private_get_getpositions({'product_code':'FX_BTC_JPY'});
    for (let i in res) {
        if (res[i].side === 'BUY'){
            buy_size += res[i].size;
        }else if (res[i].side === 'SELL'){
            sell_size += res[i].size;
        }
    };
    return {'buy':buy_size, 'sell':sell_size};
}

exports.getCurrentOpenOrder = async function() {
    let ret;
    res = await bf.fetchOpenOrders('FX_BTC_JPY');
    let t;
    for (let i in res){
        if (Date.now() - res[i].timestamp > 6000){
            if (ret === undefined){
                console.log('ok');
                ret = res[i];
                continue;
            };
            if (ret.timestamp < res[i].timestamp){
                console.log('ok');
                ret = res[i];
                continue;
            };
        };
    }
    return ret;
}

exports.getOpenOrderLengthBySide = async function() {
    let res = await bf.fetchOpenOrders('FX_BTC_JPY');
    let ret = {'buy':0, 'sell':0};
    for (let i in res){
        if (res[i].side === 'buy'){
            ret.buy++;
        };
        if (res[i].side === 'sell'){
            ret.sell++;
        }; 
    }
    return ret;
}

exports.startTicker = async function(interval) {
    while(true){
        await utils.sleep(interval);
        ticker = await bf.fetch_ticker('BTC/JPY', {"product_code" : "FX_BTC_JPY" });
    }
}

let getTicker = function() {
    return ticker;
}

exports.ticker = getTicker;