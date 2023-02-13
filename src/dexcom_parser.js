var request = require('request');
var qs = require('querystring');
var crypto = require('crypto');
var meta = require('../package.json');


var Defaults = {
    accept: 'application/json',
    contentType: 'application/json',
    agent: [meta.name, meta.version].join('/'),
}


class DexcomParser {
      
    constructor() {
        this.init_opts()
    }

    read_data_from_dexcom(then) {
        do_everything(this.opts, function (err, glucose) {
            console.log('From Dexcom', err, glucose);
            if (glucose && Array.isArray(glucose)) {
                // Translate to Nightscout data.
                var entries = glucose.map(dex_to_entry);
                console.log('Entries', entries);
                then(null, entries)
            } else if (glucose.constructor == Object && 'Code' in glucose) {
                console.log('Server answers with error: ' + glucose['Code'])
            } else {
                console.log('Unknown data fetch error')
            }
        });
    }

    init_opts() {
        var server = "share2.dexcom.com";
        var bridge = readEnv('BRIDGE_SERVER')
        if (bridge && bridge.indexOf(".") > 1) {
            server = bridge;
        }
        else if (bridge && bridge === 'EU') {
            server = "shareous1.dexcom.com";
        }

        var applicationId = "d89443d2-327c-4a6f-89e5-496bbb0317db"
        var authUrl = 'https://' + server + '/ShareWebServices/Services/General/AuthenticatePublisherAccount'
        var loginUrl = 'https://' + server + '/ShareWebServices/Services/General/LoginPublisherAccountById'
        var latestGlucoseUrl = 'https://' + server + '/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues'

        var authConfig = {
            applicationId: applicationId,
            accountName: readEnv('DEXCOM_ACCOUNT_NAME'),
            password: readEnv('DEXCOM_PASSWORD'),
            loginUrl: loginUrl,
            authUrl: authUrl,
            accountId: null,
            sessionId: null,
        };
        var fetchConfig = {
            maxCount: readEnv('FETCH_MAX_COUNT', 1),
            minutes: readEnv('FETCH_MINUTES', 1440),
            latestGlucoseUrl: latestGlucoseUrl,
        };
        this.opts = {
            auth: authConfig,
            fetch: fetchConfig
        };
    }
    
}

function readEnv(varName, defaultValue) {
    //for some reason Azure uses this prefix, maybe there is a good reason
    var value = process.env['CUSTOMCONNSTR_' + varName]
        || process.env['CUSTOMCONNSTR_' + varName.toLowerCase()]
        || process.env['APPSETTING_' + varName]
        || process.env[varName]
        || process.env[varName.toLowerCase()];
    return value || defaultValue;
}

var DIRECTIONS = {
    NONE: 0
    , DoubleUp: 1
    , SingleUp: 2
    , FortyFiveUp: 3
    , Flat: 4
    , FortyFiveDown: 5
    , SingleDown: 6
    , DoubleDown: 7
    , 'NOT COMPUTABLE': 8
    , 'RATE OUT OF RANGE': 9
};

function stringLowerCaseNoSpaces(str) {
    str = str.toLowerCase()
    while(str.indexOf(' ')>-1)
        str = str.replace(' ','');
    return str;
}

function copyObjectWithLowercaseKeys(obj) {
    // return a copy of obj but with each key transformed to lowercase
    // and spaces removed
    return Object.keys(obj).reduce(function (result, key)  {
      var newKey = stringLowerCaseNoSpaces(key);
      result[newKey] = obj[key];
      return result
    }, {});
}
  
var LCDIRECTIONS = copyObjectWithLowercaseKeys(DIRECTIONS);
  
  
function matchTrend(trend) {
    // attempt to match the trend based on
    // a) it is a number
    // b) it matches a key in DIRECTIONS
    // c) it matches a key in LCDIRECTIONS if converted to lowercase and all spaces removed
  
    if (typeof(trend) !== "string")
      return trend;
  
    if (trend in DIRECTIONS)
      return DIRECTIONS[trend];
      
    var lctrend = stringLowerCaseNoSpaces(trend);
  
    if (lctrend in LCDIRECTIONS) return LCDIRECTIONS[lctrend];
    return trend;
}
  
var Trends = (function () {
    var keys = Object.keys(DIRECTIONS);
    var trends = keys.sort(function (a, b) {
        return DIRECTIONS[a] - DIRECTIONS[b];
    });
    return trends;
})();

function directionToTrend(direction) {
    var trend = 8;
    if (direction in DIRECTIONS) {
        trend = DIRECTIONS[direction];
    }
    return trend;
}

function trendToDirection (trend) {
    return Trends[trend] || Trends[0];
}
  
function auth_payload (opts) {
    var body = {
      "password": opts.auth.password
    , "applicationId" : opts.auth.applicationId
    , "accountName": opts.auth.accountName
    };
    return body;
}

function getAccountId(opts, then) {
    if (opts.auth.accountId) {
        console.log("Account ID already stored")
        then(null, { statusCode: 200 }, opts.auth.accountId);

    } else {

        var url = opts.auth.authUrl;
        var body = auth_payload(opts);
        var headers = {
            'User-Agent': Defaults.agent
            , 'Content-Type': Defaults.contentType
            , 'Accept': Defaults.accept
        };
        var req = {
            uri: url, body: body, json: true, headers: headers, method: 'POST'
            , rejectUnauthorized: false
        };
        console.log(req)
        // Asynchronously calls the `then` function when the request's I/O
        // is done.
        return request(req, then);

    }
}

// assemble the POST body for the login endpoint
function login_payload(opts) {
    var body = {
        "password": opts.auth.password
        , "applicationId": opts.auth.applicationId
        , "accountId": opts.auth.accountId
    };
    return body;
}

// Login to Dexcom's server.
function authorize(opts, then) {
    getAccountId(opts, function (err, res, accbody) {
        if (!err && accbody && res && res.statusCode == 200) {
            opts.auth.accountId = accbody;
            console.log("accountId: " + opts.auth.accountId);

            var url = opts.auth.loginUrl;
            var body = login_payload(opts);
            var headers = {
                'User-Agent': Defaults.agent
                , 'Content-Type': Defaults.contentType
                , 'Accept': Defaults.accept
            };
            var req = {
                uri: url, body: body, json: true, headers: headers, method: 'POST'
                , rejectUnauthorized: false
            };
            // Asynchronously calls the `then` function when the request's I/O
            // is done.
            return request(req, then);
        } else {
            var responseStatus = res ? res.statusCode : "response not found";
            console.log("Cannot authorize account: ", err, responseStatus, accbody);
            return process.nextTick(then, err, res, accbody);
        }
    });
}

// Assemble query string for fetching data.
function fetch_query(opts) {
    // ?sessionID=e59c836f-5aeb-4b95-afa2-39cf2769fede&minutes=1440&maxCount=1"
    var q = {
        sessionID: opts.auth.sessionId
        , minutes: opts.fetch.minutes || 1440
        , maxCount: opts.fetch.maxCount || 1
    };
    var url = opts.fetch.latestGlucoseUrl + '?' + qs.stringify(q);
    return url;
}

// Asynchronously fetch data from Dexcom's server.
// Will fetch `minutes` and `maxCount` records.
function fetch(opts, then) {
    var url = fetch_query(opts);
    var body = "";
    var headers = {
        'User-Agent': Defaults.agent
        , 'Content-Type': Defaults.contentType
        , 'Content-Length': 0
        , 'Accept': Defaults.accept
    };

    var req = {
        uri: url, body: body, json: true, headers: headers, method: 'POST'
        , rejectUnauthorized: false
    };
    return request(req, then);
}

// Authenticate and fetch data from Dexcom.
function do_everything(opts, then) {
    console.log("Session ID: " + opts.auth.sessionId)
    authorize(opts, function (err, res, body) {
        if (err) {
            then(err, null)
        } else {
            console.log('Auth response body: ' + JSON.stringify(body))
            opts.auth.sessionId = body;
            fetch(opts, function (err, res, glucose) {
                then(err, glucose);

            });
        }
    });

}
  
  // Map Dexcom's property values to Nightscout's.
function dex_to_entry (d) {
  /*
  [ { DT: '/Date(1426292016000-0700)/',
      ST: '/Date(1426295616000)/',
      Trend: 4,
      Value: 101,
      WT: '/Date(1426292039000)/' } ]
  */
    var regex = /\((.*)\)/;
    var wall = parseInt(d.WT.match(regex)[1]);
    var date = new Date(wall);
    var trend = matchTrend(d.Trend);
    
    var entry = {
      sgv: d.Value
    , date: wall
    , dateString: date.toISOString( )
    , trend: trend
    , direction: trendToDirection(trend)
    , device: 'share2'
    , type: 'sgv'
    };
    return entry;
}

module.exports = DexcomParser