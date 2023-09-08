/*********************************************
 * MediaServer - API Manager                 *
 * Copyright: UbiCast, all rights reserved   *
 * Author: Stephane Schoorens                *
 *********************************************/
/* global jsu */

function MSAPIClient (options) {
    // params
    this.baseUrl = '';
    this.useProxy = false;
    this.extraData = null;
    // vars
    this.defaultsErrorsMessages = {
        401: jsu.translate('You are not logged in or your session has expired. Please login and retry.'),
        403: jsu.translate('Access denied.'),
        404: jsu.translate('Item not found.'),
        500: jsu.translate('An internal server error occurred. An email has been sent to the support team.'),
        timeout: jsu.translate('The connection timed out. Please retry later.'),
        unreachable: jsu.translate('The server cannot be reached.')
    };
    this.calls = {
        ping: {
            method: 'GET',
            url: '/api/v2/'
        },
        search: {
            method: 'GET',
            url: '/api/v2/search/',
            errors: {
                403: jsu.translate('Unable to get search\'s results content because you cannot access to this channel.'),
                404: jsu.translate('Requested channel does not exist.')
            }
        },
        getLatestContent: {
            method: 'GET',
            url: '/api/v2/latest/'
        },
        getChannelsList: {
            method: 'GET',
            url: '/api/v2/channels/'
        },
        getChannelsContent: {
            method: 'GET',
            url: '/api/v2/channels/content/',
            errors: {
                403: jsu.translate('Unable to get channel content because you cannot access to this channel.'),
                404: jsu.translate('Requested channel does not exist.')
            }
        },
        getChannels: {
            method: 'GET',
            url: '/api/v2/channels/get/',
            errors: {
                403: jsu.translate('Unable to get channel information because you cannot access to this channel.'),
                404: jsu.translate('Requested channel does not exist.')
            }
        },
        getChannelsTree: {
            method: 'GET',
            url: '/api/v2/channels/tree/',
            errors: {
                403: jsu.translate('Unable to get channels tree because you cannot access to this channel.'),
                404: jsu.translate('Requested channel does not exist.')
            }
        },
        getChannelsPath: {
            method: 'GET',
            url: '/api/v2/channels/path/',
            errors: {
                403: jsu.translate('Unable to get channels path because you cannot access to this channel.'),
                404: jsu.translate('Requested channel does not exist.')
            }
        },
        getChannelsPersonal: {
            method: 'GET',
            url: '/api/v2/channels/personal/'
        },
        getMediasList: {
            method: 'GET',
            url: '/api/v2/medias/'
        },
        getMedias: {
            method: 'GET',
            url: '/api/v2/medias/get/',
            errors: {
                403: jsu.translate('Unable to get media information because you cannot access to this media.'),
                404: jsu.translate('Media does not exist.')
            }
        },
        addMedias: {
            method: 'POST',
            url: '/api/v2/medias/add/'
        },
        mediasResourcesCheck: {
            method: 'POST',
            url: '/api/v2/medias/resources-check/'
        },
        mediasTrimmingChildInit: {
            method: 'POST',
            url: '/api/v2/medias/trimming-child-init/'
        },
        mediasGetUploadConfig: {
            method: 'GET',
            url: '/api/v2/medias/get-upload-config/'
        },
        getLivesList: {
            method: 'GET',
            url: '/api/v2/lives/'
        },
        prepareLives: {
            method: 'POST',
            url: '/api/v2/lives/prepare/'
        },
        startLives: {
            method: 'POST',
            url: '/api/v2/lives/start/'
        },
        stopLives: {
            method: 'POST',
            url: '/api/v2/lives/stop/',
            errors: {
                403: jsu.translate('You are not allowed to perform this action.'),
                404: jsu.translate('Media does not exist.')
            }
        },
        livesChangeSlides: {
            method: 'POST',
            url: '/api/v2/lives/change-slide/'
        },
        livesChangeStatus: {
            method: 'POST',
            url: '/api/v2/lives/change-status/'
        },
        livesGetViewers: {
            method: 'GET',
            url: '/api/v2/lives/get-viewers/'
        },
        listMediaAnnotations: {
            method: 'GET',
            url: '/api/v2/annotations/list/'
        },
        listMediaUserAnnotations: {
            method: 'GET',
            url: '/api/v2/annotations/list/moderate/'
        },
        listAnnotationsTypes: {
            method: 'GET',
            url: '/api/v2/annotations/types/list/'
        },
        voteForAnnotation: {
            method: 'POST',
            url: '/api/v2/annotations/vote/'
        },
        postAnnotation: {
            method: 'POST',
            url: '/api/v2/annotations/post/'
        },
        validateAnnotation: {
            method: 'POST',
            url: '/api/v2/annotations/validate/'
        },
        unvalidateAnnotation: {
            method: 'POST',
            url: '/api/v2/annotations/unvalidate/'
        },
        deleteAnnotation: {
            method: 'POST',
            url: '/api/v2/annotations/delete/'
        },
        listMediaSlides: {
            method: 'GET',
            url: '/api/v2/annotations/slides/list/'
        },
        listMediaResources: {
            method: 'GET',
            url: '/api/v2/annotations/resources/list/'
        },
        listMediaChapters: {
            method: 'GET',
            url: '/api/v2/annotations/chapters/list/'
        },
        listMediaActivities: {
            method: 'GET',
            url: '/api/v2/annotations/activities/list/'
        },
        emailNotification: {
            method: 'POST',
            url: '/api/v2/annotations/notification/'
        },
        searchAnnotations: {
            method: 'GET',
            url: '/api/v2/annotations/search/'
        },
        listCategories: {
            method: 'GET',
            url: '/api/v2/categories/'
        }
    };

    this.configure(options);
}
MSAPIClient.prototype.configure = function (options) {
    if (!options) {
        return;
    }
    if (options.baseUrl) {
        this.baseUrl = options.baseUrl;
    }
    if (options.useProxy) {
        this.useProxy = options.useProxy;
    }
    if (options.extraData) {
        this.extraData = options.extraData;
    }
};
MSAPIClient.prototype.ajaxCall = function (callOrUri, data, callback, async, file, xhrFunction) {
    // callOrUri can be either an API call name ('listCategories' for example) or an uri like 'GET:/api/v2/categories/'
    let callInfo = this.calls[callOrUri];
    if (!callInfo) {
        const splitted = callOrUri.split(':');
        if (splitted.length == 1) {
            callInfo = {method: 'GET', url: splitted[0]};
        } else if (splitted.length == 2) {
            callInfo = {method: splitted[0], url: splitted[1]};
        } else {
            throw new Error('Invalid call or uri.');
        }
    }

    let url = this.baseUrl;
    if (this.useProxy) {
        data.action = callInfo.url;
    } else {
        if (!this.baseUrl) {
            data.local = 'yes'; // To get urls with no host
        }
        url += callInfo.url;
    }
    if (typeof url === 'undefined' || url === 'undefined') {
        throw new Error('No url to call.');
    }
    if (this.extraData) {
        let field;
        for (field in this.extraData) {
            data[field] = this.extraData[field];
        }
    }

    const obj = this;
    const ajaxData = {
        url: url,
        method: callInfo.method,
        data: data,
        dataType: 'json',
        cache: false,
        success: function (response) {
            if (callback) {
                return callback(response);
            }
        },
        error: function (xhr) {
            if (callback) {
                let response;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    response = {};
                }
                response.success = false;
                response.errorCode = xhr.status;

                if (xhr.status === 500 || !response.error) {
                    let msg = '';
                    if (!xhr.status) {
                        msg = jsu.translate('Failed to communicate with the service.');
                    } else if (callInfo.errors && xhr.status in callInfo.errors) {
                        msg = callInfo.errors[xhr.status];
                    } else if (xhr.status in obj.defaultsErrorsMessages) {
                        msg = obj.defaultsErrorsMessages[xhr.status];
                    } else {
                        msg = jsu.translate('Request failed with code:') + ' ' + xhr.status;
                    }
                    response.error = msg;
                }

                return callback(response);
            }
        }
    };

    if (typeof async === 'undefined' || async) {
        ajaxData.async = async;
    }
    if (file) {
        ajaxData.processData = false;
        ajaxData.enctype = 'multipart/form-data';
        ajaxData.contentType = false;
    }
    if (xhrFunction) {
        ajaxData.xhr = xhrFunction;
    }
    return $.ajax(ajaxData);
};
MSAPIClient.prototype.getStorageLevelClass = function (level) {
    switch (level) {
        case 'critical':
            return 'red';
        case 'warning':
            return 'orange';
        default:
            return '';
    }
};
MSAPIClient.prototype.getStorageDisplay = function (item, isUserStorage) {
    let html = '';
    if (item.storage_used !== null && item.storage_used !== undefined) {
        html = '<span class="storage-usage">' + jsu.getSizeDisplay(item.storage_used);
        if (item.storage_quota > 0) {
            html += ' / ' + jsu.escapeHTML(item.storage_quota) + ' G' + jsu.translateHTML('B');
            if (item.storage_quota_percents !== undefined) {
                html += ' <span class="progress-bar ' + this.getStorageLevelClass(item.storage_quota_level) + '" aria-hidden="true">' +
                '<span class="progress-level" style="width: ' + item.storage_quota_percents + '%"></span>' +
                '<span class="progress-label">' + item.storage_quota_percents + ' %</span>' +
                '</span>';
            }
        }
        html += '</span>';
        const storageAvailable = this.getAvailableStorageDisplay(item, isUserStorage);
        if (storageAvailable) {
            html += ' ' + storageAvailable;
        }
    }
    return html;
};
MSAPIClient.prototype.getStorageMinimalDisplay = function (item) {
    let html = '';
    if (item.storage_used !== null && item.storage_used !== undefined) {
        html = '<span class="storage-usage">' + jsu.getSizeDisplay(item.storage_used);
        if (item.storage_quota > 0) {
            html += ' / ' + jsu.escapeHTML(item.storage_quota) + ' G' + jsu.translateHTML('B');
        }
        html += '</span>';
    }
    return html;
};
MSAPIClient.prototype.getAvailableStorageDisplay = function (item, isUserStorage) {
    let html = '';
    if (item.storage_available !== null && item.storage_available !== undefined) {
        html = '<span class="storage-available nowrap">' +
        (item.storage_available > 0
            ? '<span class="' + this.getStorageLevelClass(item.storage_quota_level) + ' ">' + jsu.translateHTML('Available space:') + ' ' + jsu.getSizeDisplay(item.storage_available) + '</span>'
            : '<span class="red">' + jsu.translateHTML('No available space') + '</span>'
        ) +
        ' <button type="button" class="ubi-web-lib-tooltip-button no-padding no-border no-background" aria-describedby="id_storage_help" aria-label="' + jsu.translateAttribute('help') + '">' +
        '<i class="fa fa-question-circle fa-fw" aria-hidden="true"></i>' +
        '<span role="tooltip" id="id_storage_help" class="tooltip-hidden-content">' +
        (isUserStorage
            ? jsu.translateHTML('Your storage usage is the size used by all media for which you are in the speakers list and all media in your personal channel.')
            : jsu.translateHTML('The storage quota of the parent channels can have an impact on the available space of this channel.')
        ) +
        '</span>' +
        '</button>' +
        '</span>';
    }
    return html;
};
