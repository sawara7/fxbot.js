'use strict';
const fxutil = require('../core/utils');
const bb = require('../core/bitbank/bitbank');

exports.doTrade = async () => {
    await bb.BuyLimitByLowVolume('btc_jpy', 0.01);
    await fxutil.sleep(10000);
};
