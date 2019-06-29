'use strict';
const logic = require('./logic/logic_bitbank_lowvolume');

let ret;
(async () => {
    logic.doTrade();
})();