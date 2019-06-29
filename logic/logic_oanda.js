'use strict';
const fxutil = require('../core/utils');
const oa = require('../core/oanda/api');

exports.doTrade = async function() {
    oa.StartTrade();
};
