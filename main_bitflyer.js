'use strict';
const logic = require('./logic/logic_bitflyer_diff');

let ret;
(async () => {
    logic.doTrade();
})();