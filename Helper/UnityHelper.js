const Combine = require('../Combine');
const UnityAds = require('../Model/UnityAds')
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
//const UnityAds = require('../UnityAds');

class UnityAdsHelper {
    constructor(helper, apiKey, useCache) {
        this.unityAds = new UnityAds();
        this.combine = new Combine();
        this.helper = helper;
        this.apiKey = apiKey;
        this.useCache = useCache;

        this.fieldMap = {};
        this.fieldMap[DIMENSION_DATE] = this.unityAds.DIMENSION_DATE;
        this.fieldMap[DIMENSION_APPLICATION] = this.unityAds.DIMENSION_SOURCE;
        this.fieldMap[DIMENSION_PLATFORM] = this.unityAds.DIMENSION_PLATFORM;
        this.fieldMap[DIMENSION_COUNTRY] = this.unityAds.DIMENSION_COUNTRY;
        this.fieldMap[METRIC_VIDEO_REQUESTS] = this.unityAds.METRIC_AD_REQUESTS;
        this.fieldMap[METRIC_VIDEO_SUCCESSFUL_REQUESTS] = this.unityAds.METRIC_AVAILABLE;
        this.fieldMap[METRIC_VIDEO_VIEWS] = this.unityAds.METRIC_STARTED;
        this.fieldMap[METRIC_VIDEO_COMPLETES] = this.unityAds.METRIC_VIEWS;
        this.fieldMap[METRIC_REVENUE] = this.unityAds.METRIC_REVENUE;
    }

    requestDataInternal(dimensions, metrics, since, until) {
        return this.unityAds.requestHttp(apiKey, androidIds, iosIds, dimensions, metrics, since, until, useCache);
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
        data.forEach(item => {
            item[DIMENSION_SOURCE] = 'Unity Ads';
            item[DIMENSION_REVENUE_TYPE] = 'Ads';
        });
        return data;
    };
}

module.exports = UnityAdsHelper;