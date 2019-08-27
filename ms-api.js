/*********************************************
 * MediaServer - API Manager                 *
 * Copyright: UbiCast, all rights reserved   *
 * Author: Stephane Schoorens                *
 * TODO Pass urls to the lib from django url *
 *********************************************/
/* globals utils */

var MSAPI = {
    // params
    base_url: '',
    use_proxy: false,
    extra_data: null,
    configure: function (options) {
        if ('base_url' in options)
            MSAPI.base_url = options.base_url;
        if ('use_proxy' in options)
            MSAPI.use_proxy = options.use_proxy;
        if ('extra_data' in options)
            MSAPI.extra_data = options.extra_data;
    },
    // vars
    defaults_errors_messages: {
        401: utils.translate('You are not logged in or your session has expired. Please login and retry.'),
        403: utils.translate('Access denied.'),
        404: utils.translate('Item not found.'),
        500: utils.translate('An internal server error occurred. An email has been sent to the support team.'),
        timeout: utils.translate('The connection timed out. Please retry later.'),
        unreachable: utils.translate('The server cannot be reached.')
    },
    calls: {
        ping: {
            method: 'GET',
            url: '/api/v2/'
        },
        search: {
            method: 'GET',
            url: '/api/v2/search/',
            errors: {
                403: utils.translate('Unable to get search\'s results content because you cannot access to this channel.'),
                404: utils.translate('Requested channel does not exist.')
            }
        },
        get_latest_content: {
            method: 'GET',
            url: '/api/v2/latest/'
        },
        get_channels_list: {
            method: 'GET',
            url: '/api/v2/channels/'
        },
        get_channels_content: {
            method: 'GET',
            url: '/api/v2/channels/content/',
            errors: {
                403: utils.translate('Unable to get channel content because you cannot access to this channel.'),
                404: utils.translate('Requested channel does not exist.')
            }
        },
        get_channels: {
            method: 'GET',
            url: '/api/v2/channels/get/',
            errors: {
                403: utils.translate('Unable to get channel information because you cannot access to this channel.'),
                404: utils.translate('Requested channel does not exist.')
            }
        },
        get_channels_tree: {
            method: 'GET',
            url: '/api/v2/channels/tree/',
            errors: {
                403: utils.translate('Unable to get channels tree because you cannot access to this channel.'),
                404: utils.translate('Requested channel does not exist.')
            }
        },
        get_channels_path: {
            method: 'GET',
            url: '/api/v2/channels/path/',
            errors: {
                403: utils.translate('Unable to get channels path because you cannot access to this channel.'),
                404: utils.translate('Requested channel does not exist.')
            }
        },
        get_channels_personal: {
            method: 'GET',
            url: '/api/v2/channels/personal/'
        },
        get_medias_list: {
            method: 'GET',
            url: '/api/v2/medias/'
        },
        get_medias: {
            method: 'GET',
            url: '/api/v2/medias/get/',
            errors: {
                403: utils.translate('Unable to get media information because you cannot access to this media.'),
                404: utils.translate('Media does not exist.')
            }
        },
        add_medias: {
            method: 'POST',
            url: '/api/v2/medias/add/'
        },
        medias_resources_check: {
            method: 'POST',
            url: '/api/v2/medias/resources-check/'
        },
        medias_trimming_child_init: {
            method: 'POST',
            url: '/api/v2/medias/trimming-child-init/'
        },
        medias_get_upload_config: {
            method: 'GET',
            url: '/api/v2/medias/get-upload-config/'
        },
        get_lives_list: {
            method: 'GET',
            url: '/api/v2/lives/'
        },
        prepare_lives: {
            method: 'POST',
            url: '/api/v2/lives/prepare/'
        },
        start_lives: {
            method: 'POST',
            url: '/api/v2/lives/start/'
        },
        stop_lives: {
            method: 'POST',
            url: '/api/v2/lives/stop/',
            errors: {
                403: utils.translate('You are not allowed to perform this action.'),
                404: utils.translate('Media does not exist.')
            }
        },
        lives_change_slides: {
            method: 'POST',
            url: '/api/v2/lives/change-slide/'
        },
        lives_change_status: {
            method: 'POST',
            url: '/api/v2/lives/change-status/'
        },
        lives_get_viewers: {
            method: 'GET',
            url: '/api/v2/lives/get-viewers/'
        },
        list_media_annotations: {
            method: 'GET',
            url: '/api/v2/annotations/list/'
        },
        list_media_user_annotations: {
            method: 'GET',
            url: '/api/v2/annotations/list/moderate/'
        },
        list_annotations_types: {
            method: 'GET',
            url: '/api/v2/annotations/types/list/'
        },
        vote_for_annotation: {
            method: 'POST',
            url: '/api/v2/annotations/vote/'
        },
        post_annotation: {
            method: 'POST',
            url: '/api/v2/annotations/post/'
        },
        validate_annotation: {
            method: 'POST',
            url: '/api/v2/annotations/validate/'
        },
        unvalidate_annotation: {
            method: 'POST',
            url: '/api/v2/annotations/unvalidate/'
        },
        delete_annotation: {
            method: 'POST',
            url: '/api/v2/annotations/delete/'
        },
        list_media_slides: {
            method: 'GET',
            url: '/api/v2/annotations/slides/list/'
        },
        list_media_resources: {
            method: 'GET',
            url: '/api/v2/annotations/resources/list/'
        },
        list_media_chapters: {
            method: 'GET',
            url: '/api/v2/annotations/chapters/list/'
        },
        list_media_activities: {
            method: 'GET',
            url: '/api/v2/annotations/activities/list/'
        },
        email_notification: {
            method: 'POST',
            url: '/api/v2/annotations/notification/'
        },
        search_annotations: {
            method: 'GET',
            url: '/api/v2/annotations/search/'
        },
        list_categories: {
            method: 'GET',
            url: '/api/v2/categories/'
        }
    },
    ajax_call: function (call_or_uri, data, callback, async, file, xhr_function) {
        // call_or_uri can be either an API call name ('list_categories' for example) or an uri like 'GET:/api/v2/categories/'
        var call_info = MSAPI.calls[call_or_uri];
        if (!call_info) {
            var splitted = call_or_uri.split(':');
            if (splitted.length == 1) {
                call_info = {method: 'GET', url: splitted[0]};
            } else if (splitted.length == 2) {
                call_info = {method: splitted[0], url: splitted[1]};
            } else {
                throw new Error('Invalid call or uri.');
            }
        }

        var url = MSAPI.base_url;
        if (MSAPI.use_proxy)
            data.action = call_info.url;
        else {
            if (!MSAPI.base_url)
                data.local = 'yes';  // To get urls with no host
            url += call_info.url;
        }
        if (typeof url === 'undefined' || url === 'undefined')
            throw new Error('No url to call.');
        if (MSAPI.extra_data)
            for (var field in MSAPI.extra_data) {
                data[field] = MSAPI.extra_data[field];
            }

        var ajax_data = {
            url: url,
            method: call_info.method,
            data: data,
            dataType: 'json',
            cache: false,
            success: function (response) {
                if (!response.success && !response.error)
                    response.error = response.message ? response.message : utils.translate('No information about error.');
                if (callback)
                    return callback(response);
            },
            error: function (xhr, textStatus, thrownError) {
                var reason = '?';
                if (xhr.status)
                    reason = xhr.status;
                else if (textStatus == 'error')
                    reason = 'unreachable';
                else if (textStatus == 'timeout')
                    reason = 'timeout';

                var msg = call_info.errors && reason in call_info.errors ? call_info.errors[reason] : '';
                if (!msg)
                    msg = reason in MSAPI.defaults_errors_messages ? MSAPI.defaults_errors_messages[reason] : utils.translate('Request failed:')+' '+thrownError;

                return callback({
                    success: false,
                    error: msg,
                    error_code: xhr.status,
                    xhr: xhr,
                    textStatus: textStatus,
                    thrownError: thrownError
                });
            }
        };

        if (typeof async === 'undefined' || async) {
            ajax_data.async = async;
        }
        if (file) {
            ajax_data.processData = false;
            ajax_data.enctype = 'multipart/form-data';
            ajax_data.contentType = false;
        }
        if (xhr_function) {
            ajax_data.xhr = xhr_function;
        }
        return $.ajax(ajax_data);
    },
    get_storage_display: function (item) {
        var html = '';
        if (item.storage_used !== null && item.storage_used !== undefined) {
            html = '<span class="storage-usage">' + utils.get_size_display(item.storage_used);
            if (item.storage_quota > 0) {
                html += ' / ' + item.storage_quota + ' G' + utils.translate('B') + '';
                var storage_used_percents = Math.round(100 * (item.storage_used / 1073741824) / item.storage_quota);
                if (storage_used_percents > 100)
                    storage_used_percents = 100;
                var storage_class = '';
                if (item.storage_warning && storage_used_percents > item.storage_warning)
                    storage_class = ' red';
                html += '<span class="progress-bar inline-block' + storage_class + '" aria-hidden="true" style="width: 100%; vertical-align: middle;">' +
                '<span class="progress-level" style="width: ' + storage_used_percents + '%"></span>' +
                '<span class="progress-label">' + storage_used_percents + ' %</span>' +
                '</span>';
            }
            html += '</span>';
            var storage_available = MSAPI.get_available_storage_display(item);
            if (storage_available) {
                html += ' ' + storage_available;
            }
        }
        return html;
    },
    get_available_storage_display: function (item) {
        var html = '';
        if (item.storage_available !== null && item.storage_available !== undefined) {
            var storage_class = '';
            if (item.storage_quota > 0) {
                var storage_used_percents = 100 * (item.storage_used / 1073741824) / item.storage_quota;
                if (item.storage_warning && storage_used_percents > item.storage_warning)
                    storage_class = ' orange';
            }
            html += '<span class="storage-available nowrap">';
            if (item.storage_available > 0) {
                html += '<span class="' + storage_class + ' ">' + utils.translate('Available space:') + ' ' + utils.get_size_display(item.storage_available) + '</span>';
            } else {
                html += '<span class="red">' + utils.translate('No available space') + '</span>';
            }
            html += ' <button type="button" class="tooltip-button no-padding no-border no-background" aria-describedby="id_storage_help" aria-label="' + utils.translate('help') + '"><i class="fa fa-question-circle fa-fw" aria-hidden="true"></i><span role="tooltip" id="id_storage_help" class="tooltip-hidden-content">' + utils.translate('The storage quota of the parent channels can have an impact on the available space of this channel.') + '</span></button>';
            html += '</span>';
        }
        return html;
    }
};
