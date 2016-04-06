/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals MSAPI, utils, OverlayDisplayManager, MSBrowserChannels, MSBrowserSearch, MSBrowserLatest */

function MSBrowser(options) {
    // params
    this.title = "";
    this.place = null;
    this.selectable_content = "cvlp"; // v for videos, l for lives, p for photos group and c for channels
    this.displayable_content = "cvlp";
    this.filter_validated = null;
    this.parent_selection_oid = null; // special for channel parent selection
    this.initial_oid = null;
    this.initial_state = null;
    this.on_pick = null;
    this.btn_class = "std-btn";
    // vars
    this.use_overlay = true;
    this.$widget = null;
    this.$menu = null;
    this.$main = null;

    this.catalog = {};
    this.tree_manager = null;
    this.displayed = "channels";
    this.current_selection = null;

    this.url_login = "/login/";
    this.url_channels = "/channels/";
    this.url_search = "/search/";
    this.url_latest = "/latest/";

    this.display_mode = "list";
    utils.setup_class(this, options, [
        // allowed options
        "title",
        "place",
        "selectable_content",
        "displayable_content",
        "filter_validated",
        "parent_selection_oid",
        "initial_oid",
        "initial_state",
        "on_pick",
        "btn_class"
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
        this.display_mode = "thumbnail";
        if (!this.use_overlay)
            $("html").addClass("wide").removeClass("wide-1200");
    }

    // get elements
    this.init_options.browser = this;
    this.channels = new MSBrowserChannels(this.init_options);
    this.search = new MSBrowserSearch(this.init_options);
    this.latest = new MSBrowserLatest(this.init_options);

    this.build_widget();

    if (this.initial_state && this.initial_state.tab)
        this.change_tab(this.initial_state.tab, true);
    else
        this.change_tab("channels", true);

    //if (this.initial_oid)
    //    this.pick(this.initial_oid);

    var obj = this;
    if (!this.use_overlay) {
        /*
        var $messages = $(".messages-block").detach(); // move messages
        var messages_place = "channels";
        if ($messages.length > 0) {
            // FIXME: if the channel takes too much time to load, the message will not appear
            setTimeout(function () {
                $("div", $messages).each(function () {
                    var lvl = $(this).hasClass("success") ? "success" : "error";
                    obj.display_message(messages_place, $(this).html(), lvl);
                });
            }, 500);
        }
        */
        window.onpopstate = function (event) {
            if (event.state && event.state.ms_tab) {
                if (event.state.ms_tab == "search")
                    obj.search.on_url_change();
                obj.change_tab(event.state.ms_tab, true);
            } else if (event.target.location.pathname) {
                if (event.target.location.pathname == obj.url_channels) {
                    obj.channels.on_hash_change();
                    obj.change_tab("channels", true);
                }
                else if (event.target.location.pathname == obj.url_search)
                    obj.change_tab("search", true);
                else if (event.target.location.pathname == obj.url_latest)
                    obj.change_tab("latest", true);
            }
        };
        $(window).scroll(function () {
            obj.on_scroll();
        });
    }
    else {
        this.overlay = new OverlayDisplayManager();
    }
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
    var request_callback = function (response) {
        if (response.success)
            obj.update_catalog(response.info, full);
        obj.hide_loading();
        callback(response);
    };
    MSAPI.ajax_call(method, data, request_callback, null, null);
};
MSBrowser.prototype.display_content = function ($container, data, cat_oid) {
    var i, selectable, $section;
    if (data.channels && data.channels.length > 0) {
        // sub channels
        selectable = this.selectable_content.indexOf("c") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        if (!cat_oid)
            $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Channels")+"</h3>");
        else
            $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Sub channels")+"</h3>");
        for (i=0; i < data.channels.length; i++) {
            if (data.channels[i].parent_oid === undefined && cat_oid)
                data.channels[i].parent_oid = cat_oid;
            $section.append(this.get_content_entry("channel", data.channels[i], selectable));
        }
        $container.append($section);
    }
    if (data.live_streams && data.live_streams.length > 0) {
        // live streams
        selectable = this.selectable_content.indexOf("l") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Live streams")+"</h3>");
        for (i=0; i < data.live_streams.length; i++) {
            $section.append(this.get_content_entry("live", data.live_streams[i], selectable));
        }
        $container.append($section);
    }
    if (data.videos && data.videos.length > 0) {
        // videos
        selectable = this.selectable_content.indexOf("v") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Videos")+"</h3>");
        for (i=0; i < data.videos.length; i++) {
            $section.append(this.get_content_entry("video", data.videos[i], selectable));
        }
        $container.append($section);
    }
    if (data.photos_groups && data.photos_groups.length > 0) {
        // photos groups
        selectable = this.selectable_content.indexOf("p") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Photos groups")+"</h3>");
        for (i=0; i < data.photos_groups.length; i++) {
            $section.append(this.get_content_entry("photos", data.photos_groups[i], selectable));
        }
        $container.append($section);
    }
};
MSBrowser.prototype.get_content_entry = function (item_type, item, gselectable) {
    this.update_catalog(item);
    var oid = item.oid;
    var selectable = gselectable && (!this.parent_selection_oid || item.selectable);
    var $entry = null;
    if (this.use_overlay && item_type == "parent" && item.oid == "0")
        return $entry;
    $entry = $("<div class=\"item-entry item-type-"+item_type+"\"></div>");
    $entry.attr("id", "item_entry_"+oid+"_"+this.displayed);
    if (item_type != "parent" && item_type != "current")
        $entry.addClass(this.display_mode);
    if (this.current_selection && this.current_selection.oid == oid)
        $entry.addClass("selected");
    if (selectable)
        $entry.addClass("selectable");
    if (item.extra_class)
        $entry.addClass(item.extra_class);
    var html = this._get_entry_block_html(item, item_type, selectable);
    if (this.display_mode == "thumbnail" && !this.use_overlay && item_type != "parent" && item_type != "current") {
        html +=   "<div class=\"obj-block-info\" title=\""+utils.translate("Open information panel")+"\"></div>";
        if (item.can_edit) {
            html +=   "<a class=\"obj-block-edit\" title=\""+utils.translate("Edit")+"\" href=\""+this._get_btn_link(item, "edit")+"\"></a>";
        }
        html += "<div class=\"overlay-info\" id=\"item_entry_"+oid+"_"+this.displayed+"_info\" style=\"display: none;\"></div>";
    }
    var $entry_block = $(html);
    this._set_on_click_entry_block($entry_block, oid, item_type, item, selectable);
    $entry.append($entry_block);
    if (this.display_mode == "thumbnail")
        this._set_thumbnail_info_box_html(item_type, selectable, oid, $entry, item);
    
    html = this._get_entry_links_html(item, item_type, selectable);
    var $entry_links = $(html);
    this._set_on_click_entry_links($entry_links, item, item_type, selectable);
    $entry.append($entry_links);
    
    return $entry;
};
MSBrowser.prototype._get_entry_block_html = function (item, item_type, selectable) {
    var markup = "div";
    var href = "";
    if (!this.use_overlay && item.slug && item_type != "parent" && item_type != "current") {
        markup = "a";
        if (item_type != "channel" && !item.validated && item.can_edit)
            href = "href=\""+this._get_btn_link(item, "edit")+"\"";
        else
            href = "href=\""+this._get_btn_link(item, "view")+"\"";
    }
    var html = "<"+markup+" "+href+"class=\"item-entry-link "+(selectable || item_type == "channel" || item_type == "parent" ? "clickable" : "")+"\">";
    if (this.use_overlay || item_type != "current" || !item.hide_image) {
        if (item.thumb)
            if (this.display_mode == "thumbnail" && !(item_type == "parent" || item_type == "current"))
                html += "<span class=\"item-entry-preview obj-block-link\" style=\"background-image: url("+item.thumb+");\"></span>";
            else
                html += "<span class=\"item-entry-preview\"><img src=\""+item.thumb+"\"/></span>";
        else
            html += "<span class=\"item-entry-preview\"><span class=\"item-"+item_type+"-icon\"></span></span>";
    }
    html +=     "<span class=\"item-entry-content\">";
    html +=         "<span class=\"item-entry-top-bar\">";
    if (item_type == "parent" || item_type == "current" || this.display_mode != "thumbnail") {
        html +=         "<span class=\"item-entry-title\">"+utils.escape_html(item.title)+"</span>";
        if (!this.use_overlay && item_type == "current") {
            if (item.views) {
                html += "<span class=\"item-entry-date\">"+item.views+" "+utils.translate("views");
                if (item.views_last_month)
                    html += ", "+item.views_last_month+" "+utils.translate("this month");
                html += "</span>";
            }
            if (item.comments) {
                html += "<span class=\"item-entry-date\">"+item.comments+" "+utils.translate("annotations");
                if (item.comments_last_month)
                    html += ", "+item.comments_last_month+" "+utils.translate("this month");
                html += "</span>";
            }
        }
    }
    if (!this.use_overlay && item_type == "current" && (item.can_edit || item.can_add_channel || item.can_add_video)) {
        html += "<span class=\"item-entry-links\">";
        if (item.can_edit) {
            html += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-edit-media\" href=\""+this._get_btn_link(item, "edit")+"\"><i class=\"fa fa-pencil\"></i> "+utils.translate("Edit")+"</a>";
            if (item.can_delete)
                html += "<span class=\""+this.btn_class+" item-entry-pick-delete-media\"><i class=\"fa fa-trash\"></i> "+utils.translate("Delete")+"</span>";
        }
        if (item.can_add_channel || item.can_add_video) {
            html += "<br/>";
            if (item.can_add_channel) {
                html += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-add-channel\" href=\""+this._get_btn_link(item, "add_channel")+"\"><i class=\"fa fa-plus\"></i> "+utils.translate("Add a sub channel")+"</a>";
            }
            if (item.can_add_video) {
                html += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-add-video\" href=\""+this._get_btn_link(item, "add_video")+"\"><i class=\"fa fa-plus\"></i> "+utils.translate("Add a video")+"</a>";
            }
        }
        html += "</span>";
    }
    if (item.can_edit && !(item_type == "parent" || item_type == "current")) {
        if (item_type != "channel") {
            if (!item.validated)
                html += "<span class=\"item-entry-notpublished\" title=\""+utils.translate("This media is not published")+"\"></span>";
            else if (item.unlisted)
                html += "<span class=\"item-entry-unlisted\" title=\""+utils.translate("This media is published and unlisted")+"\"></span>";
            else
                html += "<span class=\"item-entry-published\" title=\""+utils.translate("This media is published")+"\"></span>";
        }
        else if (item.unlisted)
            html +=     "<span class=\"item-entry-unlisted\" title=\""+utils.translate("This channel is unlisted")+"\"></span>";
        if (item_type == "video" && !item.ready)
            html +=     "<span class=\"item-entry-notready\" title=\""+utils.translate("This video is not ready")+"\"></span>";
    }
    if (item.duration)
        html +=         "<span class=\"item-entry-duration\">"+item.duration+"</span>";
    html +=         "</span>";
    html +=         "<span class=\"item-entry-bottom-bar\">";
    if (item.views && !(item_type == "parent" || item_type == "current")) {
        html +=         "<span class=\"item-entry-views\">"+item.views+" "+utils.translate("views");
        if (item.views_last_month)
            html +=          ", "+item.views_last_month+" "+utils.translate("this month");
        html += "</span>";
    }
    if (item_type != "parent" && item_type != "current" && this.display_mode == "thumbnail") 
        html +=         "<span class=\"item-entry-title\">"+utils.escape_html(item.title)+"</span>";
    if (item.show_type)
        html +=         "<span class=\"item-entry-type\">"+utils.translate("Type:")+" "+utils.translate(item_type)+"</span>";
    if (item.creation)
        html +=         "<span class=\"item-entry-date\">"+utils.translate("Created on")+" "+utils.get_date_display(item.creation)+"</span>";
    if (item.show_add_date && item.add_date)
        html +=         "<span class=\"item-entry-date\">"+utils.translate("Added on")+" "+utils.get_date_display(item.add_date)+"</span>";
    if (item.show_parent_title && item.parent_title)
        html +=         "<span class=\"item-entry-parent\">"+utils.translate("Parent channel:")+" "+item.parent_title+"</span>";
    //if (item.matching && this.no_overlay)
      //  html +=         "<span class=\"item-entry-parent\">"+utils.translate("Found in") +": "+item.matching.replace(",", "+")+"</span>";
    html +=         "</span>";
    html +=     "</span>";
    html += "</"+markup+">";
    if(item.annotations && !this.use_overlay && this.displayed == "search") {
        html +=         "<span class=\"item-entry-annotations\"><p>"+utils.translate("Annotations")+":</p><ul>";
        for (var index in item.annotations) {
            var annotation = item.annotations[index];
            html += "<li><a href=\"/videos/"+item.slug+"/#start="+annotation.time +  "&autoplay\">";
            if (annotation.title)
                html += annotation.title;
            html += " ("+annotation.time_display+") ";
            html += "</a></li>";
        }
        html += "</ul></span>";
    }
    if (!this.use_overlay && this.displayed == "channels" && item_type == "current") {
        html += "<div class=\"channel-description-text\">"+item.description+"</div>";
        html += "<div class=\"channel-description-rss\"> ";
        if (this.display_itunes_rss) {
            html += utils.translate("Subscribe to channel's videos RSS:")+"<br/> ";
            html += " <a class=\"nowrap marged\" href=\"/channels/"+item.oid+"/rss.xml\">";
            html +=     "<i class=\"fa fa-rss\"></i> "+utils.translate("standard")+"</a>";
            html += " <a class=\"nowrap marged\" href=\"/channels/"+item.oid+"/itunes-video.xml\">";
            html +=     "<i class=\"fa fa-apple\"></i> "+utils.translate("iTunes")+"</a>";
            html += " <a class=\"nowrap marged\" href=\"/channels/"+item.oid+"/itunes-audio.xml\">";
            html +=     "<i class=\"fa fa-apple\"></i> "+utils.translate("iTunes (audio only)")+"</a>";
        } else {
            html += " <a class=\"nowrap\" href=\"/channels/"+item.oid+"/rss.xml\">";
            html +=     "<i class=\"fa fa-rss\"></i> "+utils.translate("Subscribe to channel's videos RSS")+"</a>";
        }
        html += "</div>";
    }
    return html;
};
MSBrowser.prototype._set_on_click_entry_block = function ($entry_block, oid, item_type, item, selectable) {
    if (this.use_overlay) {
        if (item_type == "channel" || item_type == "parent") {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.channels.display_channel(event.data.oid);
                event.data.obj.tree_manager.expand_tree(event.data.oid);
            });
        } else if (selectable) {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.pick(event.data.oid);
            });
        }
    }
    else if (!this.use_overlay && item.can_delete) {
        $(".item-entry-pick-delete-media", $entry_block).click({ obj: this, oid: oid }, function (event) {
            event.data.obj.pick(event.data.oid, "delete");
        });
    }
};
MSBrowser.prototype._get_entry_links_html = function (item, item_type, selectable) {
    var html = "<div class=\"item-entry-links\">";
    var url_view = this.use_overlay ? "" : this._get_btn_link(item, "view");
    if ((item_type == "channel" || item_type == "parent")) {
        var txt = utils.translate("Display channel");
        if (item_type == "parent")
            txt = utils.translate("Display parent channel");
        html += "<a class=\""+this.btn_class+" item-entry-display\" href=\""+url_view+"\"><i class=\"fa fa-chevron-right\"></i> "+txt+"</a>";
    }
    if (selectable && this.use_overlay) {
        if (item_type == "channel" || item_type == "parent" || item_type == "current")
            html += "<span class=\""+this.btn_class+" main item-entry-pick\"><i class=\"fa fa-check\"></i> "+utils.translate("Select this channel")+"</span>";
        else
            html += "<span class=\""+this.btn_class+" main item-entry-pick\"><i class=\"fa fa-check\"></i> "+utils.translate("Select this media")+"</span>";
    } else {
        if (item_type != "parent" && item_type != "current" && !this.use_overlay) {
            if (item_type != "channel" && item.validated) {
                html += "<a class=\""+this.btn_class+" item-entry-pick-view-media\" href=\""+url_view+"\"><i class=\"fa fa-chevron-right\"></i> "+utils.translate("See")+"</a>";
            }
            if (item.can_edit) {
                html += "<a class=\""+this.btn_class+" item-entry-pick-edit-media\" href=\""+this._get_btn_link(item, "edit")+"\"><i class=\"fa fa-pencil\"></i> "+utils.translate("Edit") +"</a>";
            }
            if (item.can_delete)
                html += "<span class=\""+this.btn_class+" item-entry-pick-delete-media\"><i class=\"fa fa-trash\"></i> "+utils.translate("Delete")+"</span>";
        }
    }
    html += "</div>";
    return html;
};
MSBrowser.prototype._get_btn_link = function (item, action) {
    var type = "";
    var prefix = "";
    if (item && item.oid) {
        type = item.oid[0];
    }
    if (!type || type === "" || type === "0") {
        if (!item || item.oid == "0")
            return "/channels/#";
    }
    if (action == "view") {
        if (type == "c") {
            prefix = "/channels/#";
        } else if (type == "l") {
            prefix = "/lives/";
        } else if (type == "v") {
            prefix = "/videos/";
        } else if (type == "p") {
            prefix = "/photos/";
        }
        if (prefix && !item.slug) {
            this.get_info_for_oid(item.oid, false, function (data) {
                item = data.info;
            }); 
        }
        if (prefix && item.slug)
            return prefix + item.slug;
        else
            return "";
    } else if (action == "edit") {
        return "/edit/"+item.oid+"/";
    } else if (action == "add_channel") {
        return "/add-content/channel/?in="+item.oid;
    } else if (action == "add_video") {
        return "/add-content/?in="+item.oid+"#add_video";
    }
    return "";
};
MSBrowser.prototype._set_on_click_entry_links = function ($entry_links, item, item_type, selectable) {
    if (item_type == "channel" || item_type == "parent") {
        $(".item-entry-display", $entry_links).click({ obj: this, item: item }, function (event) {
            if (event.data.obj.use_overlay)
                event.data.obj.channels.display_channel(event.data.item.oid);
        });
    }
    if (selectable) {
        $(".item-entry-pick", $entry_links).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid);
        });
    }
    if (!this.use_overlay && item.can_delete) {
        $(".item-entry-pick-delete-media", $entry_links).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid, "delete");
        });
    }
};
MSBrowser.prototype._get_thumbnail_info_box_html = function (item, item_type, selectable) {
    var html = "<div class=\"overlay-info-title\">";
    html += "<button type=\"button\" class=\"overlay-info-close "+this.btn_class+"\" title=\""+utils.translate("Hide this window")+"\"><i class=\"fa fa-close\"></i></button>";
    html += "<h3><a href=\""+this._get_btn_link(item, "view")+"\">"+item.title+"</a></h3>";
    html += "</div>";
    html += "<div class=\"overlay-info-content\">";
    if (!this.use_overlay && this.displayed == "search" && item.annotations) {
        html += "<div><b>"+utils.translate("Matching annotations:")+"</b></div>";
        html += "<ul>";
        for (var index in item.annotations) {
            var annotation = item.annotations[index];
            html += "<li><a href=\"/videos/"+item.slug+"/#start="+annotation.time +  "&autoplay\">";
            if (annotation.title)
                html += annotation.title;
            else
                html += annotation.time_display;
            html += "</a></li>";
        }
        html += "</ul>";
        html += "<hr/>";
    }
    html += "<table class=\"overlay-info-table\">";
    if (item.creation && item_type == "video") {
        html += "<tr>";
        html +=     "<td class=\"overlay-info-label\">"+utils.translate("Recording date")+" :</td>";
        html +=     "<td>"+utils.get_date_display(item.creation)+"</td>";
        html += "</tr>";
    }
    if (item.add_date) {
        html += "<tr>";
        html +=     "<td class=\"overlay-info-label\">"+utils.translate("Publishing date")+" :</td>";
        html +=     "<td>"+utils.get_date_display(item.add_date)+"</td>";
        html += "</tr>";
    }
    if (item.duration) {
        html += "<tr>";
        html +=     "<td class=\"overlay-info-label\">"+utils.translate("Duration")+" :</td>";
        html +=     "<td>"+item.duration+"</td>";
        html += "</tr>";
    }
    if (item.views_last_month)
        html +=         "<tr><td class=\"overlay-info-label\">"+utils.translate("Views last month")+" :</td><td>"+item.views_last_month+"</td></tr>";
    if (item.views)
        html +=         "<tr><td class=\"overlay-info-label\">"+utils.translate("Views")+" :</td><td>"+item.views+"</td></tr>";
    if (item.comments_last_month)
        html +=         "<tr><td class=\"overlay-info-label\">"+utils.translate("Annotations last month")+" :</td><td>"+item.comments_last_month+"</td></tr>";
    if (item.comments)
        html +=         "<tr><td class=\"overlay-info-label\">"+utils.translate("Annotations")+" :</td><td>"+item.comments+"</td></tr>";
    html += "</table>";
    if (item.short_description) {
        html += "<hr/>";
        html += "<div class=\"float-container\">"+item.short_description+"</div>";
    }
    html += "<div>";
    html += this._get_entry_links_html(item, item_type, selectable);
    html += "</div>";
    html += "</div>";
    var $info = $(html);
    $(".overlay-info-close", $info).click({ obj: this }, function (event) {
        event.data.obj.box_hide_info();
    });
    this._set_on_click_entry_links($info, item, item_type, selectable);
    return $info;
};
MSBrowser.prototype._set_thumbnail_info_box_html = function (item_type, selectable, oid, $entry, item) {
    $(".obj-block-info", $entry).click({ obj: this, $entry: $entry }, function (event) {
        var info_id = "#"+$entry.attr("id")+"_info";
        if ($(info_id, event.data.$entry).html() !== "") {
            event.data.obj.box_open_info($entry);
            return;
        }
        if (event.data.obj.displayed == "search") {
            var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable);
            $(info_id, event.data.$entry).append($element);
            event.data.obj.box_open_info($entry);
        } else {
            event.data.obj.get_info_for_oid(oid, true, function (data) {
                var item = data.info;
                var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable);
                $(info_id, event.data.$entry).append($element);
                event.data.obj.box_open_info($entry);
            });
        }
    });
};
MSBrowser.prototype.pick = function (oid, action) {
    if (oid === null || oid === undefined) {
        // deselect
        if (this.current_selection && this.current_selection.oid)
            $("#item_entry_"+this.current_selection.oid+"_"+this.displayed, this.$main).removeClass("selected");
        return;
    }
    if (this.catalog[oid] && this.catalog[oid].is_full) {
        this._pick(oid, { success: true, info: this.catalog[oid] }, true, action);
        return;
    }
    // load info if no info are available
    var obj = this;
    this.get_info_for_oid(oid, true, function (result) {
        obj._pick(oid, result, false, action);
    });
};
MSBrowser.prototype._pick = function (oid, result, no_update, action) {
    if (result.success) {
        if (this.use_overlay)
            this.overlay.hide();
        // change current selection
        if (this.current_selection && this.current_selection.oid)
            $("#item_entry_"+this.current_selection.oid+"_"+this.displayed, this.$main).removeClass("selected");
        this.current_selection = this.catalog[oid];
        $("#item_entry_"+oid+"_"+this.displayed, this.$main).addClass("selected");
        if (this.on_pick) {
            if (!this.use_overlay) {
                if (action == "delete" && window.delete_form_manager)
                    window.delete_form_manager.show(oid, this.catalog[oid].title);
            } else {
                this.on_pick(this.catalog[oid]);
            }
        }
        // select and open channel
        if (oid.indexOf("c") === 0 || !isNaN(parseInt(oid, 10)))
            this.current_channel_oid = oid;
        else
            this.current_channel_oid = result.info.parent_oid;
        if (this.tree_manager && this.current_channel_oid) {
            this.tree_manager.set_active(oid);
            this.tree_manager.expand_tree(this.current_channel_oid);
        }
    }
    else {
        // this should never happen
        console.log("Unable to get info about initial selection:"+result.error);
    }
};
MSBrowser.prototype.get_last_pick = function () {
    return this.current_selection;
};


MSBrowser.prototype.box_open_info = function ($entry) {
    this.box_hide_info();
    var info_id = "#"+$entry.attr("id")+"_info";
    var $info_box = $(info_id);
    if (!$info_box.hasClass("moved"))
        // move box in body if not already done
        $info_box.addClass("moved").detach().appendTo("body");
    if (!$info_box.is(":visible")) {
        var block = $(".obj-block-link", $entry);
        var top = parseInt(block.offset().top, 10) - 1;
        var left = (parseInt(block.offset().left, 10) + block.width());
        var right = "auto";
        if (($(window).width() / 2.0) - left < 0) {
            left = "auto";
            right = $(window).width() - parseInt(block.offset().left, 10);
        }
        $info_box.css("left", left + "px");
        $info_box.css("right", right + "px");
        $info_box.css("top", top + "px");
        $(".obj-block-info", $entry).addClass("info-displayed");
        $info_box.fadeIn("fast");

        if (this.box_click_handler)
            $(document).unbind("click", this.box_click_handler);
        var obj = this;
        this.box_click_handler = function (event) {
            if(!$(event.target).closest(info_id).length && !$(event.target).closest(".obj-block-info").length && $(info_id).is(":visible"))
                obj.box_hide_info();
        };
        $(document).click(this.box_click_handler);
    }
};
MSBrowser.prototype.box_hide_info = function () {
    $(".overlay-info:visible").fadeOut("fast");
    $(".obj-block-info.info-displayed").removeClass("info-displayed");
};

/* events handlers */
MSBrowser.prototype.on_resize = function () {
    if (this.use_overlay) {
        var width = $(window).width() - 100;
        if (width < 900)
            width = 900;
        else if (width > 1200)
            width = 1200;
        this.$widget.width(width);
        var height = $(window).height() - 100;
        this.$widget.height(height);
    }
    else {
        var max_height = $(window).height() - 120;
        if (max_height < 100)
            max_height = 100;
        $(".ms-browser .ms-browser-menu .ms-browser-panel .ms-browser-block").css("max-height", max_height+"px");
    }
};
MSBrowser.prototype.on_scroll = function () {
    var scroll_top = $(window).scrollTop();
    if (!this.$cb_left || !this.$cb_left.length)
        this.$cb_left = $(".ms-browser-menu");

    if (!this.left_menu_offset) {
        this.left_menu_offset = $(".ms-browser-menu").offset().top - 12;
    }
    if (scroll_top > this.left_menu_offset) {
        if ($(".ms-browser-main .ms-browser-block:visible").height() > $(".ms-browser-block", this.$cb_left).height() && !this.$cb_left.hasClass("fixed"))
            this.$cb_left.addClass("fixed");
    }
    else if (this.$cb_left.hasClass("fixed"))
        this.$cb_left.removeClass("fixed");
};