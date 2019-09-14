'use strict';
const env = require('./_env');
const oanda = require('./core/oanda/promise/endpoints');

const conf = {
    'endPoint':     env.uri,
    'accountID':    env.accountID_main, // required
    'token':        env.apiToken,		// required
    'keepAlive':    true,				// optional, default->false
    'timeout':      3000				// optional, default->3000
};

let api = new oanda.OandaAPI(conf);

(async () => {
    let res = await api.getPricing(
        {"instruments":"USD_JPY"}
    );
    console.log(res);
    res = await api.getAccount();
    console.log(res.account.balance);
})();