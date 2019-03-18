const Combine = require('../Combine');
const IronSource = require('../Model/IronSource')
var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_APPLICATION = 'application';
var DIMENSION_COUNTRY = 'country_iso_code';
var DIMENSION_SOURCE = 'source';
var DIMENSION_REVENUE_TYPE = 'revenue_type';
var METRIC_VIDEO_REQUESTS = 'video_requests';
var METRIC_VIDEO_SUCCESSFUL_REQUESTS = 'video_successful_requests';
var METRIC_VIDEO_VIEWS = 'video_views';
var METRIC_VIDEO_COMPLETES = 'video_completes';
var METRIC_REVENUE = 'revenue';

class IronSourceHelper {
    constructor(helper, apiKey, useCache) {
        this.combine = new Combine();
        this.ironSource = new IronSource();
        this.helper = helper;
        this.apiKey = apiKey;
        this.useCache = useCache;

        this.fieldMap = {};
        this.fieldMap[DIMENSION_DATE] = this.IronSource.DIMENSION_DATE;
        this.fieldMap[DIMENSION_APPLICATION] = this.IronSource.DIMENSION_SOURCE;
        this.fieldMap[DIMENSION_PLATFORM] = this.IronSource.DIMENSION_PLATFORM;
        this.fieldMap[DIMENSION_COUNTRY] = this.IronSource.DIMENSION_COUNTRY;
        this.fieldMap[METRIC_VIDEO_REQUESTS] = this.IronSource.METRIC_AD_REQUESTS;
        this.fieldMap[METRIC_VIDEO_SUCCESSFUL_REQUESTS] = this.IronSource.METRIC_AVAILABLE;
        this.fieldMap[METRIC_VIDEO_VIEWS] = this.IronSource.METRIC_STARTED;
        this.fieldMap[METRIC_VIDEO_COMPLETES] = this.IronSource.METRIC_VIEWS;
        this.fieldMap[METRIC_REVENUE] = this.IronSource.METRIC_REVENUE;
    }

    requestDataInternal(dimensions, metrics, since, until) {
        return this.ironSource.requestHttp(apiKey, androidIds, iosIds, dimensions, metrics, since, until, useCache);
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

    requestData() {
        var data = this.helper.requestData(this, this.requestDataInternal);
        data.forEach(item => {
            item[DIMENSION_SOURCE] = 'ironSource';
            item[DIMENSION_REVENUE_TYPE] = 'Ads';
        });
        return data;
    };
}

module.exports = IronSourceHelper;