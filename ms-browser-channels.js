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
    html += "<div id=\"ms_browser_channels_menu\" style=\"display: none;\">";
    html += "</div>";
    this.$menu = $(html);
    return this.$menu;
};
MSBrowserChannels.prototype.get_content_jq = function () {
    var html = "";
    html += "<div id=\"ms_browser_channels\" class=\"ms-browser-content\" style=\"display: none;\">";
    html +=     "<div class=\"ms-browser-tree-place ms-channels-tree\">";
    html +=         "<div><i class=\"fa fa-spinner fa-spin\"></i> "+utils.translate("Loading...")+"</div>";
    html +=     "</div>";
    html +=     "<div class=\"ms-browser-channels-place\">";
    html +=         "<div class=\"messages\"><div class=\"message info\">"+utils.translate("Select a channel to display its content.")+"</div></div>";
    html +=     "</div>";
    html += "</div>";
    this.$content = $(html);
    this.$place = $(".ms-browser-channels-place", this.$content);
    return this.$content;
};

MSBrowserChannels.prototype.refresh_title = function () {
    var item = this.last_response ? this.last_response.info : undefined;
    if (item && item.oid != "0") {
        var html = "<span class=\"item-entry-preview\"><img src=\""+item.thumb+"\"/></span> "+utils.escape_html(item.title);
        if (this.browser.current_selection && this.browser.current_selection.oid == item.oid)
            html = "<span class=\"selected\">"+html+"</span>";
        this.browser.set_title(item.title, html);
    } else if (this.browser.lti_mode) {
        this.browser.set_title(utils.translate("My channel"));
    } else {
        this.browser.set_title(utils.translate("Main channels"));
    }
};

MSBrowserChannels.prototype.on_show = function () {
    this.refresh_title();
    if (this.initialized)
        return;
    this.initialized = true;

    this.default_logo_src = $("#mainlogo .header-logo").attr("src");
    this.default_fav_src = $("#").attr("src");

    // tree manager
    var obj = this;
    if (this.browser.tree_manager) {
        var params = {
            $place: $(".ms-browser-tree-place", this.$content),
            display_root: this.browser.displayable_content.indexOf("c") != -1,
            display_personal: true,
            current_channel_oid: this.current_channel_oid,
            on_data_retrieved: function (data) { obj.browser.update_catalog(data); }
        };
        if (this.browser.use_overlay) {
            params.on_change = function (oid) {
                obj.display_channel(oid);
            };
        }
        this.tree_manager = new MSTreeManager(params);
    }

    // load first channel
    if (this.init_options.initial_state && this.init_options.initial_state.channel_slug) {
        this.display_channel_by_slug(this.init_options.initial_state.channel_slug);
    } else if (this.browser.lti_mode) {
        this.display_personal_channel();
    } else {
        this.display_channel(this.current_channel_oid);
    }
};

MSBrowserChannels.prototype.set_order = function (order) {
    this.order = order ? order : "default";
    this.refresh_display(true);
};
MSBrowserChannels.prototype.display_personal_channel = function () {
    var obj = this;
    if (!this.personal_channel_oid) {
        MSAPI.ajax_call("get_channels_personal", {}, function (response) {
            if (response.success) {
                obj.personal_channel_oid = response.oid;
                obj.display_channel(response.oid);
            } else if (response.error_code == 403) {
                obj._on_channel_error({ error: utils.translate("You are not allowed to have a personnal channel.") });
            } else {
                obj._on_channel_error(response);
            }
        });
    } else {
        obj.display_channel(this.personal_channel_oid);
    }
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
    if (this.tree_manager)
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
MSBrowserChannels.prototype.display_parent = function () {
    if (!this.current_channel_oid)
        return;
    var oid = this.current_channel_oid;
    var parent_oid = (this.browser.catalog[oid] && this.browser.catalog[oid].parent_oid) ? this.browser.catalog[oid].parent_oid : "0";
    this.display_channel(parent_oid);
};

MSBrowserChannels.prototype._on_channel_error = function (response) {
    this.last_response = null;

    var message = "<div class=\"messages\">";
    if (!this.browser.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.browser.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message += "<div class=\"item-description\">";
        message += "<div class=\"message error\">"+response.error+"</div>";
        message += "<p>"+utils.translate("Please login to access this channel")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p>";
        message += "</div>";
    } else {
        message += "<div class=\"message error\">"+response.error+"</div>";
    }
    message += "</div>";
    this.$place.html(message);
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
    if (!this.browser.lti_mode && this.browser.filter_speaker !== null)
        data.speaker = this.browser.filter_speaker;
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

    if (!this.browser.use_overlay && this.display_mode == "thumbnail")
        this.browser.box_hide_info();

    // update top bar
    this.$menu.html("");
    var $entry_links;
    if (oid != "0") {
        // back to parent button
        if (!this.browser.lti_mode || oid != this.personal_channel_oid) {
            var parent_oid = (this.browser.catalog[oid] && this.browser.catalog[oid].parent_oid) ? this.browser.catalog[oid].parent_oid : "0";
            var parent_title = (parent_oid && this.browser.catalog[parent_oid]) ? this.browser.catalog[parent_oid].title : utils.translate("Parent channel");
            var parent = {
                oid: parent_oid,
                title: parent_title,
                slug: response.info.parent_slug,
            };
            var $back;
            if (!this.browser.use_overlay) {
                $back = $("<a class=\"button "+this.browser.btn_class+"\" href=\""+this.browser.get_button_link(parent, "view")+"\"></a>");
            } else {
                $back = $("<button type=\"button\" class=\"button "+this.browser.btn_class+"\"></button>");
                $back.click({ obj: this, oid: parent.oid }, function (event) {
                    event.data.obj.display_channel(event.data.oid);
                });
            }
            if (!this.browser.use_overlay && $(".navbar .back.button-text").length > 0) {
                $back.html("<i class=\"fa fa-chevron-circle-left fa-fw fa-2x\" aria-hidden=\"true\"></i>");
                $back.attr("title", utils.translate("Parent channel"));
                $back.addClass("back").addClass("button-text");
                $(".navbar .back.button-text").replaceWith($back);
            } else {
                $back.html("<i class=\"fa fa-chevron-circle-left\" aria-hidden=\"true\"></i> <span class=\"hidden-below-800\">"+utils.translate("Parent channel")+"</span>");
                this.$menu.append($back);
            }
        }
        // current channel buttons
        var current_selectable = this.browser.selectable_content.indexOf("c") != -1 && (!this.browser.parent_selection_oid || response.selectable);
        $entry_links = this.browser.get_entry_links(response.info, "current", current_selectable);
    } else {
        response.oid = "0";
        $entry_links = this.browser.get_entry_links(response, "current", false);
        if (!this.browser.use_overlay && $(".navbar .back.button-text").length > 0)
            $(".navbar .back.button-text").attr("href", "..");
    }
    if ($entry_links)
        this.$menu.append($entry_links);

    // update list place
    this.$place.html("");
    if (this.browser.use_overlay) {
        this.$place.scrollTop(0);
    } else {
        // current Channel data
        if (oid != "0") {
            var $current_item_desc = $("<div class=\"item-description\"></div>");
            if (response.info.short_description) {
                var $desc = $("<div class=\"channel-description-text\">" + response.info.short_description + "</div>");
                if (response.info.short_description != response.info.description) {
                    $desc.addClass("short-desc");
                    $desc.click({ description: response.info.description }, function (event) {
                        $(this).html(event.data.description).unbind("click").removeClass("short-desc");
                    });
                }
                $current_item_desc.append($desc);
            }
            if (response.info.views || response.info.comments) {
                var anno_and_views = "<div class=\"right channel-description-stats\">";
                if (response.info.views) {
                    anno_and_views += "<span class=\"inline-block\">" + response.info.views + " " + utils.translate("views");
                    if (response.info.views_last_month)
                        anno_and_views += ", " + response.info.views_last_month + " " + utils.translate("this month");
                    anno_and_views += "</span>";
                }
                if (response.info.comments) {
                    anno_and_views += " <span class=\"inline-block\">" + response.info.comments + " " + utils.translate("annotations");
                    if (response.info.comments_last_month)
                        anno_and_views += ", " + response.info.comments_last_month + " " + utils.translate("this month");
                    anno_and_views += "</span>";
                }
                anno_and_views += "</div>";
                $current_item_desc.append(anno_and_views);
            }
            var rss = "<div id=\"channel_description_rss\" class=\"channel-description-rss\"> ";
            if (this.display_itunes_rss) {
                rss += " <span class=\"inline-block\">" + utils.translate("Subscribe to channel's videos RSS:") + "</span>";
                rss += " <a class=\"nowrap\" href=\"/channels/" + response.info.oid + "/rss.xml\">";
                rss +=     "<i class=\"fa fa-rss\"></i> " + utils.translate("standard") + "</a>";
                rss += " <a class=\"nowrap\" href=\"/channels/" + response.info.oid + "/itunes-video.xml\">";
                rss +=     "<i class=\"fa fa-apple\"></i> " + utils.translate("iTunes") + "</a>";
                rss += " <a class=\"nowrap\" href=\"/channels/" + response.info.oid + "/itunes-audio.xml\">";
                rss +=     "<i class=\"fa fa-apple\"></i> " + utils.translate("iTunes (audio only)") + "</a>";
            } else {
                rss += " <a class=\"nowrap\" href=\"/channels/" + response.info.oid + "/rss.xml\">";
                rss +=     "<i class=\"fa fa-rss\"></i> " + utils.translate("Subscribe to channel's videos RSS") + "</a>";
            }
            rss += "</div>";
            $current_item_desc.append(rss);
            this.$place.append($current_item_desc);
        }
        // channel's custom CSS
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
    this.refresh_title();
    if (has_items)
        this.browser.display_content(this.$place, response, oid, "channels");
    else {
        var msg;
        if (this.browser.selectable_content.indexOf("c") != -1) {
            if (this.browser.displayable_content.length > 1)
                msg = "This channel contains no sub channels and no medias.";
            else
                msg = "This channel contains no sub channels.";
        }
        else
            msg = "This channel contains no media.";
        msg = utils.translate(msg) + "<br/>";
        msg += utils.translate("Some contents may still exist in this channel but if it is the case your account is not allowed to see them.");
        this.$place.append("<div class=\"messages\"><div class=\"message info\">"+msg+"</div></div>");
    }
};

MSBrowserChannels.prototype.refresh_display = function (reset) {
    if (reset && this.last_response)
        this.last_response = null;
    if (this.last_response)
        this._on_channel_content(this.last_response, this.current_channel_oid);
    else if (this.browser.lti_mode)
        this.display_personal_channel();
    else
        this.display_channel(this.current_channel_oid);
};
