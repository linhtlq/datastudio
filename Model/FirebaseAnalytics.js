// const EE = require('../EE');
// const ee = new EE();
// const LOCK_DURATION = 60 * 1000;
// const AsyncLock = require('async-lock');
// var lock = new AsyncLock({
//     timeout: LOCK_DURATION
// });

// var CONFIG_PROJECT_ID = 'PROJECT_ID';
// var DIMENSION_DATE = 'date';
// var DIMENSION_COUNTRY_ISO_CODE = 'countryIsoCode';
// var METRIC_USERS = 'users';

// class FirebaseAnalytics {
//     getSessionId() {
//         return _sessionId;
//     }

//     buildSelectStatement(since, days) {
//         var firstColumnStatements = [
//             'COALESCE('
//         ];
//         for (var i = 0; i < days; ++i) {
//             firstColumnStatements.push(`t${i}.user_country,`);
//         }
//         firstColumnStatements.push("'Unknown') AS user_country");
//         var statements = [
//             firstColumnStatements.join('\n')
//         ];
//         for (var i = 0; i < days; ++i) {
//             var currentDate = since.addDays(i);
//             // Fix DST.
//             currentDate.setHours(currentDate.getHours() + 1);
//             // console.log(Utilities.formatDate(currentDate, 'GMT', 'yyyy-MM-dd HH:mm:ss'));
//             statements.push(`SUM(COALESCE(c${i}, 0)) AS _${ee.parseDate(ee.formatDate(currentDate))}`);
//         }
//         return statements.join(',\n');
//     }

//     buildSelectTable(table, since, days) {
//         // fix me;
//         var statements = [
//             `SELECT`,
//             `user_pseudo_id AS user_id,`,
//             `geo.country AS user_country,`,
//             `event_name AS event_name`,
//             `FROM`,
//             JSON.stringify(`${table}`),
//             `WHERE`,
//             // Utilities.formatString("_TABLE_SUFFIX = '%s'", EE.parseDate(EE.formatDate(since.addDays(days))))
//             `_TABLE_SUFFIX = ${JSON.stringify(EE.parseDate(EE.formatDate(since.addDays(days))))}`
//         ];
//         return statements.join('\n');
//     }

//     buildSelectTableExists(dataset, since, days) {
//         var events = this.buildSelectTable(`${dataset}.events_*`, since, days);
//         var eventsInstraday = this.buildSelectTable(`${dataset}.events_intraday_*`, since, day);

//         return `((${events}) UNION ALL (${eventsInstraday}))`
//     }

//     buildQueryTable(dataset, since, days) {
//         var statements = [
//             `(SELECT`,
//             `user_country,`,
//             `COUNT(DISTINCT user_id) AS c${days}`,
//             `FROM`,
//             this.buildSelectTableExists(dataset, since, days),
//             'WHERE',
//             `event_name = ${JSON.stringify(`user_engagement`)}`,
//             'GROUP BY',
//             `(user_country) AS t${days}`
//         ]
//         return statements.join('\n');
//     }

//     buildStatement(dataset, since, until) {
//         // console.log(Utilities.formatString('buildStatement: dataset = %s since = %s until %s', dataset, EE.formatDate(since), EE.formatDate(until)));
//         var days = EE.daysBetween(since, until) + 1;
//         var statements = [
//             'SELECT',
//             this.buildSelectStatement(since, days),
//             'FROM',
//             this.buildQueryTable(dataset, since, 0)
//         ];
//         for (var i = 1; i < days; ++i) {
//             statements.extend([
//                 `FULL JOIN`,
//                 this.buildQueryTable(dataset, since, i),
//                 `ON`,
//                 `t0.user_country = t${i}.user_country`
//             ]);
//         }
//         statements.extend([
//             'GROUP BY',
//             'user_country',
//             'ORDER BY',
//             'user_country'
//         ]);
//         return statements.join('\n');
//     }

//     findDataset(projectId) {
//         var datasets = BigQuery.Datasets.list(projectId);
//         for (var i = 0; i < datasets['datasets'].length; ++i) {
//             var id = datasets.datasets[i].id;
//             // Dataset format: analytics_{Firebase analytics property ID}
//             if (id.indexOf('analytics') != -1) {
//                 return datasets.datasets[i].datasetReference.datasetId;
//             }
//         }
//         return undefined;
//     }

//     mapQuery(name) {
//         if (name == DIMENSION_COUNTRY) {
//             return 'country';
//         }
//         return name;
//     }

//     mapHeader(name) {
//         if (name == 'countryCode') {
//             return DIMENSION_COUNTRY;
//         }
//         if (name == 'appName') {
//             return DIMENSION_APP;
//         }
//         if (name == 'providerName') {
//             return DIMENSION_AD_SOURCE;
//         }
//         return name;
//     }

//     formatUrl(dimensions, metrics, since, until) {
//         var url = [
//             `https: //platform.ironsrc.com/partners/publisher/mediation/applications/v3/stats`,
//             `?startDate=${ee.formatDate(since)}`,
//             `&endDate=${ee.formatDate(until)}`,
//             `&breakdowns=${dimensions.join(',')}`,
//             `&metrics=${metrics.join(',')}`
//         ].join('')
//         return url;
//     }

//     downloadData(username, secretKey, url) {
//         var encoded = window.btoa(`${username}:${secretKey}`);
//         var options = {
//             headers: {
//                 Authorization: Utilities.formatString('Basic %s', encoded),
//             },
//         };
//         /*
//         var code = result.getResponseCode();
//         if (code == 429) {
//           // Exceeded request limit.
//           return null;
//         }
//         */
//         var result = ee.sendHttpGET(url, options).then(res => {
//             return res.json();
//         }).then(json => {
//             return json;
//         });
//         return result;
//     }

//     retrieveData(key, username, secretKey, url, useCache) {
//         var data = undefined;
//         lock.acquire(key, (done) => {
//             data = downloadData(username, secretKey, url);
//             done();
//         }, (err, ret) => {
//             if (data.length === 0) {
//                 // Somehow returns nothing.
//                 return [];
//             }
//             return JSON.parse(data);
//         })
//     }

//     parseData(data, since, until) {
//         var parsedData = [];
//         if (data) {
//             // May return empty data.    
//             data.forEach(function (item) {
//                 item.data.forEach(function (subItem) {
//                     var parsedItem = {}
//                     Object.keys(item).forEach(function (key) {
//                         if (key != 'data') {
//                             var header = mapHeader(key);
//                             var value = item[key];
//                             if (header == DIMENSION_DATE) {
//                                 value = ee.parseDate(value);
//                             }
//                             parsedItem[header] = value;
//                         }
//                     });
//                     Object.keys(subItem).forEach(function (key) {
//                         var header = mapHeader(key);
//                         parsedItem[header] = subItem[key];
//                     });
//                     parsedData.push(parsedItem);
//                 });
//             });
//         }
//         return parsedData;
//     }

//     buildKey(username, secretKey, dimensions, metrics, since, until) {
//         var params = [];
//         params.push(username);
//         params.push(secretKey);
//         params.extend(dimensions);
//         params.extend(metrics);
//         params.push(EE.formatDate(since));
//         params.push(EE.formatDate(until));
//         return params.join('|');
//     }

//     requestHttp(username, secretKey, dimensions, metrics, since, until, useCache) {
//         var url = formatUrl(dimensions.map(mapQuery), metrics.map(mapQuery), since, until);

//         var key = EE.hash(buildKey(username, secretKey, dimensions, metrics, since, until));
//         var data = this.retrieveData(key, username, secretKey, url, useCache);
//         // console.log(Utilities.formatString('%s: data = %s', getSessionId(), JSON.stringify(data)));

//         var parsedData = this.parseData(data);
//         return parsedData;
//     }
// }