/*******************************************
 * MediaServer - API Manager                *
 * Copyright: UbiCast, all rights reserved  *
 * Author: Stephane Schoorens               *
 * TODO Pass urls to the lib from django url*
 *******************************************/
/* globals utils */

var MSAPI = {
    // params
    base_url: "",
    use_proxy: false,
    extra_data: null,
    configure: function (options) {
        if ("base_url" in options)
            MSAPI.base_url = options.base_url;
        if ("use_proxy" in options)
            MSAPI.use_proxy = options.use_proxy;
        if ("extra_data" in options)
            MSAPI.extra_data = options.extra_data;
    },
    // vars
    defaults_errors_messages: {
        401: utils.translate("You are not logged in or your session has expired. Please login and retry."),
        403: utils.translate("Access denied."),
        404: utils.translate("Element not found."),
        500: utils.translate("An internal server error occured. An email has been sent to the support team."),
        timeout: utils.translate("The connection timed out. Please retry later."),
        unreachable: utils.translate("The server cannot be reached.")
    },
    methods: {
        /* ### fast copy - past not used in code ###
        generic: {
            method: "",
            url: "",
            errors: {
                401: utils.translate(""),
                403: utils.translate(""),
                404: utils.translate(""),
                500: utils.translate(""),
                timeout: utils.translate("")
            }
        },
        ########################################## */
        ping: {
            method: "GET",
            url: "/api/v2/"
        },
        search: {
            method: "GET",
            url: "/api/v2/search/",
            errors: {
                403: utils.translate("Unable to get search's results content because you cannot access to this channel."),
                404: utils.translate("Requested channel does not exist.")
            }
        },
        get_channels_list: {
            method: "GET",
            url: "/api/v2/channels/"
        },
        get_latest_content: {
            method: "GET",
            url: "/api/v2/latest/"
        },
        get_channels_content: {
            method: "GET",
            url: "/api/v2/channels/content/",
            errors: {
                403: utils.translate("Unable to get channel's content because you cannot access to this channel."),
                404: utils.translate("Requested channel does not exist.")
            }
        },
        get_channels: {
            method: "GET",
            url: "/api/v2/channels/get/",
            errors: {
                403: utils.translate("Unable to get channel's information because you cannot access to this channel."),
                404: utils.translate("Requested channel does not exist.")
            }
        },
        get_channels_tree: {
            method: "GET",
            url: "/api/v2/channels/tree/",
            errors: {
                403: utils.translate("Unable to get channels tree because you cannot access to this channel."),
                404: utils.translate("Requested channel does not exist.")
            }
        },
        get_channels_path: {
            method: "GET",
            url: "/api/v2/channels/path/",
            errors: {
                403: utils.translate("Unable to get channels path because you cannot access to this channel."),
                404: utils.translate("Requested channel does not exist.")
            }
        },
        get_medias_list: {
            method: "GET",
            url: "/api/v2/medias/"
        },
        get_medias: {
            method: "GET",
            url: "/api/v2/medias/get/",
            errors: {
                403: utils.translate("Unable to get media's information because you cannot access to this media."),
                404: utils.translate("Media does not exist.")
            }
        },
        add_medias: {
            method: "POST",
            url: "/api/v2/medias/add/"
        },
        medias_resources_check: {
            method: "POST",
            url: "/api/v2/medias/resources-check/"
        },
        medias_trimming_child_init: {
            method: "POST",
            url: "/api/v2/medias/trimming-child-init/"
        },
        medias_get_upload_config: {
            method: "GET",
            url: "/api/v2/medias/get-upload-config/"
        },
        get_lives_list: {
            method: "GET",
            url: "/api/v2/lives/"
        },
        prepare_lives: {
            method: "POST",
            url: "/api/v2/lives/prepare/"
        },
        start_lives: {
            method: "POST",
            url: "/api/v2/lives/start/"
        },
        stop_lives: {
            method: "POST",
            url: "/api/v2/lives/stop/",
            errors: {
                403: utils.translate("You are not allowed to perform this action."),
                404: utils.translate("Media does not exist.")
            }
        },
        lives_change_slides: {
            method: "POST",
            url: "/api/v2/lives/change-slide/"
        },
        lives_get_viewers: {
            method: "GET",
            url: "/api/v2/lives/get-viewers/"
        },
        list_media_annotations: {
            method: "GET",
            url: "/api/v2/annotations/list/"
        },
        list_media_user_annotations: {
            method: "GET",
            url: "/api/v2/annotations/list/moderate"
        },
        list_annotations_types: {
            method: "GET",
            url: "/api/v2/annotations/types/list/"
        },
        vote_for_annotation: {
            method: "POST",
            url: "/api/v2/annotations/vote/"
        },
        post_annotation: {
            method: "POST",
            url: "/api/v2/annotations/post/"
        },
        validate_annotation: {
            method: "POST",
            url: "/api/v2/annotations/validate/"
        },
        unvalidate_annotation: {
            method: "POST",
            url: "/api/v2/annotations/unvalidate/"
        },
        delete_annotation: {
            method: "POST",
            url: "/api/v2/annotations/delete/"
        },
        list_media_slides: {
            method: "GET",
            url: "/api/v2/annotations/slides/list/"
        },
        list_media_resources: {
            method: "GET",
            url: "/api/v2/annotations/resources/list/"
        },
        list_media_chapters: {
            method: "GET",
            url: "/api/v2/annotations/chapters/list/"
        },
        list_media_activities: {
            method: "GET",
            url: "/api/v2/annotations/activities/list/"
        },
        email_notification: {
            method: "POST",
            url: "/api/v2/annotations/notification/"
        },
        search_annotations: {
            method: "GET",
            url: "/api/v2/annotations/search/"
        },
        list_categories: {
            method: "GET",
            url: "/api/v2/categories"
        }
    },
    ajax_call: function (method, data, callback, async, file, xhr_function) {
        if (typeof MSAPI.methods[method] === "undefined")
            throw new Error("Unknown method.");

        var url = MSAPI.base_url;
        if (MSAPI.use_proxy)
            data.action = MSAPI.methods[method].url;
        else {
            if (!MSAPI.base_url)
                data.local = "yes";  // To get urls with no host
            url += MSAPI.methods[method].url;
        }
        if (typeof url === "undefined" || url === "undefined")
            throw new Error("No url to call.");
        if (MSAPI.extra_data)
            for (var field in MSAPI.extra_data) {
                data[field] = MSAPI.extra_data[field];
            }

        var ajax_data = {
            url: url,
            method: MSAPI.methods[method].method,
            data: data,
            dataType: "json",
            cache: false,
            success: function (response) {
                if (!response.success)
                    response.error = response.error ? response.error : utils.translate("No information about error.");
                if (callback)
                    return callback(response);
            },
            error: function (xhr, textStatus, thrownError) {
                var reason = "?";
                if (xhr.status)
                    reason = xhr.status;
                else if (textStatus == "error")
                    reason = "unreachable";
                else if (textStatus == "timeout")
                    reason = "timeout";

                var msg = MSAPI.methods[method].errors && reason in MSAPI.methods[method].errors ? MSAPI.methods[method].errors[reason] : "";
                if (!msg)
                    msg = reason in MSAPI.defaults_errors_messages ? MSAPI.defaults_errors_messages[reason] : utils.translate("Request failed:")+" "+thrownError;

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

        if (typeof async === "undefined" || async) {
            ajax_data.async = async;
        }
        if (file) {
            ajax_data.processData = false;
            ajax_data.enctype = "multipart/form-data";
            ajax_data.contentType = false;
        }
        if (xhr_function) {
            ajax_data.xhr = xhr_function;
        }
        return $.ajax(ajax_data);
    }
};
