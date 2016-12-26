/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals utils, MSAPI, MSTreeManager */

function MSBrowserChannels(options) {
    // params
    this.browser = null;
    this.display_itunes_rss = false;
    this.current_channel_oid = "0";
    // vars
    this.$menu = null;
    this.$panel = null;
    this.$content = null;
    this.tree_manager = null;
    this.order = "default";
    this.last_response = null;

    utils.setup_class(this, options, [
        // allowed options
        "browser",
        "display_itunes_rss",
        "current_channel_oid"
    ]);
    this.init_options = options ? options : {};
}

MSBrowserChannels.prototype.get_menu_jq = function () {
    var html = "";
    html += "<div id=\"ms_browser_channels_menu\" class=\"ms-browser-block\" style=\"display: none;\">";
    html += "</div>";
    this.$menu = $(html);
    return this.$menu;
};
MSBrowserChannels.prototype.get_content_jq = function () {
    var html = "";
    html += "<div id=\"ms_browser_channels\" class=\"ms-browser-content\" style=\"display: none;\">";
    html +=     "<div class=\"ms-browser-header\"><h1>"+utils.translate("Channel's content")+"</h1></div>";
    html +=     "<div class=\"ms-browser-block\">";
    html +=         "<div class=\"info\">"+utils.translate("Select a channel to display its content.")+"</div>";
    html +=     "</div>";
    html += "</div>";
    this.$panel = $(html);
    this.$content = $(".ms-browser-block", this.$panel);
    return this.$panel;
};

MSBrowserChannels.prototype.on_show = function () {
    if (this.initialized)
        return;
    this.initialized = true;
    this.default_logo_src = $("#mainlogo .header-logo").attr("src");
    this.default_fav_src = $("#").attr("src");

    // tree manager
    var obj = this;
    var params = {
        $place: $("<div class=\"ms-channels-tree\"></div>"),
        display_root: this.browser.displayable_content.indexOf("c") != -1,
        current_channel_oid: this.current_channel_oid,
        on_data_retrieved: function (data) { obj.browser.update_catalog(data); }
    };
    if (this.browser.use_overlay) {
        params.on_change = function (oid) {
            obj.display_channel(oid);
        };
    }
    this.tree_manager = new MSTreeManager(params);
    this.$menu.append(this.tree_manager.$place);

    // load first channel
    if (this.init_options.initial_state && this.init_options.initial_state.channel_slug)
        this.display_channel_by_slug(this.init_options.initial_state.channel_slug);
    else
        this.display_channel(this.current_channel_oid);
};

MSBrowserChannels.prototype.set_order = function (order) {
    this.order = order ? order : "default";
    this.refresh_display(true);
};
MSBrowserChannels.prototype.display_channel_by_slug = function (slug) {
    var obj = this;
    this.browser.get_info_for_slug(slug, false, true, function (response) {
        if (!response.success)
            obj._on_channel_error(response);
        else
            obj.display_channel(response.info.oid);
    });
};
MSBrowserChannels.prototype.display_channel = function (oid) {
    this.current_channel_oid = oid;
    this.browser.box_hide_info();

    if (!this.initialized)
        return;
    this.browser.display_loading();
    this.tree_manager.set_active(oid);
    if (oid != "0") {
        var obj = this;
        this.browser.get_info_for_oid(oid, true, function (response) {
            obj._on_channel_info(response, oid);
        });
    }
    else
        this._on_channel_info(null, oid);
};

MSBrowserChannels.prototype._on_channel_error = function (response) {
    this.last_response = null;

    var message;
    if (!this.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.browser.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message = "<div>"+response.error+"<p>"+utils.translate("Please login to access this channel")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p></div>";
    }
    else
        message = "<div class=\"error\">"+response.error+"</div>";
    this.$content.html(message);
};

MSBrowserChannels.prototype._on_channel_info = function (response_info, oid) {
    if (this.current_channel_oid != oid) {
        this.browser.hide_loading();
        return;
    }
    if (response_info && !response_info.success)
        return this._on_channel_error(response_info);

    var data = {};
    if (oid && oid != "0")
        data.parent_oid = oid;
    if (this.browser.parent_selection_oid)
        data.parent_selection_oid = this.browser.parent_selection_oid;
    if (this.browser.displayable_content)
        data.content = this.browser.displayable_content;
    if (this.browser.filter_editable !== null)
        data.editable = this.browser.filter_editable ? "yes" : "no";
    if (this.browser.filter_validated !== null)
        data.validated = this.browser.filter_validated ? "yes" : "no";
    if (this.browser.filter_no_categories) {
        data.no_categories = true;
    } else {
        if (this.browser.filter_categories.length > 0)
            data.categories = this.browser.filter_categories;
    }
    data.order_by = this.order;
    var obj = this;
    MSAPI.ajax_call("get_channels_content", data, function (response) {
        // Merge response
        if (response_info) {
            if (response_info.info)
                response.info = response_info.info;
            if (response_info.parent_selectable)
                response.parent_selectable = response_info.parent_selectable;
            if (response_info.selectable)
                response.selectable = response_info.selectable;
        }
        obj._on_channel_content(response, oid);
    });
};

MSBrowserChannels.prototype._on_channel_content = function (response, oid) {
    this.browser.hide_loading();
    if (this.current_channel_oid != oid)
        return;
    if (!response.success)
        return this._on_channel_error(response);

    this.last_response = response;

    if (!this.use_overlay && this.display_mode == "thumbnail")
        this.browser.box_hide_info();

    this.$content.html("");
    if (oid != "0") {
        // parent channel link
        var parent_oid = (this.browser.catalog[oid] && this.browser.catalog[oid].parent_oid) ? this.browser.catalog[oid].parent_oid : "0";
        var parent_title = (parent_oid && this.browser.catalog[parent_oid]) ? this.browser.catalog[parent_oid].title : utils.translate("Parent channel");
        this.$content.append(this.browser.get_content_entry("parent", {
            oid: parent_oid,
            title: parent_title,
            extra_class: "item-entry-small",
            selectable: !this.browser.parent_selection_oid || response.parent_selectable,
            slug: response.info.parent_slug
        }, parent_oid != "0" && this.browser.selectable_content.indexOf("c") != -1, "channels"));
        // current channel link
        var current_info = response.info;
        current_info.oid = oid;
        current_info.extra_class = "item-entry-small";
        current_info.selectable = !this.browser.parent_selection_oid || response.selectable;
        this.$content.append(this.browser.get_content_entry("current", current_info, this.browser.selectable_content.indexOf("c") != -1, "channels"));
    }
    // channel's custom CSS
    if (!this.browser.use_overlay) {
        $("head .csslistlink").remove();
        if (response.info) {
            var csslinks = "";
            for (var index in response.info.css_list) {
                csslinks += "<link class=\"csslistlink\" rel=\"stylesheet\" type=\"text/css\" href=\""+response.info.css_list[index]+"\"/>";
            }
            $("head").append(csslinks);
        }
        if (response.info && response.info.logo_url)
            $("#mainlogo .header-logo").attr("src", response.info.logo_url);
        else
            $("#mainlogo .header-logo").attr("src", this.default_logo_src);
        if (response.info && response.info.favicon_url)
            $("#favicon_link").attr("href", response.info.favicon_url);
        else
            $("#favicon_link").attr("href", this.default_fav_src);
    }

    var nb_channels = response.channels ? response.channels.length : 0;
    var nb_videos = response.videos ? response.videos.length : 0;
    var nb_live_streams = response.live_streams ? response.live_streams.length : 0;
    var nb_photos_groups = response.photos_groups ? response.photos_groups.length : 0;
    var has_items = nb_channels > 0 || nb_videos > 0 || nb_live_streams > 0 || nb_photos_groups > 0;
    // channel display
    if (has_items)
        this.browser.display_content(this.$content, response, oid, "channels");
    else {
        if (this.browser.selectable_content.indexOf("c") != -1) {
            if (this.browser.displayable_content.length > 1)
                this.$content.append("<div class=\"info\">"+utils.translate("This channel contains no sub channels and no medias.")+"</div>");
            else
                this.$content.append("<div class=\"info\">"+utils.translate("This channel contains no sub channels.")+"</div>");
        }
        else
            this.$content.append("<div class=\"info\">"+utils.translate("This channel contains no media.")+"</div>");
    }
};

MSBrowserChannels.prototype.refresh_display = function (reset) {
    if (reset && this.last_response)
        this.last_response = null;
    if (this.last_response)
        this._on_channel_content(this.last_response, this.current_channel_oid);
    else
        this.display_channel(this.current_channel_oid);
};
