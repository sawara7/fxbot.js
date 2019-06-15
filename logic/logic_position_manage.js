'use strict';
const fxutil = require('../core/utils');
const bb = require('../core/bitbank/bitbank');

let doTrade = async function() {
    while(true){
        try {
            await bb.doTrade();
            return true;
        } catch(error) {
            console.log(error);
            await fxutil.sleep(1000);
            continue;
        };
        await fxutil.sleep(1000);
    };
};

exports.doTrade = async () => {
    doTrade();
};
