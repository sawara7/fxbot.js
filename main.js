'use strict';
const logic = require('./logic/logic_average')

let ret;
(async () => {
    await logic.doTrade();
})();