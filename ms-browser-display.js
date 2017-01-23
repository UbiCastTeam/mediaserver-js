/*******************************************
* MediaServer - MediaServer browser        *
* MSBrowser class extension                *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals MSBrowser, utils */

MSBrowser.prototype.build_widget = function () {
    // build widget structure
    var html = "<div class=\"ms-browser "+(this.use_overlay ? "in-overlay" : "")+"\">";
    html += "<div class=\"ms-browser-menu\">";
    html +=     "<div class=\"ms-browser-panel\">";
    html +=         "<div class=\"ms-browser-header\">";
    if (!this.use_overlay) {
        html += "<a id=\"ms_browser_channels_tab\" class=\"ms-browser-tab\" href=\""+this.url_channels+"\">"+utils.translate("Channels")+"</a>";
        html += "<a id=\"ms_browser_search_tab\" class=\"ms-browser-tab\" href=\""+this.url_search+"\">"+utils.translate("Search")+"</a>";
        html += "<a id=\"ms_browser_latest_tab\" class=\"ms-browser-tab\" href=\""+this.url_latest+"\">"+utils.translate("Latest content")+"</a>";
    }
    else {
        html += "<button type=\"button\" id=\"ms_browser_channels_tab\" class=\"ms-browser-tab\">"+utils.translate("Channels")+"</button>";
        html += "<button type=\"button\" id=\"ms_browser_search_tab\" class=\"ms-browser-tab\">"+utils.translate("Search")+"</button>";
        html += "<button type=\"button\" id=\"ms_browser_latest_tab\" class=\"ms-browser-tab\">"+utils.translate("Latest content")+"</button>";
    }
    html +=         "</div>";
    html +=     "</div>";
    html += "</div>";
    html += "<div class=\"ms-browser-main ms-items\">";
    html +=     "<div class=\"ms-browser-panel\">";
    html +=         "<div class=\"ms-browser-clear\"></div>";
    html +=         "<div class=\"ms-browser-loading\"><div><i class=\"fa fa-spinner fa-spin\"></i> "+utils.translate("Loading...")+"</div></div>";
    html +=         "<div class=\"ms-browser-message\"><div></div></div>";
    html +=     "</div>";
    html += "</div>";
    html += "</div>";
    this.$widget = $(html);
    this.$menu = $(".ms-browser-menu", this.$widget);
    this.$main = $(".ms-browser-main", this.$widget);
    var $menu_place = $(".ms-browser-panel", this.$menu);
    $menu_place.append(this.channels.get_menu_jq());
    $menu_place.append(this.latest.get_menu_jq());
    var $content_place = $(".ms-browser-panel", this.$main);
    if (this.use_overlay) {
        $menu_place.append(this.search.get_menu_jq());
        $content_place.prepend(this.get_top_menu_jq());
    } else {
        $("#commands_place").append(this.search.get_menu_jq());
        $("nav .buttons-left").append(this.get_top_menu_jq());
    }
    $content_place.prepend(this.latest.get_content_jq());
    $content_place.prepend(this.search.get_content_jq());
    $content_place.prepend(this.channels.get_content_jq());

    // get initial media or channel info
    if (this.place)
        $(this.place).html(this.$widget);

    // events
    $("#ms_browser_channels_tab", this.$menu).click({ obj: this }, function (evt) {
        evt.data.obj.change_tab("channels"); return false;
    });
    $("#ms_browser_search_tab", this.$menu).click({ obj: this }, function (evt) {
        evt.data.obj.change_tab("search"); return false;
    });
    $("#ms_browser_latest_tab", this.$menu).click({ obj: this }, function (evt) {
        evt.data.obj.change_tab("latest"); return false;
    });
};
MSBrowser.prototype.get_top_menu_jq = function () {
    var sorting_values = [
        { "default": utils.translate("Use channel's default sorting") },
        { "creation_date-desc": utils.translate("Creation date, descending") },
        { "creation_date-asc": utils.translate("Creation date, ascending") },
        { "add_date-desc": utils.translate("Add date, descending") },
        { "add_date-asc": utils.translate("Add date, ascending") },
        { "title-desc": utils.translate("Title, descending") },
        { "title-asc": utils.translate("Title, ascending") },
        { "comments-desc": utils.translate("Number of annotations, descending") },
        { "comments-asc": utils.translate("Number of annotations, ascending") },
        { "views-desc": utils.translate("Number of views, descending") },
        { "views-asc": utils.translate("Number of views, ascending") }
    ];
    var html = "<div class=\"ms-browser-top-btns\">";
    html += "<button type=\"button\" id=\"ms_browser_display_btn\" class=\"ms-browser-top-btn "+this.btn_class+"\">"+utils.translate("Display")+"</button>";

    html += "<div id=\"ms_browser_display_menu\" class=\"ms-browser-top-menu\">";
    // display mode
    html += "<div><b class=\"ms-browser-top-menu-title\">"+utils.translate("Display mode:")+"</b><br/>";
    html += "<button type=\"button\" class=\"button "+(this.display_mode == "list" ? "active" : "")+"\" id=\"ms_browser_display_as_list\">"+utils.translate("list")+"</button>";
    html += "<button type=\"button\" class=\"button "+(this.display_mode == "thumbnail" ? "active" : "")+"\" id=\"ms_browser_display_as_thumbnails\">"+utils.translate("thumbnails")+"</button></div>";
    // channel sorting
    html += "<div class=\"ms-browser-channel-order\"><label class=\"ms-browser-top-menu-title\" for=\"ms_browser_order_channel\">"+utils.translate("Sort by:")+"</label><br/>";
    html += " <select id=\"ms_browser_order_channel\">";
    for (var index in sorting_values)
        for (var key in sorting_values[index])
        html +=     "<option value=\""+key+"\">"+sorting_values[index][key]+"</option>";
    html += "</select></div>";
    // filters
    var opt_html = "<option value=\"\">"+utils.translate("unspecified")+"</option>";
    opt_html += "<option value=\"yes\">"+utils.translate("yes")+"</option>";
    opt_html += "<option value=\"no\">"+utils.translate("no")+"</option>";
    html += "<div class=\"ms-browser-filters\"><b class=\"ms-browser-top-menu-title\">"+utils.translate("Filters:")+"</b><br/>";
    html += " <label for=\"ms_browser_filter_editable\">"+utils.translate("Editable:")+"</label>";
    html += " <select id=\"ms_browser_filter_editable\">"+opt_html+"</select>";
    if (this.displayable_content.length > 1 || this.displayable_content != "c") {
        html += " <br/>";
        html += " <label for=\"ms_browser_filter_validated\">"+utils.translate("Published:")+"</label>";
        html += " <select id=\"ms_browser_filter_validated\">"+opt_html+"</select>";
    }

    html += "</div>";
    // TODO: pagination
    // html += "<div><b class=\"ms-browser-top-menu-title\">"+utils.translate("Number of elements per page:")+"</b><br/>";
    // html += "    <input type=\"number\" class=\"center\" id=\"elements_per_page\" value=\"30\"/>";
    // html += "<button type=\"button\">"+utils.translate("Ok")+"</button></div>";
    html += "</div>";

    html += "</div>";
    this.$top_menu = $(html);
    // events
    $("#ms_browser_display_btn", this.$top_menu).click({ obj: this }, function (evt) {
        evt.data.obj.toggle_menu("display");
    });
    $("#ms_browser_display_as_list", this.$top_menu).click({ obj: this }, function (evt) {
        evt.data.obj.display_as_list();
        evt.data.obj.toggle_menu("display");
    });
    $("#ms_browser_display_as_thumbnails", this.$top_menu).click({ obj: this }, function (evt) {
        evt.data.obj.display_as_thumbnails();
        evt.data.obj.toggle_menu("display");
    });
    $("#ms_browser_order_channel", this.$top_menu).change({ obj: this }, function (evt) {
        evt.data.obj.channels.set_order($(this).val());
        evt.data.obj.toggle_menu("display");
    });
    $(".ms-browser-filters select", this.$top_menu).change({ obj: this }, function (evt) {
        evt.data.obj.toggle_filter($(this));
        evt.data.obj.toggle_menu("display");
    });
    $(document).click({ obj: this }, function (evt) {
        var container = $("#ms_browser_display_menu");
        var button = $("#ms_browser_display_btn");
        if (!container.is(evt.target) && container.has(evt.target).length === 0 &&
            !button.is(evt.target) && button.has(evt.target).length === 0) {
            button.removeClass("active");
            container.removeClass("active");
        }
    });
    return this.$top_menu;
};
MSBrowser.prototype.toggle_menu = function (menu) {
    var $btn, $menu;
    if (menu == "display") {
        $btn = $("#ms_browser_display_btn");
        $menu = $("#ms_browser_display_menu");
    }
    if (!$btn)
        return;
    if ($btn.hasClass("active")) {
        $btn.removeClass("active");
        $menu.removeClass("active");
    } else {
        $(".ms-browser-top-btn.active").removeClass("active");
        $(".ms-browser-top-menu.active").removeClass("active");
        $btn.addClass("active");
        $menu.addClass("active");
    }
};
MSBrowser.prototype.toggle_filter = function ($select) {
    var name = $select.attr("id").substring("ms_browser_".length);
    var value = null;
    switch ($select.val()) {
        case "yes": value = true; break;
        case "no": value = false; break;
        default: break;
    }
    if (name == "filter_editable" || name == "filter_validated") {
        this[name] = value;
        this.channels.refresh_display(true);
        this.search.refresh_display(true);
        this.latest.refresh_display(true);
    }
};
MSBrowser.prototype.display_as_list = function () {
    if ($("#ms_browser_display_as_list", this.$main).hasClass("active"))
        return;
    this.display_mode = "list";
    $("#ms_browser_display_as_thumbnails", this.$main).removeClass("active");
    $("#ms_browser_display_as_list", this.$main).addClass("active");
    if (!this.use_overlay)
        $("#global").addClass("wide-1280").removeClass("wide");
    utils.set_cookie("catalog-display_mode", this.display_mode);
    $("#ms_browser_display_btn", this.$main).removeClass("active");
    $("#ms_browser_display_menu", this.$main).removeClass("active");
    this.channels.refresh_display();
    this.search.refresh_display();
    this.latest.refresh_display();
};
MSBrowser.prototype.display_as_thumbnails = function () {
    if ($("#ms_browser_display_as_thumbnails", this.$main).hasClass("active"))
        return;
    this.display_mode = "thumbnail";
    $("#ms_browser_display_as_list", this.$main).removeClass("active");
    $("#ms_browser_display_as_thumbnails", this.$main).addClass("active");
    if (!this.use_overlay) {
        $("#global").addClass("wide").removeClass("wide-1280");
    }
    utils.set_cookie("catalog-display_mode", this.display_mode);
    $("#ms_browser_display_btn", this.$main).removeClass("active");
    $("#ms_browser_display_menu", this.$main).removeClass("active");
    this.channels.refresh_display();
    this.search.refresh_display();
    this.latest.refresh_display();
};
MSBrowser.prototype.get_active_tab = function () {
    var $active = $(".ms-browser-tab.active", this.$menu);
    var name = $active.length > 0 ? $active.attr("id").replace(/_tab/g, "").replace(/ms_browser_/g, "") : null;
    if (!name && !this.use_overlay) {
        if ($(".ms-browser").hasClass("channels")) {
            name = "channels";
        }
        else if ($(".ms-browser").hasClass("search")) {
            name = "search";
        }
        else if ($(".ms-browser").hasClass("latest")) {
            name = "latest";
        }
    }
    return name;
};
MSBrowser.prototype.change_tab = function (tab, no_pushstate) {
    var previous = this.get_active_tab();
    if (previous == tab)
        return;

    if (previous) {
        $("#ms_browser_"+previous+"_tab", this.$menu).removeClass("active");
        $("#ms_browser_"+previous+"_menu", this.$menu).css("display", "none");
        $("#ms_browser_"+previous, this.$main).css("display", "none");
    }
    $("#ms_browser_"+tab+"_tab", this.$menu).addClass("active");
    $("#ms_browser_"+tab+"_menu", this.$menu).css("display", "block");
    $("#ms_browser_"+tab, this.$main).css("display", "block");

    if (!this.use_overlay) {
        this.$menu.hide();
    }
    if (tab == "latest") {
        $(".ms-browser").removeClass("search").removeClass("channels").addClass("latest");
        this.latest.on_show();
    }
    if (tab == "search") {
        $(".ms-browser").removeClass("latest").removeClass("channels").addClass("search");
        this.$menu.show();
        this.search.on_show();
    }
    if (tab == "channels") {
        $(".ms-browser").removeClass("search").removeClass("latest").addClass("channels");
        this.channels.on_show();
        $("#ms_browser_display_menu .ms-browser-channel-order", this.$main).css("display", "");
    }
    else {
        $("#ms_browser_display_menu .ms-browser-channel-order", this.$main).css("display", "none");
    }

    if (!this.use_overlay && !no_pushstate) {
        var url;
        if (tab == "latest")
            url = this.url_latest;
        else if (tab == "search")
            url = this.url_search;
        else
            url = this.url_channels + window.location.hash;
        window.history.pushState({"ms_tab": tab}, tab, url);
    }
};

MSBrowser.prototype.display_loading = function () {
    if (isNaN(this.loading_count))
        this.loading_count = 1;
    else
        this.loading_count ++;
    if (this.loading_timeout)
        return;
    var obj = this;
    this.loading_timeout = setTimeout(function () {
        $(".ms-browser-loading", obj.$widget).css("display", "block");
        obj.loading_timeout = null;
    }, 500);
};
MSBrowser.prototype.hide_loading = function () {
    if (this.loading_count)
        this.loading_count --;
    if (isNaN(this.loading_count) || this.loading_count > 0)
        return;
    if (this.loading_timeout) {
        clearTimeout(this.loading_timeout);
        this.loading_timeout = null;
    }
    $(".ms-browser-loading", this.$widget).css("display", "");
};

MSBrowser.prototype.get_top_section_add_buttons = function (can_add_channel, can_add_video) {
    if (!can_add_channel && !can_add_video)
        return "";
    var html = "<div class=\"ms-browser-section-links\">";
    if (can_add_channel) {
        html += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-add-channel\" href=\""+this._get_btn_link(null, "add_channel")+"\"><i class=\"fa fa-plus\"></i> "+utils.translate("Add a channel")+"</a>";
    }
    if (can_add_video) {
        html += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-add-video\" href=\""+this._get_btn_link(null, "add_video")+"\"><i class=\"fa fa-plus\"></i> "+utils.translate("Add a video")+"</a>";
    }
    html += "</div>";
    return html;
};

MSBrowser.prototype.display_content = function ($container, data, cat_oid, tab) {
    var i, selectable, $section;
    if (data.channels && data.channels.length > 0) {
        // sub channels
        selectable = this.selectable_content.indexOf("c") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        if (!cat_oid || cat_oid == "0") {
            if (!this.use_overlay && tab == "channels") {
                var html = this.get_top_section_add_buttons(data.can_add_channel, data.can_add_video);
                $("#commands_place").empty();
                if (html !== "")
                    $("#commands_place").append(html);
                $(".channel-description-rss", $("#global .main-title")).remove();
                $("#global .main-title h1").html(utils.translate("All channels"));
                document.title = utils.translate("All channels");
            } else {
                $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Channels")+"</h3>");
            }
        } else {
            $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Sub channels")+"</h3>");
        }

        for (i = 0; i < data.channels.length; i++) {
            if (data.channels[i].parent_oid === undefined && cat_oid)
                data.channels[i].parent_oid = cat_oid;

            $section.append(this.get_content_entry("channel", data.channels[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.live_streams && data.live_streams.length > 0) {
        // live streams
        selectable = this.selectable_content.indexOf("l") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Live streams")+"</h3>");

        for (i = 0; i < data.live_streams.length; i++) {
            $section.append(this.get_content_entry("live", data.live_streams[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.videos && data.videos.length > 0) {
        // videos
        selectable = this.selectable_content.indexOf("v") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Videos")+"</h3>");
        for (i = 0; i < data.videos.length; i++) {
            $section.append(this.get_content_entry("video", data.videos[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.photos_groups && data.photos_groups.length > 0) {
        // photos groups
        selectable = this.selectable_content.indexOf("p") != -1;
        $section = $("<div class=\"ms-browser-section\"></div>");
        $section.append("<h3 class=\"ms-browser-section-title\">"+utils.translate("Photos groups")+"</h3>");
        for (i = 0; i < data.photos_groups.length; i++) {
            $section.append(this.get_content_entry("photos", data.photos_groups[i], selectable, tab));
        }
        $container.append($section);
    }
};
MSBrowser.prototype.get_content_entry = function (item_type, item, gselectable, tab) {
    this.update_catalog(item);
    var oid = item.oid;
    var selectable = gselectable && (!this.parent_selection_oid || item.selectable);
    var $entry = null;
    $entry = $("<div class=\"item-entry item-type-"+item_type+"\"></div>");
    $entry.attr("id", "item_entry_"+oid+"_"+tab);
    if (item_type != "parent" && item_type != "current")
        $entry.addClass(this.display_mode);
    if (this.current_selection && this.current_selection.oid == oid)
        $entry.addClass("selected");
    if (selectable)
        $entry.addClass("selectable");
    if (item.extra_class)
        $entry.addClass(item.extra_class);
    var html = this._get_entry_block_html(item, item_type, selectable, tab);
    if (this.display_mode == "thumbnail" && !this.use_overlay && item_type != "parent" && item_type != "current") {
        html +=   "<button type=\"button\" class=\"obj-block-info\" title=\""+utils.translate("Open information panel")+"\"></button>";
        if (item.can_edit) {
            html +=   "<a class=\"obj-block-edit\" title=\""+utils.translate("Edit")+"\" href=\""+this._get_btn_link(item, "edit")+"\"></a>";
        }
        html += "<div class=\"overlay-info\" id=\"item_entry_"+oid+"_"+tab+"_info\" style=\"display: none;\"></div>";
    }
    var $entry_block = $(html);
    this._set_on_click_entry_block($entry_block, oid, item_type, item, selectable);
    $entry.append($entry_block);
    if (this.display_mode == "thumbnail")
        this._set_thumbnail_info_box_html(item_type, selectable, oid, $entry, item, tab);

    html = this._get_entry_links_html(item, item_type, selectable);
    var $entry_links = $(html);
    this._set_on_click_entry_links($entry_links, item, item_type, selectable);
    $entry.append($entry_links);
    if (!this.use_overlay && (item_type == "current" || item_type == "parent"))
        return;
    return $entry;
};
MSBrowser.prototype._get_entry_block_html = function (item, item_type, selectable, tab) {
    var is_parent_or_current = item_type == "parent" || item_type == "current";
    var markup = "div";
    var href = "";
    var link = "";
    if (!this.use_overlay && item.slug && item_type != "parent" && item_type != "current") {
        if (item_type != "channel" && !item.validated && item.can_edit)
            link = "href=\""+this._get_btn_link(item, "edit")+"\"";
        else
            link = "href=\""+this._get_btn_link(item, "view")+"\"";
        if (this.display_mode == "thumbnail") {
            markup = "a";
            href = link;
        }
    }
    var clickable = this.use_overlay && (selectable || item_type == "channel" || item_type == "parent");

    var html = "<" + markup + " " + href + " class=\"item-entry-link " + (clickable ? "clickable" : "") + "\">";
    var $title_place = $("#global .main-title h1");
    var $content_place = $("#ms_browser_channels .ms-browser-block");
    /******************* Image preview ****************/

    var image_preview = "";
    if (this.use_overlay || item_type != "current" || !item.hide_image) {
        if (item.thumb) {
            if (this.display_mode == "thumbnail" && !is_parent_or_current) {
                image_preview += "<span class=\"item-entry-preview obj-block-link\"" +
                          "style=\"background-image: url(" + item.thumb + ");\"></span>";
            } else {
                if (this.use_overlay || item_type != "current") {
                    image_preview += "<a class=\"item-entry-preview\" " + link + "><img src=\"" + item.thumb + "\"/></a>";
                }
            }
        } else {
            image_preview += "<a class=\"item-entry-preview\" " + link + "><span class=\"item-" + item_type + "-icon\"></span></a>";
        }
    }
    html += image_preview;

    /********************* Content ********************/

    var content = "<div class=\"item-entry-content\">";

    /******************* Top bar ****************/
    var top_bar = "<div class=\"item-entry-top-bar\">";
    if (is_parent_or_current || this.display_mode != "thumbnail") {
        if (!this.use_overlay && item_type == "current") {
            $("#commands_place").empty();
            $title_place.html("<a class=\"item-entry-preview\" " + link + "><img src=\"" + item.thumb + "\"/></a> <span class=\"inline-block\">" + utils.escape_html(item.title)) + "</span>";
            document.title = utils.escape_html(item.title);
        } else {
            top_bar += "<a class=\"item-entry-title\" " + link + ">" + utils.escape_html(item.title) + "</a>";
        }
    }

    /*********** Links ************/

    var links = "";
    if (!this.use_overlay && item_type == "current" && (item.can_edit || item.can_add_channel || item.can_add_video)) {
        links += "<span class=\"item-entry-links\">";
        links += "<span class=\"item-entry-links-container\">";
        if (item.can_edit) {
            links += "<a class=\""+this.btn_class+" default item-entry-pick item-entry-pick-edit-media\" href=\""+this._get_btn_link(item, "edit")+"\"><i class=\"fa fa-pencil\"></i> "+utils.translate("Edit")+"</a>";
            if (item.can_delete)
                links += "<button type=\"button\" class=\""+this.btn_class+" danger item-entry-pick-delete-media\"><i class=\"fa fa-trash\"></i> "+utils.translate("Delete")+"</button>";
        }
        if (item.can_add_channel || item.can_add_video) {
            if (item.can_add_channel) {
                links += "<a class=\"" + this.btn_class + " item-entry-pick item-entry-pick-add-channel\" href=\"" +
                          this._get_btn_link(item, "add_channel") + "\"><i class=\"fa fa-plus\"></i> " +
                          utils.translate("Add a sub channel")+"</a>";
            }
            if (item.can_add_video) {
                links += "<a class=\""+this.btn_class+" item-entry-pick item-entry-pick-add-video\" href=\"" +
                          this._get_btn_link(item, "add_video") + "\"><i class=\"fa fa-plus\"></i> " +
                          utils.translate("Add a video")+"</a>";
            }
        }
        links += "    </span>";
        links += "</span>";
        $("#commands_place").empty();
    }
    $("#commands_place").append(links);

    /********** Status **********/

    var status = "";
    if (item.can_edit && !is_parent_or_current) {
        if (item_type == "channel") {
            if (item.unlisted)
                status += "<span class=\"item-entry-unlisted\" title=\"" +
                            utils.translate("This channel is unlisted") + "\"></span>";
        }
        else {
            if (!item.validated)
                status += "<span class=\"item-entry-notpublished\" title=\"" +
                            utils.translate("This media is not published") + "\"></span>";
            else if (item.unlisted)
                status += "<span class=\"item-entry-unlisted\" title=\"" +
                            utils.translate("This media is published and unlisted") + "\"></span>";
            else
                status += "<span class=\"item-entry-published\" title=\"" +
                            utils.translate("This media is published") + "\"></span>";
            if (item_type == "video" && !item.ready)
                status += "<span class=\"item-entry-notready\" title=\"" +
                            utils.translate("This video is being processed") + "\"></span>";
        }
    }
    top_bar += status;

    if (item.duration)
        top_bar +=         "<span class=\"item-entry-duration\">" + item.duration + "</span>";
    if (!is_parent_or_current) {
        if (item.creation)
            top_bar += "<br /> <span class=\"item-entry-date\">" + utils.translate("Created on") + " " +
                        utils.get_date_display(item.creation) + "</span>";
        if (item.short_description)
            top_bar += "<div class=\"item-entry-description\">" + item.short_description + "</div>";
    }
    top_bar += "</div>";
    content += top_bar;

    /******************* Bottom bar ****************/

    var bottom_bar = "<span class=\"item-entry-bottom-bar\">";
    if (item.views && !is_parent_or_current) {
        bottom_bar += "<span class=\"item-entry-views\">" + item.views + " " + utils.translate("views");
        if (item.views_last_month)
            bottom_bar += ", " + item.views_last_month + " " + utils.translate("this month");
        bottom_bar += "</span>";
    }
    if (item_type != "parent" && item_type != "current" && this.display_mode == "thumbnail")
        bottom_bar += "<span class=\"item-entry-title\">" + utils.escape_html(item.title) + "</span>";
    if (tab == "latest")
        bottom_bar += "<span class=\"item-entry-type\">" + utils.translate("Type:") + " " +
                        utils.translate(item_type) + "</span>";
    if (tab == "latest" && item.add_date)
        bottom_bar += "<span class=\"item-entry-date\">" + utils.translate("Added on") + " " +
                        utils.get_date_display(item.add_date) + "</span>";
    if (tab == "latest" && item.parent_title)
        bottom_bar += "<span class=\"item-entry-parent\">" + utils.translate("Parent channel:") + " " +
                        item.parent_title + "</span>";
    //if (item.matching && this.no_overlay)
      //  bottom_bar +=         "<span class=\"item-entry-parent\">"+utils.translate("Found in") +": "+item.matching.replace(",", "+")+"</span>";

    bottom_bar += "</span>";
    content += bottom_bar;
    content += "</div>";
    html += content;
    html += "</" + markup + ">";

    /********************** Search data **********************/

    if (item.annotations && !this.use_overlay && tab == "search") {
        html += "<span class=\"item-entry-annotations\"><span>" + utils.translate("Annotations") + ":</span><ul>";
        for (var i=0; i < item.annotations.length; i++) {
            var annotation = item.annotations[i];
            html += "<li><a href=\"/videos/" + item.slug + "/#start=" + annotation.time + "&autoplay\">";
            if (annotation.title)
                html += annotation.title;
            html += " (" + annotation.time_display + ") ";
            html += "</a></li>";
        }
        html += "</ul></span>";
    }

    /***************************** Current Channel data *************************/

    if (!this.use_overlay && tab == "channels" && item_type == "current") {
        var $current_item_desc = $("<div class=\"current-item-desc\"></div>");
        var $desc = $("<div class=\"channel-description-text" + (item.short_description != item.description ? " small" : "") + "\">" + item.short_description + "</div>");
        if (item.short_description != item.description) {
            $desc.click(function () {
                this.innerHTML = item.description;
            });
        }
        $current_item_desc.append($desc);
        var rss = "<div id=\"channel_description_rss\" class=\"channel-description-rss\"> ";
        if (this.display_itunes_rss) {
            rss += " <span class=\"inline-block\">" + utils.translate("Subscribe to channel's videos RSS:") + "</span>";
            rss += " <a class=\"nowrap marged\" href=\"/channels/" + item.oid + "/rss.xml\">";
            rss +=     "<i class=\"fa fa-rss\"></i> " + utils.translate("standard") + "</a>";
            rss += " <a class=\"nowrap marged\" href=\"/channels/" + item.oid + "/itunes-video.xml\">";
            rss +=     "<i class=\"fa fa-apple\"></i> " + utils.translate("iTunes") + "</a>";
            rss += " <a class=\"nowrap marged\" href=\"/channels/" + item.oid + "/itunes-audio.xml\">";
            rss +=     "<i class=\"fa fa-apple\"></i> " + utils.translate("iTunes (audio only)") + "</a>";
        } else {
            rss += " <a class=\"nowrap\" href=\"/channels/" + item.oid + "/rss.xml\">";
            rss +=     "<i class=\"fa fa-rss\"></i> " + utils.translate("Subscribe to channel's videos RSS") + "</a>";
        }
        rss += "</div>";
        $current_item_desc.append(rss);
        var anno_and_views = "";
        if (item.views) {
            anno_and_views += "<span class=\"inline-block\">" + item.views + " " + utils.translate("views");
            if (item.views_last_month)
                anno_and_views += ", " + item.views_last_month + " " + utils.translate("this month");
            anno_and_views += "</span>";
        }
        if (item.comments) {
            anno_and_views += " <span class=\"inline-block\">" + item.comments + " " + utils.translate("annotations");
            if (item.comments_last_month)
                anno_and_views += ", " + item.comments_last_month + " " + utils.translate("this month");
            anno_and_views += "</span>";
        }
        anno_and_views += "<br />";
        $("#channel_description_rss").prepend(anno_and_views);
        $content_place.prepend($current_item_desc);
    }
    return html;
};
MSBrowser.prototype._set_on_click_entry_block = function ($entry_block, oid, item_type, item, selectable) {
    if (this.use_overlay) {
        if (item_type == "channel" || item_type == "parent") {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.channels.display_channel(event.data.oid);
                event.data.obj.change_tab("channels");
                //event.data.obj.channels.tree_manager.expand_tree(event.data.oid);
            });
        } else if (selectable) {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.pick(event.data.oid);
            });
        }
    }
    else if (item.can_delete) {
        $(".item-entry-pick-delete-media", $entry_block).click({ obj: this, oid: oid }, function (event) {
            event.data.obj.pick(event.data.oid, "delete");
        });
    }
};
MSBrowser.prototype._get_entry_links_html = function (item, item_type, selectable) {
    var is_parent_or_current = item_type == "parent" || item_type == "current";
    var html = "<div class=\"item-entry-links\">";
    html += "<div class=\"item-entry-links-container\">";
    var url_view = this.use_overlay ? "" : this._get_btn_link(item, "view");
    if ((item_type == "channel" || item_type == "parent")) {
        var txt = utils.translate("Display channel");
        if (item_type == "parent")
            txt = utils.translate("Display parent channel");
        if (this.use_overlay) {
            html += "<button type=\"button\" class=\""+this.btn_class+" item-entry-display\"><i class=\"fa fa-chevron-right\"></i> "+txt+"</button>";
        } else {
            if (item_type == "parent") {
                $(".navbar .back").attr("href", url_view);
            } else {
                html += "<a class=\""+this.btn_class+" item-entry-display\" href=\""+url_view+"\"><i class=\"fa fa-chevron-right\"></i> "+txt+"</a>";
            }
        }
    }
    if (this.use_overlay) {
        if (selectable) {
            if (item_type == "channel" || is_parent_or_current)
                html += "<button type=\"button\" class=\""+this.btn_class+" main item-entry-pick\"><i class=\"fa fa-check\"></i> "+utils.translate("Select this channel")+"</button>";
            else
                html += "<button type=\"button\" class=\""+this.btn_class+" main item-entry-pick\"><i class=\"fa fa-check\"></i> "+utils.translate("Select this media")+"</button>";
        }
    } else {
        if (item_type != "parent" && item_type != "current") {
            if (item_type != "channel" && item.validated) {
                html += "<a class=\""+this.btn_class+" item-entry-pick-view-media\" href=\""+url_view+"\"><i class=\"fa fa-chevron-right\"></i> "+utils.translate("See")+"</a>";
            }
            if (item.can_edit) {
                html += "<a class=\""+this.btn_class+" item-entry-pick-edit-media default\" href=\""+this._get_btn_link(item, "edit")+"\"><i class=\"fa fa-pencil\"></i> "+utils.translate("Edit") +"</a>";
            }
            if (item.can_delete)
                html += "<button type=\"button\" class=\""+this.btn_class+" item-entry-pick-delete-media danger\"><i class=\"fa fa-trash\"></i> "+utils.translate("Delete")+"</button>";
        }
    }
    html += "</div>";
    html += "</div>";
    return html;
};
MSBrowser.prototype._get_btn_link = function (item, action) {
    var type = "";
    var prefix = "";
    if (item && item.oid) {
        type = item.oid[0];
    }
    if (!action && (!type || type === "" || type === "0") && (!item || item.oid == "0")) {
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
        if (item)
            return "/add-content/channel/?in="+item.oid;
        return "/add-content/channel/";
    } else if (action == "add_video") {
        if (item)
            return "/add-content/?in="+item.oid+"#add_video";
        return "/add-content/#add_video";
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
MSBrowser.prototype._get_thumbnail_info_box_html = function (item, item_type, selectable, tab) {
    var html = "<div class=\"overlay-info-title\">";
    html += "<button type=\"button\" class=\"overlay-info-close "+this.btn_class+"\" title=\""+utils.translate("Hide this window")+"\"><i class=\"fa fa-close\"></i></button>";
    html += "<h3><a href=\""+this._get_btn_link(item, "view")+"\">"+item.title+"</a></h3>";
    html += "</div>";
    html += "<div class=\"overlay-info-content\">";
    if (item.annotations && !this.use_overlay && tab == "search") {
        html += "<div><b>"+utils.translate("Matching annotations:")+"</b></div>";
        html += "<ul>";
        for (var i=0; i < item.annotations.length; i++) {
            var annotation = item.annotations[i];
            html += "<li><a href=\"/videos/"+item.slug+"/#start="+annotation.time+"&autoplay\">";
            if (annotation.title)
                html += annotation.title;
            html += " ("+annotation.time_display+") ";
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
MSBrowser.prototype._set_thumbnail_info_box_html = function (item_type, selectable, oid, $entry, item, tab) {
    $(".obj-block-info", $entry).click({ obj: this, $entry: $entry }, function (event) {
        var info_id = "#"+$entry.attr("id")+"_info";
        if ($(info_id, event.data.$entry).html() !== "") {
            event.data.obj.box_open_info($entry);
            return;
        }
        if (tab == "search") {
            var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable, tab);
            $(info_id, event.data.$entry).append($element);
            event.data.obj.box_open_info($entry);
        } else {
            event.data.obj.get_info_for_oid(oid, true, function (data) {
                var item = data.info;
                var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable, tab);
                $(info_id, event.data.$entry).append($element);
                event.data.obj.box_open_info($entry);
            });
        }
    });
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
            if (!$(event.target).closest(info_id).length && !$(event.target).closest(".obj-block-info").length && $(info_id).is(":visible"))
                obj.box_hide_info();
        };
        $(document).click(this.box_click_handler);
    }
};
MSBrowser.prototype.box_hide_info = function () {
    $(".overlay-info:visible").fadeOut("fast");
    $(".obj-block-info.info-displayed").removeClass("info-displayed");
};
MSBrowser.prototype.display_categories = function () {
    var obj = this;
    if (this.site_settings_categories.length > 0) {
        var html = " <br/>";
        html += " <button type=\"button\" id=\"open_hidden_categories\" class=\"button\">" + utils.translate("Categories") + " <i class=\"fa fa-angle-down\"></i></button>";
        html += " <div id=\"hidden_categories\" class=\"hidden-visibility\">";
        html += " <label for=\"filter_no_categories\"><input id=\"filter_no_categories\" type=\"checkbox\"/><span>" + utils.translate("Unspecified") + "</span></label><br />";
        for (var i = 0; i < this.site_settings_categories.length; i++) {
            var slug = this.site_settings_categories[i][0];
            var label = this.site_settings_categories[i][1];
            html += " <label for=\"" + slug + "\"><input class=\"checkbox\" id=\"" + slug + "\" type=\"checkbox\" value=\"" + slug + "\"/><span>" + label + "</span></label>";
        }
        html += " </div>";
        $(".ms-browser-filters", this.$top_menu).append(html);
        $("#open_hidden_categories", this.$top_menu).click(function () {
            if ($("#hidden_categories").hasClass("hidden-visibility")) {
                $(".fa", this).removeClass("fa-angle-down").addClass("fa-angle-up");
                $("#hidden_categories").removeClass("hidden-visibility");
            } else {
                $("#hidden_categories").addClass("hidden-visibility");
                $(".fa", this).removeClass("fa-angle-up").addClass("fa-angle-down");
            }
        });
        $("#hidden_categories .checkbox", this.$top_menu).click(function () {
            var checked = this.checked;
            obj.filter_no_categories = false;
            $("#filter_no_categories", obj.$top_menu).prop("checked", false);
            if (checked)
                obj.filter_categories.push(this.value);
            else
                obj.filter_categories.splice(obj.filter_categories.indexOf(this.value), 1);
            obj.channels.refresh_display(true);
            obj.search.refresh_display(true);
            obj.latest.refresh_display(true);
        });
        $("#filter_no_categories", this.$top_menu).click(function () {
            var checked = this.checked;
            if (checked) {
                obj.filter_categories = [];
                $("#hidden_categories .checkbox", obj.$top_menu).prop("checked", false);
                obj.filter_no_categories = true;
                obj.channels.refresh_display(true);
                obj.search.refresh_display(true);
                obj.latest.refresh_display(true);
            } else {
                obj.filter_no_categories = false;
                obj.channels.refresh_display(true);
                obj.search.refresh_display(true);
                obj.latest.refresh_display(true);
            }
        });
    }
};