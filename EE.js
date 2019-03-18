const LZUTF8 = require("lzutf8");
const fetch = require("node-fetch");

Date.prototype.addDays = function (days) {
    // https://stackoverflow.com/questions/10849676/date-without-daylight-savings-time
    // Ignore DST.
    var dat = new Date(this.valueOf());
    // dat.setUTCDate(dat.getUTCDate() + days);
    dat.setDate(dat.getDate() + days);
    return dat;
}

class EE {

    // addDate(days) {
    //     // https://stackoverflow.com/questions/10849676/date-without-daylight-savings-time
    //     // Ignore DST.
    //     var dat = new Date(this.valueOf());
    //     // dat.setUTCDate(dat.getUTCDate() + days);
    //     dat.setDate(dat.getDate() + days);
    //     return dat;
    // }

    treatAsUTC(date) {
        var result = new Date(date);
        result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
        return result;
    }

    daysBetween() {
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.round((treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay);
    }

    getSessionId() {
        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var timestamp = Date.now();
        var id = '';
        for (var i = 0; i < 8; ++i) {
            var index = timestamp % CHARS.length;
            id += CHARS[index];
            timestamp = (timestamp - index) / CHARS.length;
        }
        return id.split('').reverse().join('');
    }

    compressStringToBytes(value) {
        return LZUTF8.compress(value);
    }

    decompressStringFromBytes(value) {
        return LZUTF8.decompress(value)
    }

    compress(value) {
        var bytes = compressStringToBytes(value);
        return window.atob(bytes);
    }

    decompress(value) {
        var bytes = window.btoa(value);
        return decompressStringFromBytes(bytes);
    }

    hash(value) {
        const Digest = require('digest-js');
        const dg = new Digest.SHA1();
        var result = dg.Digest(value);
        return window.atob(result);
    }

    joinWithQuote(arr) {
        if (arr.length == 0) {
            return '';
        }
        return '\'' + arr.join('\',\'') + '\'';
    }

    cloneDict(dict) {
        return JSON.parse(JSON.stringify(dict));
    }

    csvToJson(csv) {
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        for (var i = 1; i < lines.length; ++i) {
            var obj = {};
            var currentline = lines[i].split(",");
            for (var j = 0; j < headers.length; ++j) {
                obj[headers[j]] = JSON.parse(currentline[j]);
            }
            result.push(obj);
        }
        return result;
    }

    parseDateRange(request) {
        var dateRange = request.dateRange;
        var startDate = dateRange.startDate;
        var endDate = dateRange.endDate;
        return {
            since: new Date(startDate),
            until: new Date(endDate)
        };
    }

    sendHttp(url, options) {
        // options.muteHttpExceptions = false;
        var response = fetch(url, options);
        return response;
    }

    sendHttpGET(url, options) {
        options.method = 'GET';
        return this.sendHttp(url, options);
    }

    sendHttpPOST(url, options) {
        options.method = 'POST';
        return sendHttp(url, options);
    }

    parseFields(request, fields) {
        var results = [];
        request.fields.forEach(function (field) {
            for (var i = 0; i < fields.length; ++i) {
                if (fields[i] == field.name) {
                    results.push(field.name);
                    break;
                }
            }
        });
        return results;
    }

    parseFieldsInSchema(request, schema) {
        return parseFields(
            request,
            schema.map(function (item) {
                return item.name;
            })
        );
    }

    findSchema(headers, schema) {
        return headers.map(function (header) {
            return schema.find(function (item) {
                return item.name == header;
            });
        });
    }

    formatDate(date) {
        var date = new Date(date);

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var dt = date.getDate();

        if (dt < 10) {
            dt = '0' + dt;
        }
        if (month < 10) {
            month = '0' + month;
        }

        return (year + '-' + month + '-' + dt);
    }

    parseDate(date) {
        var year = date.substring(0, 4);
        var month = date.substring(5, 7);
        var day = date.substring(8, 10);
        return year + month + day;
    }

    convertStringToDate(value) {
        if (value.length === 8) {
            // yyyyMMdd.
        }
        var year = value.substring(0, 4);
        var month = value.substring(4, 6);
        var day = value.substring(6, 8);
        return new Date(year + '-' + month + '-' + day);
    }

    convertData(data, headers) {
        return data.map(function (item) {
            return headers.map(function (header) {
                return item[header];
            });
        });
    }

    convertToRows(data) {
        return data.map(function (item) {
            return {
                values: item
            };
        });
    }

    getRate(currency) {
        if (currency in rates_) {
            return 1.0 / rates_[currency];
        }
        var param = `${currency}_USD`
        var url = [
            `https://free.currencyconverterapi.com/api/v4/convert`,
            `?q=${param}`,
            `&compact=ultra`
        ].join('');
        var data = fetch(url);
        var rate = JSON.parse(data.getContentText())[param];
        rates_[currency] = 1.0 / rate;
        return rate;
    }

    fromCountryIsoCode(code) {

    }

    toCountryIsoCode(name) {

    }
}

// module.exports = {
//     treatAsUTC: function (date) {
//         var result = new Date(date);
//         result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
//         return result;
//     },

//     daysBetween: function (startDate, endDate) {
//         var millisecondsPerDay = 24 * 60 * 60 * 1000;
//         return Math.round((treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay);
//     },

//     BlockCache: function (cache, blockSize) {
//         if (blockSize == undefined) {
//             blockSize = 1024 * 100;
//         }
//         return {
//             put: function (key, value, timeout) {
//                 var index = 0;
//                 var blockKeys = [];
//                 for (var i = 0; i < value.length; i += blockSize) {
//                     var blockKey = `${key}_${index}`;
//                     blockKeys.push(blockKey);
//                     var blockLength = Math.min(blockSize, value.length - i);
//                     var block = value.substr(i, blockLength);
//                     cache.put(blockKey, block, timeout);
//                     ++index;
//                 }
//                 var superBlock = {
//                     blockSize: blockSize,
//                     blockKeys: blockKeys,
//                     valueSize: value.length
//                 };
//                 var superKey = `${key}_info`;
//                 cache.put(superKey, JSON.stringify(superBlock), timeout);
//             },
//             get: function (key) {
//                 var superKey = `${key}_info`;
//                 var cachedSuperBlock = cache.get(superKey);
//                 if (cachedSuperBlock == null) {
//                     return null;
//                 }
//                 var superBlock = JSON.parse(cachedSuperBlock);
//                 var blocks = superBlock.blockKeys.map(function (blockKey) {
//                     return cache.get(blockKey);
//                 });
//                 if (!blocks.every(function (block) {
//                         return block != null;
//                     })) {
//                     return null;
//                 }
//                 return blocks.join('');
//             }
//         };
//     },

//     getSessionId: function () {
//         const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//         var timestamp = Date.now();
//         var id = '';
//         for (var i = 0; i < 8; ++i) {
//             var index = timestamp % CHARS.length;
//             id += CHARS[index];
//             timestamp = (timestamp - index) / CHARS.length;
//         }
//         return id.split('').reverse().join('');
//     },

//     compressStringToBytes: function (value) {
//         return LZUTF8.compress(value);
//     },

//     decompressStringFromBytes: function (value) {
//         return LZUTF8.decompress(value)
//     },

//     compress: function (value) {
//         var bytes = compressStringToBytes(value);
//         return window.atob(bytes);
//     },

//     decompress: function (value) {
//         var bytes = window.btoa(value);
//         return decompressStringFromBytes(bytes);
//     },

//     hash: function (value) {
//         const Digest = require('digest-js');
//         const dg = new Digest.SHA1();
//         var result = dg.Digest(value);
//         return window.atob(result);
//     },

//     joinWithQuote: function (arr) {
//         if (arr.length == 0) {
//             return '';
//         }
//         return '\'' + arr.join('\',\'') + '\'';
//     },

//     cloneDict: function (dict) {
//         return JSON.parse(JSON.stringify(dict));
//     },

//     csvToJson: function (csv) {
//         var lines = csv.split("\n");
//         var result = [];
//         var headers = lines[0].split(",");
//         for (var i = 1; i < lines.length; ++i) {
//             var obj = {};
//             var currentline = lines[i].split(",");
//             for (var j = 0; j < headers.length; ++j) {
//                 obj[headers[j]] = JSON.parse(currentline[j]);
//             }
//             result.push(obj);
//         }
//         return result;
//     },

//     parseDateRange: function (request) {
//         var dateRange = request.dateRange;
//         var startDate = dateRange.startDate;
//         var endDate = dateRange.endDate;
//         return {
//             since: new Date(startDate),
//             until: new Date(endDate)
//         };
//     },

//     sendHttp: function (url, options) {
//         // options.muteHttpExceptions = false;
//         var response = fetch(url, options);
//         return response;
//     },

//     sendHttpGET: function (url, options) {
//         options.method = 'get';
//         return sendHttp(url, options);
//     },

//     sendHttpPOST: function (url, options) {
//         options.method = 'post';
//         return sendHttp(url, options);
//     },

//     parseFields: function (request, fields) {
//         var results = [];
//         request.fields.forEach(function (field) {
//             for (var i = 0; i < fields.length; ++i) {
//                 if (fields[i] == field.name) {
//                     results.push(field.name);
//                     break;
//                 }
//             }
//         });
//         return results;
//     },

//     parseFieldsInSchema: function (request, schema) {
//         return parseFields(
//             request,
//             schema.map(function (item) {
//                 return item.name;
//             })
//         );
//     },

//     findSchema: function (headers, schema) {
//         return headers.map(function (header) {
//             return schema.find(function (item) {
//                 return item.name == header;
//             });
//         });
//     },

//     formatDate: function (date) {
//         return Utilities.formatDate(date, 'GMT', 'yyyy-MM-dd');
//     },

//     parseDate: function (date) {
//         var year = date.substring(0, 4);
//         var month = date.substring(5, 7);
//         var day = date.substring(8, 10);
//         return year + month + day;
//     },

//     convertStringToDate: function (value) {
//         if (value.length === 8) {
//             // yyyyMMdd.
//         }
//         var year = value.substring(0, 4);
//         var month = value.substring(4, 6);
//         var day = value.substring(6, 8);
//         return new Date(year + '-' + month + '-' + day);
//     },

//     createDimension: function (name, label) {
//         return {
//             name: name,
//             label: label,
//             dataType: 'STRING',
//             semantics: {
//                 conceptType: 'DIMENSION'
//             }
//         };
//     },

//     createReaggregatableMetric: function (name, label) {
//         return {
//             name: name,
//             label: label,
//             dataType: 'NUMBER',
//             semantics: {
//                 conceptType: 'METRIC',
//                 isReaggregatable: true
//             }
//         };
//     },

//     createNonReaggregatableMetric: function (name, label) {
//         return {
//             name: name,
//             label: label,
//             dataType: 'NUMBER',
//             semantics: {
//                 conceptType: 'METRIC',
//                 isReaggregatable: false
//             }
//         };
//     },
// }

// "use strict";

// var http = require('http');

// var hostName = '127.0.0.1';
// var port = 3000;
// var server = http.createServer(function (req, res) {
//     res.statusCode = 200;
//     res.setHeader('Content-type', 'text/plan');
//     res.end('Yay Me\n');
// });
// server.listen(port, hostName, function () {
//     console.log("Server running at http:// ".concat(hostName, ":").concat(port, "/"));
// });

var rates_ = {
    "AED": 3.672779,
    "AFN": 68.6405,
    "ALL": 113.870281,
    "AMD": 483.199952,
    "ANG": 1.782151,
    "AOA": 165.9235,
    "ARS": 17.485,
    "AUD": 1.32158,
    "AWG": 1.786833,
    "AZN": 1.6985,
    "BAM": 1.665836,
    "BBD": 2,
    "BDT": 83.71394,
    "BGN": 1.667055,
    "BHD": 0.377546,
    "BIF": 1756.05,
    "BMD": 1,
    "BND": 1.354839,
    "BOB": 6.923968,
    "BRL": 3.2588,
    "BSD": 1,
    "BTC": 0.000122420051,
    "BTN": 64.777708,
    "BWP": 10.49865,
    "BYN": 2.003853,
    "BZD": 2.012549,
    "CAD": 1.277066,
    "CDF": 1574.900794,
    "CHF": 0.990804,
    "CLF": 0.02354,
    "CLP": 636.9,
    "CNH": 6.626488,
    "CNY": 6.6274,
    "COP": 3010.6,
    "CRC": 567.170059,
    "CUC": 1,
    "CUP": 25.5,
    "CVE": 94.2,
    "CZK": 21.7205,
    "DJF": 178.77,
    "DKK": 6.339382,
    "DOP": 47.502313,
    "DZD": 114.9445,
    "EGP": 17.658,
    "ERN": 15.117722,
    "ETB": 27.216738,
    "EUR": 0.851883,
    "FJD": 2.085545,
    "FKP": 0.754589,
    "GBP": 0.754589,
    "GEL": 2.482817,
    "GGP": 0.754589,
    "GHS": 4.612672,
    "GIP": 0.754589,
    "GMD": 47.375,
    "GNF": 9030.65,
    "GTQ": 7.307968,
    "GYD": 207.42497,
    "HKD": 7.811697,
    "HNL": 23.558663,
    "HRK": 6.443012,
    "HTG": 63.582812,
    "HUF": 266.875,
    "IDR": 13521.545353,
    "ILS": 3.516995,
    "IMP": 0.754589,
    "INR": 64.785,
    "IQD": 1166.15,
    "IRR": 34769.5,
    "ISK": 103.68,
    "JEP": 0.754589,
    "JMD": 125.865,
    "JOD": 0.709001,
    "JPY": 112.282,
    "KES": 103.345,
    "KGS": 69.697314,
    "KHR": 4025.1,
    "KMF": 419.369527,
    "KPW": 900,
    "KRW": 1090.83,
    "KWD": 0.302195,
    "KYD": 0.831957,
    "KZT": 330.025,
    "LAK": 8309.9,
    "LBP": 1505.012443,
    "LKR": 153.53,
    "LRD": 124.925,
    "LSL": 14.069405,
    "LYD": 1.368831,
    "MAD": 9.452445,
    "MDL": 17.442964,
    "MGA": 3186.55,
    "MKD": 52.4595,
    "MMK": 1354.35,
    "MNT": 2442.015312,
    "MOP": 8.033902,
    "MRO": 354.44,
    "MUR": 34.05,
    "MVR": 15.299677,
    "MWK": 725.73,
    "MXN": 18.8041,
    "MYR": 4.124478,
    "MZN": 60.926857,
    "NAD": 14.069405,
    "NGN": 359.425,
    "NIO": 30.72692,
    "NOK": 8.2151,
    "NPR": 103.647876,
    "NZD": 1.464441,
    "OMR": 0.384966,
    "PAB": 1,
    "PEN": 3.2365,
    "PGK": 3.207095,
    "PHP": 50.635,
    "PKR": 105.100178,
    "PLN": 3.593721,
    "PYG": 5641.6,
    "QAR": 3.88375,
    "RON": 3.958817,
    "RSD": 101.13,
    "RUB": 59.147,
    "RWF": 836.025,
    "SAR": 3.75,
    "SBD": 7.836397,
    "SCR": 13.415941,
    "SDG": 6.666075,
    "SEK": 8.432683,
    "SGD": 1.354229,
    "SHP": 0.754589,
    "SLL": 7643.944702,
    "SOS": 577.56,
    "SRD": 7.448,
    "SSP": 130.2634,
    "STD": 20902.828205,
    "SVC": 8.73616,
    "SYP": 515.00999,
    "SZL": 14.075088,
    "THB": 32.753,
    "TJS": 8.801472,
    "TMT": 3.509961,
    "TND": 2.495799,
    "TOP": 2.300612,
    "TRY": 3.963122,
    "TTD": 6.752557,
    "TWD": 29.890766,
    "TZS": 2246.75,
    "UAH": 26.482759,
    "UGX": 3627.25,
    "USD": 1,
    "UYU": 29.235494,
    "UZS": 8072.3,
    "VEF": 10.62375,
    "VND": 22725.389844,
    "VUV": 107.21291,
    "WST": 2.548483,
    "XAF": 558.798675,
    "XAG": 0.0589799,
    "XAU": 0.00078134,
    "XCD": 2.70255,
    "XDR": 0.709918,
    "XOF": 558.798675,
    "XPD": 0.00099904,
    "XPF": 101.656693,
    "XPT": 0.00107224,
    "YER": 250.294142,
    "ZAR": 13.9848,
    "ZMW": 10.068823,
    "ZWL": 322.355011
};

var reversedCountryIsoCodeInitializer = (() => {
    var executed = false;
    return function () {
        if (!executed) {
            executed = true;
            for (var key in countryIsoCodes_) {
                reversedCountryIsoCodes_[countryIsoCodes_[key]] = key;
            }
        }
    };
})();

var reversedCountryIsoCodes_ = {
    // Empty.
};

// https://gist.github.com/keeguon/2310008
// Used for BigQuery.
var countryIsoCodes_ = {
    "AF": "Afghanistan",
    "AX": "Åland Islands",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "AndorrA",
    "AO": "Angola",
    "AI": "Anguilla",
    "AQ": "Antarctica",
    "AG": "Antigua and Barbuda",
    "AR": "Argentina",
    "AM": "Armenia",
    "AW": "Aruba",
    "AU": "Australia",
    "AT": "Austria",
    "AZ": "Azerbaijan",
    "BS": "Bahamas",
    "BH": "Bahrain",
    "BD": "Bangladesh",
    "BB": "Barbados",
    "BY": "Belarus",
    "BE": "Belgium",
    "BZ": "Belize",
    "BJ": "Benin",
    "BM": "Bermuda",
    "BT": "Bhutan",
    "BO": "Bolivia",
    "BA": "Bosnia & Herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "BR": "Brazil",
    "IO": "British Indian Ocean Territory",
    "BN": "Brunei Darussalam",
    "BG": "Bulgaria",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "KH": "Cambodia",
    "CM": "Cameroon",
    "CA": "Canada",
    "CV": "Cape Verde",
    "KY": "Cayman Islands",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CL": "Chile",
    "CN": "China",
    "CX": "Christmas Island",
    "CC": "Cocos (Keeling) Islands",
    "CO": "Colombia",
    "KM": "Comoros",
    "CG": "Congo",
    "CD": "Congo, Democratic Republic",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "CI": "Côte d’Ivoire",
    "HR": "Croatia",
    "CU": "Cuba",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DK": "Denmark",
    "DJ": "Djibouti",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "EC": "Ecuador",
    "EG": "Egypt",
    "SV": "El Salvador",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "EE": "Estonia",
    "ET": "Ethiopia",
    "FK": "Falkland Islands (Malvinas)",
    "FO": "Faroe Islands",
    "FJ": "Fiji",
    "FI": "Finland",
    "FR": "France",
    "GF": "French Guiana",
    "PF": "French Polynesia",
    "TF": "French Southern Territories",
    "GA": "Gabon",
    "GM": "Gambia",
    "GE": "Georgia",
    "DE": "Germany",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GR": "Greece",
    "GL": "Greenland",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "GU": "Guam",
    "GT": "Guatemala",
    "GG": "Guernsey",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard Island and Mcdonald Islands",
    "VA": "Holy See (Vatican City State)",
    "HN": "Honduras",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IS": "Iceland",
    "IN": "India",
    "ID": "Indonesia",
    "IR": "Iran",
    "IQ": "Iraq",
    "IE": "Ireland",
    "IM": "Isle of Man",
    "IL": "Israel",
    "IT": "Italy",
    "JM": "Jamaica",
    "JP": "Japan",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KE": "Kenya",
    "KI": "Kiribati",
    "KP": "Korea (North)",
    "KR": "South Korea",
    "XK": "Kosovo",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Laos",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macao",
    "MK": "Macedonia (FYROM)",
    "MG": "Madagascar",
    "MW": "Malawi",
    "MY": "Malaysia",
    "MV": "Maldives",
    "ML": "Mali",
    "MT": "Malta",
    "MH": "Marshall Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "YT": "Mayotte",
    "MX": "Mexico",
    "FM": "Micronesia",
    "MD": "Moldova",
    "MC": "Monaco",
    "MN": "Mongolia",
    "MS": "Montserrat",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "MM": "Myanmar (Burma)",
    "NA": "Namibia",
    "NR": "Nauru",
    "NP": "Nepal",
    "NL": "Netherlands",
    "AN": "Netherlands Antilles",
    "NC": "New Caledonia",
    "NZ": "New Zealand",
    "NI": "Nicaragua",
    "NE": "Niger",
    "NG": "Nigeria",
    "NU": "Niue",
    "NF": "Norfolk Island",
    "MP": "Northern Mariana Islands",
    "NO": "Norway",
    "OM": "Oman",
    "PK": "Pakistan",
    "PW": "Palau",
    "PS": "Palestine",
    "PA": "Panama",
    "PG": "Papua New Guinea",
    "PY": "Paraguay",
    "PE": "Peru",
    "PH": "Philippines",
    "PN": "Pitcairn",
    "PL": "Poland",
    "PT": "Portugal",
    "PR": "Puerto Rico",
    "QA": "Qatar",
    "RE": "Reunion",
    "RO": "Romania",
    "RU": "Russia",
    "RW": "Rwanda",
    "SH": "Saint Helena",
    "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia",
    "PM": "Saint Pierre and Miquelon",
    "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "Sao Tome and Principe",
    "SA": "Saudi Arabia",
    "SN": "Senegal",
    "RS": "Serbia",
    "ME": "Montenegro",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SG": "Singapore",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "ZA": "South Africa",
    "GS": "South Georgia and the South Sandwich Islands",
    "ES": "Spain",
    "LK": "Sri Lanka",
    "SD": "Sudan",
    "SR": "Suriname",
    "SJ": "Svalbard and Jan Mayen",
    "SZ": "Swaziland",
    "SE": "Sweden",
    "CH": "Switzerland",
    "SY": "Syria",
    "TW": "Taiwan",
    "TJ": "Tajikistan",
    "TZ": "Tanzania",
    "TH": "Thailand",
    "TL": "Timor-Leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad and Tobago",
    "TN": "Tunisia",
    "TR": "Turkey",
    "TM": "Turkmenistan",
    "TC": "Turks and Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "UA": "Ukraine",
    "AE": "United Arab Emirates",
    "GB": "United Kingdom",
    "US": "United States",
    "UM": "United States Minor Outlying Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VE": "Venezuela",
    "VN": "Vietnam",
    "VG": "Virgin Islands, British",
    "VI": "Virgin Islands, U.S.",
    "WF": "Wallis and Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe",
    "XW": "Unknown"
};

module.exports = EE;
const abc = `[{
    "application id": "59b7b8e628a1adb375001d11",
    "application name": "Xì tố offline",
    "platform": "iOS",
    "revenue": 0
}, {
    "application id": "590bfcdc8fac7a6466002a51",
    "application name": "Dinosaur Eggs Pop",
    "platform": "android",
    "revenue": 0.98
}, {
    "application id": "55127b655cf85d920d0000bd",
    "application name": "Gold Miner Classic",
    "platform": "android",
    "revenue": 72.52
}, {
    "application id": "5a2a3afad49ac43a0c000245",
    "application name": "Tien Len Dem La",
    "platform": "android",
    "revenue": 0
}, {
    "application id": "5805cebb7b3c04596a000082",
    "application name": "Tien Len Mien Nam",
    "platform": "android",
    "revenue": 0.2
}, {
    "application id": "5808ea176c0f350c36000073",
    "application name": "Tien Len MN",
    "platform": "iOS",
    "revenue": 74.18
}, {
    "application id": "5b7b8570aed6fd057fad0b74",
    "application name": "Gold Miner Classic Lite",
    "platform": "android",
    "revenue": 20.06
}, {
    "application id": "56274c1178def5af4800004f",
    "application name": "Banny Sammy - physics puzzle",
    "platform": "iOS",
    "revenue": 0
}, {
    "application id": "5c0c9c372431471eaefac647",
    "application name": "Gold Miner Vegas: Nostalgic Arcade Game",
    "platform": "android",
    "revenue": 0.15
}, {
    "application id": "5b3c4e8682e08b1c4882b72e",
    "application name": "Tien Len Dem La",
    "platform": "iOS",
    "revenue": 0
}, {
    "application id": "58089c0065aa677c3500000a",
    "application name": "Phom, Ta la",
    "platform": "android",
    "revenue": 0
}, {
    "application id": "5987de6a2981c13069000d67",
    "application name": "Mau binh",
    "platform": "android",
    "revenue": 0
}, {
    "application id": "58089be3aae6296f67000054",
    "application name": "Phom, Ta la",
    "platform": "iOS",
    "revenue": 0
}, {
    "application id": "590bfb6f004ccfdd3b000acd",
    "application name": "Dinosaur Eggs Pop",
    "platform": "iOS",
    "revenue": 3.25
}, {
    "application id": "58abf948a715786a580003ab",
    "application name": "Dino Eggs Pop 2: Rescue Buddy",
    "platform": "iOS",
    "revenue": 1.14
}, {
    "application id": "5512796d6e1a3f7f750000bd",
    "application name": "Gold Miner Classic 2017",
    "platform": "iOS",
    "revenue": 15.97
}, {
    "application id": "58abf8b9ab8875e1710004f7",
    "application name": "Dinosaur Eggs Pop 2: Rescue Buddies",
    "platform": "android",
    "revenue": 0
}, {
    "application id": "59c8e5c2ba6dd77928004d05",
    "application name": "Xì tố Offline",
    "platform": "android",
    "revenue": 25.19
}, {
    "application id": "5987dddd370d4a3669000ed0",
    "application name": "Mậu Binh",
    "platform": "iOS",
    "revenue": 3.13
}, {
    "application id": "58774f0e6f61bcde0a0000ac",
    "application name": "Gold Miner Vegas: Gold Rush",
    "platform": "android",
    "revenue": 9.38
}]`;

// function demoFetch() {
//     let promesa = fetch('https://api.github.com/users/mitocode21');
//     var obj = promesa.then((res) => {
//         return res.json();
//     }).then(json => {
//         return json;
//     });
//     return obj;
// }
// const xyz = demoFetch()