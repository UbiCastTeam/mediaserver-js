/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals utils, MSAPI */

function MSBrowserLatest(options) {
    // params
    this.browser = null;
    // vars
    this.$menu = null;
    this.$content = null;
    this.$place = null;
    this.last_response = null;
    this.more = false;
    this.start_date = "";
    this.date_label = "";
    this.$section = null;
    this.can_add_channel = false;
    this.can_add_video = false;

    utils.setup_class(this, options, [
        // allowed options
        "browser"
    ]);
    this.init_options = options ? options : {};
}

MSBrowserLatest.prototype.get_displayable_content = function () {
    var dc = this.browser.displayable_content;
    if (dc.length > 1 && this.browser.lti_mode && dc.indexOf("c") != -1)
        dc = dc.replace(/c/g, "");
    return dc;
};
MSBrowserLatest.prototype.get_menu_jq = function () {
    var dc = this.get_displayable_content();
    var html = "";
    html += "<div id=\"ms_browser_latest_menu\" style=\"display: none;\">";
    if (dc.length > 1) {
        html +=     "<div class=\"ms-browser-dropdown\" id=\"ms_browser_latest_types_dropdown\">";
        html +=         "<button type=\"button\" class=\"button ms-browser-dropdown-button "+this.browser.btn_class+"\">"+utils.translate("Content types")+" <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></button>";
        html +=         "<div class=\"ms-browser-dropdown-menu ms-browser-latest-types\">";
        html +=             "<h4>"+utils.translate("Content types to display:")+"</h4>";
        if (dc.indexOf("c") != -1) {
            html += "<p><input id=\"latest_display_channel\" type=\"checkbox\">";
            html += " <label for=\"latest_display_channel\">"+utils.translate("channels")+"</label></p>";
        }
        if (dc.indexOf("v") != -1) {
            html += "<p><input id=\"latest_display_video\" type=\"checkbox\">";
            html += " <label for=\"latest_display_video\">"+utils.translate("videos")+"</label></p>";
        }
        if (dc.indexOf("l") != -1) {
            html += "<p><input id=\"latest_display_live\" type=\"checkbox\">";
            html += " <label for=\"latest_display_live\">"+utils.translate("live streams")+"</label></p>";
        }
        if (dc.indexOf("p") != -1) {
            html += "<p><input id=\"latest_display_photos\" type=\"checkbox\">";
            html += " <label for=\"latest_display_photos\">"+utils.translate("photos")+"</label></p>";
        }
        html +=         "</div>";
        html +=     "</div>";
    }
    html += "</div>";
    this.$menu = $(html);
    // events
    if (dc.length > 1) {
        this.browser.setup_dropdown($("#ms_browser_latest_types_dropdown", this.$menu));
        $(".ms-browser-latest-types input", this.$menu).change({ obj: this }, function (event) {
            event.data.obj.refresh_display(true);
            var type_letter = this.id.split("_")[2][0];
            var types = utils.get_cookie("catalog-lastest_types");
            if (!types)
                types = "vlp";
            if (this.checked) {
                if (types.indexOf(type_letter) == -1)
                    types += type_letter;
            } else {
                types = types.replace(new RegExp(type_letter), "");
            }
            utils.set_cookie("catalog-lastest_types", types);
        });
    }
    return this.$menu;
};
MSBrowserLatest.prototype.get_content_jq = function () {
    var more_label = utils.translate("Display {count} more items");
    var html = "";
    html += "<div id=\"ms_browser_latest\" class=\"ms-browser-content\" style=\"display: none;\">";
    html +=     "<div class=\"messages\">";
    html +=         "<div class=\"message info\">"+utils.translate("This list presents all media and channels ordered by add date.")+"</div>";
    html +=     "</div>";
    html +=     "<div class=\"ms-browser-latest-place\"></div>";
    html +=     "<div class=\"ms-browser-latest-btns\">";
    html +=         "<button type=\"button\" class=\"button ms-browser-latest-more-10\">"+more_label.replace(/\{count\}/, "10")+"</button>";
    html +=         "<button type=\"button\" class=\"button ms-browser-latest-more-30\">"+more_label.replace(/\{count\}/, "30")+"</button>";
    html +=     "</div>";
    html += "</div>";
    this.$content = $(html);
    this.$place = $(".ms-browser-latest-place", this.$content);
    // events
    $(".ms-browser-latest-more-10", this.$content).click({ obj: this }, function (event) { event.data.obj.display_more(10); });
    $(".ms-browser-latest-more-30", this.$content).click({ obj: this }, function (event) { event.data.obj.display_more(30); });
    return this.$content;
};

MSBrowserLatest.prototype.on_show = function () {
    this.browser.set_title(utils.translate("Latest content added"));
    if (this.initialized)
        return;
    this.initialized = true;

    var dc = this.get_displayable_content();
    if (dc.length > 1) {
        var types = utils.get_cookie("catalog-lastest_types");
        if (!types)
            types = "vlp";
        $(".ms-browser-latest-types #latest_display_channel", this.$menu).prop("checked", types.indexOf("c") != -1);
        $(".ms-browser-latest-types #latest_display_video", this.$menu).prop("checked", types.indexOf("v") != -1);
        $(".ms-browser-latest-types #latest_display_live", this.$menu).prop("checked", types.indexOf("l") != -1);
        $(".ms-browser-latest-types #latest_display_photos", this.$menu).prop("checked", types.indexOf("p") != -1);
    }

    this.load_latest();
};

MSBrowserLatest.prototype.load_latest = function (count, end) {
    if (this.latest_loading)
        return;
    this.latest_loading = true;

    var dc = this.get_displayable_content();
    var data = {};
    if (dc.length > 1) {
        data.content = "";
        if (dc.indexOf("c") != -1 && $("#latest_display_channel", this.$menu).is(":checked"))
            data.content += "c";
        if (dc.indexOf("v") != -1 && $("#latest_display_video", this.$menu).is(":checked"))
            data.content += "v";
        if (dc.indexOf("l") != -1 && $("#latest_display_live", this.$menu).is(":checked"))
            data.content += "l";
        if (dc.indexOf("p") != -1 && $("#latest_display_photos", this.$menu).is(":checked"))
            data.content += "p";
    } else if (dc)
        data.content = dc;
    if (this.browser.filter_editable !== null)
        data.editable = this.browser.filter_editable ? "yes" : "no";
    if (this.browser.filter_validated !== null)
        data.validated = this.browser.filter_validated ? "yes" : "no";
    if (this.browser.filter_speaker !== null)
        data.speaker = this.browser.filter_speaker;
    if (this.browser.filter_no_categories) {
        data.no_categories = true;
    } else {
        if (this.browser.filter_categories.length > 0)
            data.categories = this.browser.filter_categories;
    }

    var start_value = 0;
    if (this.start_date) {
        data.start = this.start_date;
        start_value = parseInt(this.start_date.replace(new RegExp("[-_]", "g"), ""), 10);
        if (isNaN(start_value))
            start_value = 0;
    }
    if (end) {
        var end_value = parseInt(end.replace(new RegExp("[-_]", "g"), ""), 10);
        if (start_value > 0 && !isNaN(end_value) && end_value >= start_value) {
            this.latest_loading = false;
            console.log("cancelled");
            return;
        }
        data.end = end;
    }
    if (count)
        data.count = count;
    var obj = this;
    this.browser.display_loading();
    MSAPI.ajax_call("get_latest_content", data, function (response) {
        if (response.items && response.items.length > 0) {
            // merge response items
            if (!obj.last_response)
                obj.last_response = response;
            else
                obj.last_response.items = obj.last_response.items.concat(response.items);
        }
        obj._on_ajax_response(response);
        obj.latest_loading = false;
    });
};

MSBrowserLatest.prototype._on_ajax_error = function (response) {
    var message = "<div class=\"messages\">";
    if (!this.browser.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.browser.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message += "<div class=\"item-description\">";
        message += "<div class=\"message error\">"+response.error+"</div>";
        message += "<p>"+utils.translate("Please login to access this page")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p>";
        message += "</div>";
    } else {
        message += "<div class=\"message error\">"+response.error+"</div>";
    }
    message += "</div>";
    this.$place.html(message);
};

MSBrowserLatest.prototype._on_ajax_response = function (response) {
    this.browser.hide_loading();
    if (!response.success)
        return this._on_ajax_error(response);

    if (response.can_add_channel)
        this.can_add_channel = true;
    if (response.can_add_video)
        this.can_add_video = true;

    this.start_date = response.max_date;
    this.more = response.more === true;
    var first_section = this.$section === null;
    for (var i=0; i < response.items.length; i++) {
        var item = response.items[i];
        if (item.date_label && item.date_label != this.date_label) {
            this.date_label = item.date_label;
            this.$section = $("<div class=\"ms-browser-section\"></div>");
            this.$section.append("<h3>"+item.date_label+"</h3>");
            this.$place.append(this.$section);
        }
        else if (!this.$section) {
            this.$section = $("<div class=\"ms-browser-section\"></div>");
            this.$place.append(this.$section);
            console.log("A browser section is missing in latest tab. This should not happen.", item.date_label, this.date_label);
        }
        var type = "channel";
        if (item.type == "v")
            type = "video";
        if (item.type == "l")
            type = "live";
        if (item.type == "p")
            type = "photos";
        var selectable = this.browser.selectable_content.indexOf(item.type) != -1;
        this.$section.append(this.browser.get_content_entry(type, item, selectable, "latest"));
    }
    if (this.$section === null) {
        var $msg = $("<div class=\"messages\"><div class=\"message info\">"+utils.translate("No contents.")+"</div></div>");
        this.$place.append($msg);
    }
    if (this.more)
        $(".ms-browser-latest-btns", this.$content).css("display", "block");
    else
        $(".ms-browser-latest-btns", this.$content).css("display", "none");
};

MSBrowserLatest.prototype.display_more = function (count) {
    if (!this.more)
        return;
    this.load_latest(count);
};
MSBrowserLatest.prototype.refresh_display = function (reset) {
    if (reset)
        this.last_response = null;
    if (this.last_response) {
        this.date_label = "";
        this.$section = null;
        this.$place.html("");
        this._on_ajax_response(this.last_response);
    }
    else {
        this.more = false;
        this.start_date = "";
        this.date_label = "";
        this.$section = null;
        this.$place.html("");
        this.load_latest();
    }
};

MSBrowserLatest.prototype.remove = function (oid) {
    this.browser.remove_oid_from_tab(this, oid);
};
