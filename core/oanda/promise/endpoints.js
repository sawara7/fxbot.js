"use strict";
const api = require("./api");
class OandaAPI extends api.Api {
    getPricing(params) {
        const path = '/v3/accounts/'.concat(this.accountID, '/pricing');
        return this.get(path, params);
    }
    getAccount() {
        const path = '/v3/accounts/' + this.accountID;
        return this.get(path);
    }
}
exports.OandaAPI = OandaAPI;
