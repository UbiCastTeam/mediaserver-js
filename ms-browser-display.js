/*******************************************
* MediaServer - MediaServer browser        *
* MSBrowser class extension                *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals MSBrowser, utils */

MSBrowser.prototype.build_widget = function () {
    var obj = this;
    // build widget structure
    var html = "<div class=\"ms-browser "+(this.use_overlay ? "in-overlay" : "")+"\">";
    html += "<div class=\"ms-browser-menu\">";
    html +=     "<div class=\"ms-browser-panel\">";
    html +=         "<div class=\"ms-browser-header\">";
    html +=             "<button type=\"button\" id=\"ms_browser_channels_tab\" class=\"ms-browser-tab\">"+utils.translate("Channels")+"</button>";
    html +=             "<button type=\"button\" id=\"ms_browser_search_tab\" class=\"ms-browser-tab\">"+utils.translate("Search")+"</button>";
    html +=             "<button type=\"button\" id=\"ms_browser_latest_tab\" class=\"ms-browser-tab\">"+utils.translate("Latest content")+"</button>";
    html +=         "</div>";
    html +=     "</div>";
    html += "</div>";
    html += "<div class=\"ms-browser-main ms-items\">";
    html +=     "<div class=\"ms-browser-panel\">";
    html +=         "<div class=\"ms-browser-top-btns\">";
    html +=             "<button type=\"button\" id=\"ms_browser_display_btn\" class=\""+this.btn_class+"\">"+utils.translate("Display")+"</button>";
    //html +=             "<button type=\"button\" id=\"ms_browser_filters_btn\" class=\""+this.btn_class+"\">"+utils.translate("Filters")+"</button>";
    html += this.get_display_html();
    //html += this.get_filters_html();
    html +=         "</div>";
    html +=         "<div class=\"ms-browser-clear\"></div>";
    html +=         "<div class=\"ms-browser-loading\"><div>"+utils.translate("Loading...")+"</div></div>";
    html +=         "<div class=\"ms-browser-message\"><div></div></div>";
    html +=     "</div>";
    html += "</div>";
    html += "</div>";
    this.$widget = $(html);
    this.$menu = $(".ms-browser-menu", this.$widget);
    this.$main = $(".ms-browser-main", this.$widget);
    var $menu_place = $(".ms-browser-panel", this.$menu);
    $menu_place.append(this.channels.get_menu_html());
    $menu_place.append(this.search.get_menu_html());
    $menu_place.append(this.latest.get_menu_html());
    var $content_place = $(".ms-browser-panel", this.$main);
    $content_place.prepend(this.latest.get_content_html());
    $content_place.prepend(this.search.get_content_html());
    $content_place.prepend(this.channels.get_content_html());

    // get initial media or channel info
    if (this.place)
        $(this.place).html(this.$widget);
    
    // events
    $("#ms_browser_channels_tab", this.$menu).click({ obj: this }, function (evt) { evt.data.obj.change_tab("channels"); });
    $("#ms_browser_search_tab", this.$menu).click({ obj: this }, function (evt) { evt.data.obj.change_tab("search"); });
    $("#ms_browser_latest_tab", this.$menu).click({ obj: this }, function (evt) { evt.data.obj.change_tab("latest"); });

    $("#ms_browser_display_btn", this.$main).click({ obj: this }, function (evt) { evt.data.obj.toggle_menu("display"); });
    //$("#ms_browser_filters_btn", this.$main).click({ obj: this }, function (evt) { evt.data.obj.toggle_menu("filters"); });
    //$("#ms_browser_filters_menu  div select", this.$main).change({ obj: this }, function (evt) { evt.data.obj.toggle_filter_control(evt, this); });
    $("#ms_browser_display_as_list", this.$main).click({ obj: this }, function (evt) { evt.data.obj.ms_browser_display_as_list(); });
    $("#ms_browser_display_as_thumbnails", this.$main).click({ obj: this }, function (evt) { evt.data.obj.ms_browser_display_as_thumbnails(); });
    $("#ms_browser_order_channel", this.$main).change({ obj: this }, function (evt) { evt.data.obj.channels.set_order($(this).val()); });
};
MSBrowser.prototype.get_display_html = function () {
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
    var html = "<div id=\"ms_browser_display_menu\" class=\"ms-browser-top-menu\">";
    html += "<div><b class=\"ms-browser-display-title\">"+utils.translate("Display mode:")+"</b><br/>";
    html += "<button type=\"button\" class=\"std-btn "+( this.display_mode === "list" ? "active" : "")+"\" id=\"ms_browser_display_as_list\">"+utils.translate("list")+"</button>";
    html += "<button type=\"button\" class=\"std-btn "+( this.display_mode === "thumbnail" ? "active" : "")+"\" id=\"ms_browser_display_as_thumbnails\">"+utils.translate("thumbnails")+"</button></div>";
    html += "<div class=\"ms-browser-channel-order\"><label class=\"ms-browser-display-title\" for=\"ms_browser_order_channel\">"+utils.translate("Sort by:")+"</label><br/>";
    html += " <select id=\"ms_browser_order_channel\">";
    for (var index in sorting_values)
        for (var key in sorting_values[index])
        html +=     "<option value=\""+key+"\">"+sorting_values[index][key]+"</option>";
    html += "</select></div>";
    // TODO: pagination
    // html += "<div><b class=\"ms-browser-display-title\">"+utils.translate("Number of elements per page:")+"</b><br/>";
    // html += "    <input type=\"number\" class=\"center\" id=\"elements_per_page\" value=\"30\"/>";
    // html += "<button type=\"button\" onclick=\"javascript: cm.set_elements_per_page();\">"+utils.translate("Ok")+"</button></div>";
    html += "</div>";
    return html;
};
MSBrowser.prototype.get_filters_html = function () {
    var html = "<div id=\"ms_browser_filters_menu\" class=\"ms-browser-top-menu\">";
    if (this.displayable_content.indexOf("c") != -1) {
        html += "<div><b>"+utils.translate("Channels:")+"</b><br/>";
        html += "<label for=\"filter_channels_editable\">"+utils.translate("Editable")+"</label>";
        html += " <select id=\"filter_channels_editable\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select></div>";
    }
    if (this.displayable_content.indexOf("v") != -1) {
        html += "<div><p>"+utils.translate("Videos:")+"</p>";
        html += "<label for=\"filter_videos_editable\">"+utils.translate("Editable")+"</label>";
        html += " <select id=\"filter_videos_editable\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select><br/>";
        html += "<label for=\"filter_videos_published\">"+utils.translate("Published")+"</label>";
        html += " <select id=\"filter_videos_published\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select></div>";
    }
    if (this.displayable_content.indexOf("l") != -1) {
        html += "<div><p>"+utils.translate("Lives:")+"</p>";
        html += "<label for=\"filter_lives_editable\">"+utils.translate("Editable")+"</label>";
        html += " <select id=\"filter_lives_editable\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select>";
        html += "<label for=\"filter_lives_published\">"+utils.translate("Published")+"</label>";
        html += " <select id=\"filter_lives_published\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select></div>";
    }
    if (this.displayable_content.indexOf("p") != -1) {
        html += "<div><p>"+utils.translate("Photos groups:")+"</p>";
        html += "<label for=\"filter_photos_editable\">"+utils.translate("Editable")+"</label>";
        html += "<select id=\"filter_photos_editable\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select><br/>";
        html += "<label for=\"filter_photos_published\">"+utils.translate("Published")+"</label>";
        html += " <select id=\"filter_photos_published\">";
        html += " <option value=\"all\">"+utils.translate("all")+"</option>";
        html += " <option value=\"yes\">"+utils.translate("yes")+"</option>";
        html += " <option value=\"no\">"+utils.translate("no")+"</option>";
        html += " </select></div>";
    }
    html += "</div>";
    return html;
};
MSBrowser.prototype.toggle_menu = function (menu) {
    var $btn, $menu;
    if (menu == "filters") {
        $btn = $("#ms_browser_filters_btn", this.$main);
        $menu = $("#ms_browser_filters_menu", this.$main);
    } else if (menu == "display") {
        $btn = $("#ms_browser_display_btn", this.$main);
        $menu = $("#ms_browser_display_menu", this.$main);
    }
    if (!$btn)
        return;
    if ($btn.hasClass("active")) {
        $btn.removeClass("active");
        $menu.removeClass("active");
    } else {
        $btn.addClass("active");
        $menu.addClass("active");
    }
};
MSBrowser.prototype.toggle_filter_control = function (event, js_obj) {
    var id = js_obj.id;
    if (id === "filter_channels_editable"){return;}
    if (id === "filter_videos_editable"){return;}
    if (id === "filter_videos_published"){return;}
    if (id === "filter_lives_editable"){return;}
    if (id === "filter_lives_published"){return;}
    if (id === "filter_photos_editable"){return;}
    if (id === "filter_photos_published"){return;}
    return;
};
MSBrowser.prototype.ms_browser_display_as_list = function () {
    if ($("#ms_browser_display_as_list", this.$main).hasClass("active"))
        return;
    this.display_mode = "list";
    $("#ms_browser_display_as_thumbnails", this.$main).removeClass("active");
    $("#ms_browser_display_as_list", this.$main).addClass("active");
    if (!this.use_overlay)
        $("#global").removeClass("wide");
    $(".item-entry.list", this.$main).css("float", "none");
    utils.set_cookie("catalog-display_mode", this.display_mode);
    $("#ms_browser_display_btn", this.$main).removeClass("active");
    $("#ms_browser_display_menu", this.$main).removeClass("active");
    this.channels.refresh_display();
    this.search.refresh_display();
    this.latest.refresh_display();
};
MSBrowser.prototype.ms_browser_display_as_thumbnails = function () {
    if ($("#ms_browser_display_as_thumbnails", this.$main).hasClass("active"))
        return;
    this.display_mode = "thumbnail";
    $("#ms_browser_display_as_list", this.$main).removeClass("active");
    $("#ms_browser_display_as_thumbnails", this.$main).addClass("active");
    if (!this.use_overlay)
        $("#global").addClass("wide");
    $(".item-entry.thumbnail", this.$main).css("float", "left");
    utils.set_cookie("catalog-display_mode", this.display_mode);
    $("#ms_browser_display_btn", this.$main).removeClass("active");
    $("#ms_browser_display_menu", this.$main).removeClass("active");
    this.channels.refresh_display();
    this.search.refresh_display();
    this.latest.refresh_display();
};
MSBrowser.prototype.get_active_tab = function () {
    var $active = $(".ms-browser-tab.active", this.$menu);
    return $active.length > 0 ? $active.attr("id").replace(/_tab/g, "").replace(/ms_browser_/g, "") : null;
};
MSBrowser.prototype.change_tab = function (section, no_pushstate) {
    var previous = this.get_active_tab();
    if (previous == section)
        return;

    if (previous) {
        $("#ms_browser_"+previous+"_tab", this.$menu).removeClass("active");
        $("#ms_browser_"+previous+"_menu", this.$menu).css("display", "none");
        $("#ms_browser_"+previous, this.$main).css("display", "none");
    }
    $("#ms_browser_"+section+"_tab", this.$menu).addClass("active");
    $("#ms_browser_"+section+"_menu", this.$menu).css("display", "block");
    $("#ms_browser_"+section, this.$main).css("display", "block");

    if (section == "latest")
        this.latest.on_show();
    if (section == "search")
        this.search.on_show();
    if (section == "channels") {
        this.channels.on_show();
        $("#ms_browser_display_menu .ms-browser-channel-order", this.$main).css("display", "");
    }
    else {
        $("#ms_browser_display_menu .ms-browser-channel-order", this.$main).css("display", "none");
    }

    if (!this.use_overlay) {
        var url;
        if (section == "latest") {
            url = this.url_latest;
        } else if (section == "search") {
            url = this.url_search;
        } else {
            url = this.url_channel + window.location.hash;
        }
        if (!no_pushstate) {
            if (!this.initial_push) {
                this.initial_push = window.location.href;
                this.initial_push_section = previous;
            }
            window.history.pushState({"ms_section": section}, section, url);
        }
    }
};

MSBrowser.prototype.display_loading = function () {
    if (this.loading_timeout)
        return;
    var obj = this;
    this.loading_timeout = setTimeout(function () {
        $(".ms-browser-loading", obj.$widget).css("display", "block");
        obj.loading_timeout = null;
    }, 500);
};
MSBrowser.prototype.hide_loading = function () {
    if (this.loading_timeout) {
        clearTimeout(this.loading_timeout);
        this.loading_timeout = null;
    }
    $(".ms-browser-loading", this.$widget).css("display", "");
};