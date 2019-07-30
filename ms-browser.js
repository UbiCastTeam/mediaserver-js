/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals MSAPI, utils, OverlayDisplayManager, MSBrowserChannels, MSBrowserSearch, MSBrowserLatest */
"use strict";

function MSBrowser(options) {
    // params
    this.title = "";
    this.place = null;
    this.selectable_content = "cvlp"; // v for videos, l for lives, p for photos group and c for channels
    this.displayable_content = "cvlp";
    this.filter_editable = null;
    this.filter_validated = null;
    this.filter_speaker = null;
    this.filter_categories = [];
    this.filter_no_categories = false;
    this.parent_selection_oid = null; // special for channel parent selection
    this.initial_oid = null;
    this.initial_state = null;
    this.on_pick = null;
    this.hide_header = false;
    this.btn_class = "";
    this.tree_manager = true;
    this.display_types_icons = false;
    this.display_itunes_rss = true;
    // vars
    this.use_overlay = true;
    this.pick_mode = true;
    this.iframe_mode = false;
    this.lti_mode = false;
    this.links_url_params = "";
    this.links_target = "";
    this.$widget = null;
    this.$menu = null;
    this.$main = null;
    this.overlay = null;

    this.catalog = {};
    this.display_as_thumbnails = false;
    this.displayed = "channels";
    this.current_selection = null;
    this.site_settings_categories = [];

    this.url_login = "/login/";
    this.url_channels = "/channels/";
    this.url_latest = "/latest/";
    this.url_search = "/search/";
    this.url_post_link = "/lti/post-link/";

    this.default_search_in = [];

    utils.setup_class(this, options, [
        // allowed options
        "title",
        "place",
        "selectable_content",
        "displayable_content",
        "filter_editable",
        "filter_validated",
        "filter_speaker",
        "parent_selection_oid",
        "initial_oid",
        "initial_state",
        "on_pick",
        "hide_header",
        "btn_class",
        "tree_manager",
        "display_types_icons",
        "display_itunes_rss",
        "default_search_in"
    ]);

    MSAPI.configure(options);
    this.init_options = options ? options : {};
    this.use_overlay = this.place ? false : true;

    if (!this.use_overlay) {
        var obj = this;
        $(document).ready(function () {
            obj.init();
        });
    }
}

MSBrowser.prototype.init = function () {
    if (this.initialized)
        return;
    this.initialized = true;

    if (utils.get_cookie("catalog-display_mode") == "thumbnail") {
        this.display_as_thumbnails = true;
        if (!this.use_overlay)
            $("#container").removeClass("max-width-1200");
    }

    if (utils.get_cookie("catalog-display_types_icons") == "yes") {
        this.display_types_icons = true;
    }

    var url_data = this.parse_url();

    if (!this.use_overlay) {
        this.pick_mode = false;
        var url_params = [];

        if (url_data.iframe) {
            this.iframe_mode = true;
            this.url_login = "/login/iframe/";
            url_params.push("iframe");
        }

        if (url_data.mine) {
            this.filter_speaker = "self";
            url_params.push("mine");
        }

        if (url_data.lti) {
            this.lti_mode = true;
            this.filter_speaker = "self";
            url_params.push("lti");
        }

        if (url_data.newtab) {
            this.links_target = " target=\"_blank\"";
            url_params.push("newtab");
        }

        if (url_data.pick) {
            this.pick_mode = true;
            if (url_data.pick.toString().match(/^[cvlp]+$/)) {
                this.selectable_content = url_data.pick;
                this.displayable_content = url_data.pick;
                if (this.displayable_content.indexOf("c") < 0)
                    this.displayable_content = "c" + this.displayable_content;
            } else {
                this.selectable_content = "vlp";
                this.displayable_content = "cvlp";
            }
            url_params.push("pick=" + this.selectable_content);
            if (!this.initial_oid && url_data.initial) {
                this.initial_oid = url_data.initial.toString();
                url_params.push("initial=" + this.initial_oid);
            }
        }

        if (url_data["return"] && ((window.parent && url_data["return"].toString().indexOf("postMessageAPI") === 0) || (url_data["return"].toString().indexOf("https://") === 0 && url_data["return"].toString().length > 8))) {
            if (!this.pick_mode) {
                this.pick_mode = true;
                this.selectable_content = "vlp";
                this.displayable_content = "cvlp";
                url_params.push("pick=" + this.selectable_content);
            }
            url_params.push("return=" + url_data["return"]);
            var return_target;
            if (window.parent && url_data["return"].toString().indexOf("postMessageAPI") === 0)
                return_target = url_data["return"];
            else
                return_target = this.url_post_link + "?return=" + url_data["return"];
            this.on_pick = function (item, initial_pick) {
                if (initial_pick)
                    return;
                if (return_target.indexOf("postMessageAPI") === 0) {
                    var top_frame = window.opener ? window.opener.parent : window.parent;
                    var target_name = return_target.substring("postMessageAPI".length).replace(/^:+|:+$/g, "");
                    top_frame.postMessage({item: item, initial_pick: (initial_pick ? true : false), target: target_name}, "*");
                    if (window.opener)
                        window.close();
                } else {
                    window.location = return_target + "&oid=" + item.oid;
                }
            };
        }

        if (url_params.length > 0) {
            this.links_url_params = url_params.join("&");
            this.url_login += "?" + this.links_url_params;
            this.url_channels += "?" + this.links_url_params;
            this.url_latest += "?" + this.links_url_params;
            this.url_search += "?" + this.links_url_params;
        }
    }

    // get elements
    this.init_options.browser = this;
    if (this.current_selection && this.current_selection.oid) {
        if (this.current_selection.oid.indexOf("c") === 0 || !isNaN(parseInt(this.current_selection.oid, 10)))
            this.init_options.current_channel_oid = this.current_selection.oid;
        else
            this.init_options.current_channel_oid = this.current_selection.parent_oid;
    }
    this.channels = new MSBrowserChannels(this.init_options);
    this.latest = new MSBrowserLatest(this.init_options);
    this.search = new MSBrowserSearch(this.init_options);

    this.build_widget();

    if (this.initial_state && this.initial_state.tab)
        this.change_tab(this.initial_state.tab, true);
    else
        this.change_tab("channels", true);

    if (this.initial_oid)
        this.pick(this.initial_oid, null, true);

    var obj = this;
    if (!this.use_overlay) {
        // listen to navigation history changes
        window.onpopstate = function (event) {
            obj.on_url_change(event.target.location);
        };
        // listen to hash changes
        $(window).bind("hashchange", function () {
            obj.on_url_change();
        });
    } else {
        this.overlay = new OverlayDisplayManager();
    }
    // initialize categories
    this.load_categories();
    $(window).resize(function () {
        obj.on_resize();
    });
    this.on_resize();
};
MSBrowser.prototype.open = function () {
    if (!this.use_overlay)
        return;
    this.init();
    var obj = this;
    this.overlay.show({
        mode: "html",
        title: this.title,
        html: this.$widget,
        on_hide: function () { obj.$widget.detach(); }
    });
};
MSBrowser.prototype.update_catalog = function (item, full) {
    if (!item || !item.oid)
        return;
    if (!this.catalog[item.oid]) {
        if (full)
            item.is_full = true;
        this.catalog[item.oid] = item;
    } else {
        for (var field in item) {
            this.catalog[item.oid][field] = item[field];
        }
        if (full)
            this.catalog[item.oid].is_full = true;
    }
};
MSBrowser.prototype.get_info_for_oid = function (oid, full, callback) {
    var is_media = oid && (oid[0] == "v" || oid[0] == "l" || oid[0] == "p");
    return this.get_info({ oid: oid }, is_media, full, callback);
};
MSBrowser.prototype.get_info_for_slug = function (slug, is_media, full, callback) {
    return this.get_info({ slug: slug }, is_media, full, callback);
};
MSBrowser.prototype.get_info = function (data, is_media, full, callback) {
    if ((!data.oid && !data.slug) || !callback)
        return;
    var field = data.oid ? "oid" : "slug";
    var item = null;
    for (var s_oid in this.catalog) {
        if (!is_media && s_oid[0] == "c" || is_media && s_oid[0] != "c") {
            if (this.catalog[s_oid][field] == data[field]) {
                if (!full)
                    item = this.catalog[s_oid];
                else if (this.catalog[s_oid].is_full)
                    item = this.catalog[s_oid];
                break;
            }
        }
    }
    if (item)
        return callback({ success: true, info: item });
    this.display_loading();
    if (full)
        data.full = "yes";
    var method = is_media ? "get_medias" : "get_channels";
    var obj = this;
    MSAPI.ajax_call(method, data, function (response) {
        if (response.success)
            obj.update_catalog(response.info, full);
        obj.hide_loading();
        callback(response);
    });
};
MSBrowser.prototype.pick = function (oid, action, initial_pick) {
    if (oid === null || oid === undefined) {
        // deselect
        if (this.current_selection && this.current_selection.oid)
            $(".item-entry-"+this.current_selection.oid, this.$main).removeClass("selected");
        return;
    }
    if (this.catalog[oid] && this.catalog[oid].is_full) {
        this._pick(oid, { success: true, info: this.catalog[oid] }, action, initial_pick);
        return;
    }
    // load info if no info are available
    var obj = this;
    this.get_info_for_oid(oid, true, function (result) {
        obj._pick(oid, result, action, initial_pick);
    });
};
MSBrowser.prototype._pick = function (oid, result, action, initial_pick) {
    if (!result.success) {
        // this should never happen
        console.log("Unable to get info about initial selection:"+result.error);
        return;
    }
    if (!this.pick_mode) {
        if (action == "delete" && window.delete_form_manager)
            window.delete_form_manager.show(oid, this.catalog[oid].title);
    } else {
        // change current selection
        if (this.current_selection && this.current_selection.oid)
            $(".item-entry-"+this.current_selection.oid, this.$main).removeClass("selected");
        this.current_selection = this.catalog[oid];
        $(".item-entry-"+this.current_selection.oid, this.$main).addClass("selected");
        if (this.overlay && !initial_pick)
            this.overlay.hide();
        if (this.on_pick)
            this.on_pick(this.catalog[oid], initial_pick);
        // select and open channel
        if (!this.use_overlay && result.info.parent_slug)
            window.location.hash = "#" + result.info.parent_slug;
        if (this.channels && (!initial_pick || !this.initial_state || !this.initial_state.channel_slug)) {
            if (oid.indexOf("c") === 0 || !isNaN(parseInt(oid, 10)))
                this.channels.display_channel(oid);
            else
                this.channels.display_channel(result.info.parent_oid);
        }
    }
};
MSBrowser.prototype.remove = function (oid) {
    // remove given oid from display without reloading page
    // this do not remove the object in the server
    if (!oid || !this.catalog[oid])
        return;
    this.channels.remove(oid);
    this.latest.remove(oid);
    this.search.remove(oid);
};
MSBrowser.prototype.get_last_pick = function () {
    return this.current_selection;
};
MSBrowser.prototype.get_selected_oid = function () {
    if (!this.initialized)
        return this.initial_oid;
    else if (this.current_selection)
        return this.current_selection.oid;
    else
        return null;
};
MSBrowser.prototype.parse_url = function () {
    var data = {};
    var query = window.location.search ? window.location.search.substring(1) : null;
    if (query) {
        var tuples = query.split("&");
        for (var i=0; i < tuples.length; i++) {
            var attr, value;
            if (tuples[i].indexOf("=") != -1) {
                attr = tuples[i].substring(0, tuples[i].indexOf("="));
                value = tuples[i].substring(attr.length + 1);
                if (value == "on")
                    value = true;
                else if (value == "off")
                    value = false;
                else
                    value = window.decodeURIComponent(value.replace(/\+/g, "%20"));
            } else {
                attr = tuples[i];
                value = true;
            }
            if (attr.substring(0, 3) == "in_")
                data.has_in_vals = true;
            else if (attr.substring(0, 4) == "for_")
                data.has_for_vals = true;
            data[attr] = value;
        }
    }
    return data;
};
/* events handlers */
MSBrowser.prototype.on_url_change = function () {
    var path = window.location.pathname + window.location.search;
    if (path.indexOf("/channels/") === 0) {
        var slug = window.location.hash;
        if (slug && slug[0] == "#")
            slug = slug.substring(1);
        if (slug) {
            this.channels.display_channel_by_slug(slug);
        } else {
            if (this.filter_speaker == "self")
                this.channels.display_personal_channel();
            else
                this.channels.display_channel("0");
        }
        this.change_tab("channels", true);
    } else if (path.indexOf("/latest/") === 0) {
        this.change_tab("latest", true);
    } else if (path.indexOf("/search/") === 0) {
        this.search.on_url_change();
        this.change_tab("search", true);
    }
};
MSBrowser.prototype.on_resize = function () {
    if (this.use_overlay) {
        var width = $(window).width() - 70;
        this.$widget.width(width);
        var height = $(window).height() - 100;
        this.$widget.height(height);
    }
};
MSBrowser.prototype.load_categories = function () {
    var obj = this;
    MSAPI.ajax_call("list_categories", {}, function (response) {
        if (response.data) {
            obj.site_settings_categories = response.data;
            obj.display_categories();
        }
    });
};