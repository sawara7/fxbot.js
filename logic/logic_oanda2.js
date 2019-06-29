'use strict';
const fxutil = require('../core/utils');
const oa = require('../core/oanda/api');

let MarketOrderRequest = {
    'instrument': 'USD_JPY',
    'clientExtensions': {
        'id' : 'trailing'
    },
    'units': 1,
};

let TrailingStopOrderRequest = {
    'distance': 0.1,
    'clientID': 'trailing',
    'triggerCondition': 'MID',
};

exports.doTrade = async function() {
    setInterval(
        () => {oa.DoOrderMarket(
            oa.env.accountID_sub4,
            MarketOrderRequest,
        )}, 1000 * 60
    );
    setInterval(
        () => {oa.DoTrailingStopORder(
            oa.env.accountID_sub4,
            'USD_JPY',
            TrailingStopOrderRequest
        )}, 1000 * 30
    );
    while(true){
        await fxutil.sleep(100000);
    };
};
