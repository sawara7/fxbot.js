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

exports.DobitbankAM4Function = async() => {
    setInterval(async () => {await OpenPosition('mona_jpy',0.001)}, 1000*10);
    setInterval(async () => {await ClosePosition('mona_jpy',0.001)}, 1000*5);
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

const ClosePosition = async(pair, amount) => {
    const SURPLUS = 2; //yen
    let tk = await Ticker('mona_jpy');
    let target_loss_id;
    let target_profit_id_list = [];
    let loss = 0;
    let profit = 0;
    let covered_loss = false;
    for (let id in positions){
        let pos = positions[id];
        if (tk.buy - pos.price >= 0){
            continue;
        };
        if (loss < Math.abs(tk.buy - pos.price)){
            target_loss_id = id;
            loss = Math.abs(tk.buy - pos.price);
        }
    };
    if (target_loss_id == undefined){
        console.log('No close');
        return;
    };
    for (let id in positions){
        let pos = positions[id];
        if ((tk.buy - pos.price) * (100 - 0.3)/100 <= 0){
            continue;
        };
        profit += (tk.buy - pos.price) * (100 - 0.3)/100;
        target_profit_id_list.push(id);
        if (profit > loss + SURPLUS){
            covered_loss = true;
            break;
        };
    };
    if (!covered_loss){
        console.log('No close2');
        return
    };
    try{
        await SellMarket(pair, amount * target_profit_id_list.length + 1);
    }catch(error){
        console.log(error);
    };
    delete positions[target_loss_id];
    for (let id of target_profit_id_list){
        delete positions[id];
    };
    console.log('close');
};


const CheckPosition = async(pair, amount) => {
    // console.log(Object(positions.keys()).length);
};