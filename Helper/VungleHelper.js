const Combine = require('../Combine');
const Vungle = require('../Model/Vungle');
var DIMENSION_SOURCE = 'source';
var DIMENSION_REVENUE_TYPE = 'revenue_type';

class VungleHelper {
    constructor(helper, apiKey, useCache) {
        this.combine = new Combine();
        this.vungle = new Vungle();
        this.helper = helper;
        this.apiKey = apiKey;
        this.useCache = useCache;

        this.fieldMap = {};
        this.fieldMap[DIMENSION_DATE] = this.vungle.DIMENSION_DATE;
        this.fieldMap[DIMENSION_APPLICATION] = this.vungle.DIMENSION_APPLICATION;
        this.fieldMap[DIMENSION_PLATFORM] = this.vungle.DIMENSION_PLATFORM;
        this.fieldMap[DIMENSION_COUNTRY] = this.vungle.DIMENSION_COUNTRY;
        this.fieldMap[METRIC_VIDEO_VIEWS] = this.vungle.METRIC_VIEWS;
        this.fieldMap[METRIC_VIDEO_COMPLETES] = this.vungle.METRIC_COMPLETES;
        this.fieldMap[METRIC_REVENUE] = this.vungle.METRIC_REVENUE;
    }

    requestDataInternal(dimensions, metrics, since, until) {
        return this.vungle.requestHttp(this.apiKey, dimensions, metrics, since, until, this.useCache);
    }

    getFieldMap() {
        return this.fieldMap;
    };

    getSupportedDimensions(dimensions) {
        return this.combine.getSupportedDimensions(dimensions);
    };

    getSupportedMetrics(metrics) {
        return this.combine.getSupportedMetrics(metrics);
    };

    requestData(useArpdau, gaData) {
        var data = this.helper.requestData(this, this.requestDataInternal);
        data.forEach(function (item) {
            item[DIMENSION_SOURCE] = 'Vungle';
            item[DIMENSION_REVENUE_TYPE] = 'Ads';
        });
        return data;
    };
}

module.exports = VungleHelper;