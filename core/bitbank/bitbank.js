const bitbank = require('node-bitbankcc');
const env = require('../../_env');
const util = require('../utils')

const conf_public = {
    'endPoint': env.URL_BB_PUBLIC,    // required
    'keepAlive': false,               // optional, default false
    'timeout': 3000,                  // optional, default 3000
};

const conf_private = {
    'endPoint': env.URL_BB_PRIVATE,  	// required
    'apiKey': env.ACCOUNT_BB,		    // required
    'apiSecret': env.APIKEY_BB,		// required
    'keepAlive': false,				// optional, default->false
    'timeout': 3000					// optional, default->3000
};

const publicApi =new bitbank.PublicApi(conf_public);
const privateApi = new bitbank.PrivateApi(conf_private);

const Ticker = async (pair) => { 
    const params = {'pair': pair};
    const res = await publicApi.getTicker(params);
    console.log(res.data);
    return res.data;
};

const BuyMarket = async (pair, amount) => {
    const params = {
        'pair': pair,
        'amount': amount,
        'side': 'buy',
        'type': 'market'
    };
    const result = await privateApi.postOrder(params);
    return result;
};

const SellMarket = async (pair, amount) => {
    const params = {
        'pair': pair,
        'amount': amount,
        'side': 'sell',
        'type': 'market'
    };
    const result = await privateApi.postOrder(params);
    return result;
};

const CheckOrderStatus = async (pair, id) => {
    const params = {
        'pair' : pair,
        'order_id': id
    };
    const result = await privateApi.getOrder(params);
    return result;
};

let positions = {};

exports.doTrade = async() => {
    setInterval(async () => {await OpenLimitPosition('mona_jpy',1)}, 1000*30);
    setInterval(async () => {await ClosePosition('mona_jpy',1)}, 1000*10);
}

const OpenPosition = async(pair, amount) => {
    let order_res = await BuyMarket(pair, amount);
    let status_res = order_res;
    if (order_res.success === 1){
        while (status_res.data.status === 'UNFILLED'){
            status_res = await CheckOrderStatus(pair, order_res.data.order_id);
            await util.sleep(1000);
        };
    };
    if (status_res.success === 1){
        positions[status_res.data.order_id] = {'price':status_res.data.average_price, 'amount':status_res.data.executed_amount};
    };
    console.log(positions);
};

let IsTrading = false;
const BuyLimitByLowVolume = async() => {
    setInterval( async()=> {
        try{
            let now = new Date();
            let params = {
                'pair'      : 'mona_jpy',
                'candleType': '5min',
                'yyyymmdd'  : now.getFullYear()+( "0"+( now.getMonth()+1 ) ).slice(-2)+( "0"+now.getUTCDate() ).slice(-2)
            };
            let candles = await publicApi.getCandlestick(params);
            let candle = candles.data.candlestick[0].ohlcv[candles.data.candlestick[0].ohlcv.length - 2];
            console.log(candle[4]);
            if (candle[4] >= 1000){return};
            if (IsTrading){return};
            IsTrading = true;
            let res = await OpenLimitPosition('mona_jpy', 200);
            if (res){
                res = await CloseLimitPosition('mona_jpy', 2, 200);
            }
            IsTrading = false;
        }catch(error){
            console.log(error);
            IsTrading = false;
        };
    }, 1000 * 5);
};
exports.BuyLimitByLowVolume = BuyLimitByLowVolume;

const OpenLimitPosition = async(pair, amount) => {
    let order_res;
    try{
        let res = await publicApi.getTicker({'pair': pair});
        const params = {
            'pair': pair,
            'amount': amount,
            'price': res.data["buy"],
            'side': "buy",
            'type': 'limit'
        };
        order_res = await privateApi.postOrder(params);
        await util.sleep(1000 * 60 * 5);
        order_res = await CheckOrderStatus(pair, order_res.data.order_id);
        if (order_res.success === 1 && order_res.data.status === 'FULLY_FILLED'){
            return true;
        }else{
            privateApi.cancelOrder({'order_id':order_res.data.order_id, 'pair':pair})
            return false;
        };
        console.log(positions);
    }catch(error){
        console.log(error);
        privateApi.cancelOrder({'order_id':order_res.data.order_id, 'pair':pair});
    };
};

const CloseLimitPosition = async(pair, surplus, amount) => {
    let order_res;
    try{
        let res = await publicApi.getTicker({'pair': pair});
        const params = {
            'pair': pair,
            'amount': amount,
            'price': Number(res.data["sell"]) + Number(surplus),
            'side': "sell",
            'type': 'limit'
        };
        const params2 = {
            'pair': pair,
            'amount': amount,
            'side': "sell",
            'type': 'market'
        };
        order_res = await privateApi.postOrder(params);
        await util.sleep(1000 * 60 * 60 * 2);
        order_res = await CheckOrderStatus(pair, order_res.data.order_id);
        if (order_res.success === 1 && order_res.data.status === 'FULLY_FILLED'){
            return true;
        }else{
            await privateApi.cancelOrder({'order_id':order_res.data.order_id, 'pair':pair});
            await privateApi.postOrder(params2);
            return false;
        };
    }catch(error){
        console.log(error);
    };
};

const ClosePosition = async(pair, amount) => {
    const SURPLUS = 5; //yen
    let tk = await Ticker('mona_jpy');
    let target_loss_id;
    let target_profit_id_list = [];
    let loss = 0;
    let profit = 0;
    let covered_loss = false;
    for (let id in positions){
        target_loss_id = id;
        loss = CalcProfit("buy", positions[id].price, 'limit', tk.buy, 'market', amount);
        break;
    };
    for (let id in positions){
        let pos = positions[id];
        if ((tk.buy - pos.price)*pos.amount>= 0){
            continue;
        };
        if (loss > CalcProfit("buy", pos.price, 'limit', tk.buy, 'market', amount)){
            target_loss_id = id;
            loss = CalcProfit("buy", pos.price, 'limit', tk.buy, 'market', amount);
        };
    };
    if (target_loss_id == undefined){
        console.log('No close');
        return;
    };
    for (let id in positions){
        if (id === target_loss_id){
            continue;
        }
        let pos = positions[id];
        let one_profit = CalcProfit("buy", pos.price, 'limit', tk.buy, 'market', amount);
        if (one_profit <= 0.5 * amount){
            continue;
        };
        profit += one_profit;
        target_profit_id_list.push(id);
        if (profit > loss + SURPLUS * amount){
            covered_loss = true;
            break;
        };
    };
    if (!covered_loss){
        console.log('No close2');
        return
    };
    try{
        await SellMarket(pair, amount * (target_profit_id_list.length + 1));
        delete positions[target_loss_id];
        for (let id of target_profit_id_list){
            delete positions[id];
        };
    }catch(error){
        console.log(error);
    };
    console.log('close');
};

let CalcProfit = (side, open_price, open_type, close_price, close_type, amount) => {
    let upper = 0;
    let lower = 0;
    if (side === "buy"){
        upper = close_price;
        lower = open_price;
    }else if(side === "sell"){
        upper = open_price;
        lower = close_price;
    };
    let profit = (upper - lower) * amount;

    
    let fee = {
        "open": {
            "price":open_price,
            "type":open_type,
            "fee":0
        },"close":{
            "price":close_price,
            "type":close_type,
            "fee":0
        }
    };
    for(s of ["open", "close"]){
        if (fee[s].type === 'market'){
            fee[s].fee = -fee[s].price * amount * (0.15/100);
        }else if (fee[s].type === 'limit'){
            fee[s].fee = fee[s].price * amount * (0.05/100);
        };
    };
    console.log(profit, fee["open"].fee, fee["close"].fee);
    return profit + fee["open"].fee + fee["close"].fee;
};


const CheckPosition = async(pair, amount) => {
    // console.log(Object(positions.keys()).length);
};

exports.StartLimitOrder = async(pair, amount, interval, side) =>{
    let previous_price = 0;
    setInterval(
        async () => {
            try{
                const res = await publicApi.getTicker({'pair': pair});
                if (res.data[side] === previous_price){
                    return;
                };
                const params = {
                    'pair': pair,
                    'amount': amount,
                    'price': res.data[side],
                    'side': side,
                    'type': 'limit'
                };
                let ret = await privateApi.postOrder(params);
                previous_price = res.data[side];
            }catch(error){
                console.log(error);
                if (error.message === "60011"){
                    let ids = [];
                    let ods = await privateApi.getActiveOrders({'pair': pair});
                    for (od of ods.data.orders){
                        ids.push(od.order_id);
                    };
                    await privateApi.cancelOrders(
                        {
                            'order_ids':ids,
                            'pair': pair});
                };
            }
        }, interval);
};