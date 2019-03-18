const Combine = require('../Combine');
class Helper {
    constructor(dimensions, metrics, since, until) {
        this.combine = new Combine();
        this.dimensions = dimensions;
        this.metrics = metrics;
        this.since = since;
        this.until = until;

        var hasArpdau = [
            METRIC_ARPDAU,
            METRIC_ARPDAU_7,
            METRIC_ARPDAU_30
        ].some(function (item) {
            return metrics.includes(item);
        });

        if (hasArpdau) {
            // Need to query revenue metric and date breakdown.
            if (!metrics.includes(METRIC_REVENUE)) {
                metrics.push(METRIC_REVENUE);
            }
            if (!dimensions.includes(DIMENSION_DATE)) {
                dimensions.push(DIMENSION_DATE);
            }
        }
    }
    // Check whether ARPDAU metric is exist

    requestData(helper, callback) {
        var fieldMap = helper.getFieldMap();
        var supportedDimensions = helper.getSupportedDimensions(dimensions);
        var supportedMetrics = helper.getSupportedMetrics(metrics);
        var supportedHeaders = supportedDimensions.concat(supportedMetrics);

        // Checks whether it is queryable by the API.
        var queryable = combine.isQueryable(
            fieldMap,
            supportedDimensions,
            supportedMetrics
        );

        if (!queryable) {
            // Non-queryable, return an empty result.
            console.log("already query");
            return [];
        }

        var mapHeader = (item) => {
            // Map header to component header.
            return fieldMap[item];
        };

        // Get data from component.
        var data = callback(
            supportedDimensions.map(mapHeader),
            supportedMetrics.map(mapHeader),
            since,
            until
        );

        // Get all headers.  
        var convertedData = data.map(item => {
            var dict = {};
            supportedHeaders.forEach((header) => {
                // Convert component values to this values.
                dict[header] = item[mapHeader(header)];
            });
            return dict;
        });
        return convertedData;
    };
}
module.exports = Helper;