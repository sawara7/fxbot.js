'use strict';
const logic = require('./logic/logic_oanda');

let ret;
(async () => {
    logic.doTrade();
})();