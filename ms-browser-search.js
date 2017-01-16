/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals utils, MSAPI */

function MSBrowserSearch(options) {
    // params
    this.browser = null;
    // vars
    this.$menu = null;
    this.$panel = null;
    this.last_response = null;
    this.search_in_fields = [
        { name: "in_title", label: "titles", initial: true, items: null },
        { name: "in_description", label: "descriptions", initial: false, items: null },
        { name: "in_keywords", label: "keywords", initial: true, items: null },
        { name: "in_speaker", label: "speakers", initial: true, items: "vlp" },
        { name: "in_license", label: "licenses", initial: false, items: "vlp" },
        { name: "in_company", label: "companies", initial: false, items: "vlp" },
        { name: "in_location", label: "locations", initial: false, items: "vlp" },
        { name: "in_categories", label: "categories", initial: false, items: "vlp" },
        { name: "in_annotations", label: "annotations", initial: false, items: "vlp" },
        { name: "in_photos", label: "photos", initial: false, items: "p" },
        { name: "in_extref", label: "external references", initial: true, items: null }
    ];
    this.search_for_fields = [
        { name: "for_channels", label: "channels", initial: true, items: "c" },
        { name: "for_videos", label: "videos", initial: true, items: "v" },
        { name: "for_lives", label: "live streams", initial: true, items: "l" },
        { name: "for_photos", label: "photos groups", initial: true, items: "p" }
    ];

    utils.setup_class(this, options, [
        // allowed options
        "browser",
        "display_itunes_rss"
    ]);
    this.init_options = options ? options : {};
}

MSBrowserSearch.prototype.should_be_displayed = function (dc, items) {
    if (!items)
        return true;
    for (var i=0; i < dc.length; i++) {
        if (items.indexOf(dc[i]) != -1)
            return true;
    }
    return false;
};
MSBrowserSearch.prototype.get_menu_catalog_jq = function () {
    var dc = this.browser.displayable_content;
    var html = "<div id=\"ms_browser_search_menu\" style=\"text-align: right;\">";
    html += "<input id=\"ms_browser_search_text\" type=\"hidden\" value=\"\">";
    html += "<span class=\"relative\">";
    html += "<button id=\"button_search_look_in\" class=\"button default js-display marged\" data-display-id=\"search_look_in\">" + this.translate("Search in") + " <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></button>";
    html += "<div class=\"dropdown ms-browser-search-in\" id=\"search_look_in\">";

    for (var i = 0; i < this.search_in_fields.length; i++) {
        var field = this.search_in_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            html += "<div><input id=\"ms_browser_search_" + field.name + "\" type=\"checkbox\" " + (field.initial ? "checked=\"checked\"" : "") + ">";
            html += "<label for=\"ms_browser_search_" + field.name + "\">" + utils.escape_html(utils.translate(field.label)) + "</label></div>";
        }
    }
    html += "</div>";
    html += "</span>";
    html += "<span class=\"relative\">";
    html += "<button id=\"button_search_look_for\" class=\"button default js-display marged\" data-display-id=\"search_look_for\">" + this.translate("Search for") + " <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></button>";
    html += "<div class=\"dropdown ms-browser-search-for\" id=\"search_look_for\">";
    for (i = 0; i < this.search_for_fields.length; i++) {
        var field = this.search_for_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            html += "<div><input id=\"ms_browser_search_" + field.name + "\" type=\"checkbox\" " + (field.initial ? "checked=\"checked\"" : "") + ">";
            html += "<label for=\"ms_browser_search_" + field.name + "\">" + utils.escape_html(utils.translate(field.label)) + "</label></div>";
        }
    }
    html += "</div>";
    html += "</span>";
    html += "</div>";
    var $menu = $(html);
    $(".js-display", $menu).click(function (event) {
        event.stopPropagation();
        var id = $(this).attr("data-display-id");
        var $ele = $("#" + id);
        if ($ele.hasClass("active")) {
            $ele.removeClass("active");
        } else {
            $(".dropdown").removeClass("active");
            $ele.addClass("active");
        }
    });
    $(".dropdown", $menu).click(function (event) {
        event.stopPropagation();
    });
    $(".ms-browser-search-in input[type=checkbox], .ms-browser-search-for input[type=checkbox]", $menu).click(
        {obj: this}, function (event) {
        event.stopPropagation();
        event.data.obj.on_search_submit();
    });
    return $menu;
};
MSBrowserSearch.prototype.get_menu_jq = function () {
    var dc = this.browser.displayable_content;
    var i, field;
    var html = "";
    html += "<div id=\"ms_browser_search_menu\" class=\"ms-browser-block\" style=\"display: none;\">";
    html +=     "<form class=\"ms-browser-search-block\" method=\"get\" action=\".\" onsubmit=\"javascript: return false;\">";
    html +=         "<label class=\"ms-browser-search-title\" for=\"ms_browser_search_text\">"+utils.translate("Search:")+"</label>";
    html +=         " <div class=\"ms-browser-search-input\"><input id=\"ms_browser_search_text\" type=\"text\" value=\"\">";
    html +=         " <button type=\"submit\" class=\"button\" id=\"ms_browser_search_start\">"+utils.translate("Go")+"</button></div>";
    html +=     "</form>";
    html +=     "<div class=\"ms-browser-search-block ms-browser-search-in\">";
    html +=         "<div class=\"ms-browser-search-title\">"+utils.translate("Search in:")+"</div>";
    html +=         " <div><button type=\"button\" class=\"button\" id=\"ms_browser_search_in_all\">"+utils.translate("all")+"</button>";
    html +=         " <button type=\"button\" class=\"button\" id=\"ms_browser_search_in_none\">"+utils.translate("none")+"</button></div>";
    for (i=0; i < this.search_in_fields.length; i++) {
        field = this.search_in_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            html += " <div><input id=\"ms_browser_search_"+field.name+"\" type=\"checkbox\" "+(field.initial ? "checked=\"checked\"" : "")+">";
            html += " <label for=\"ms_browser_search_"+field.name+"\">"+utils.escape_html(utils.translate(field.label))+"</label></div>";
        }
    }
    html +=     "</div>";
    if (dc.length > 1) {
        html += "<div class=\"ms-browser-search-block ms-browser-search-for\">";
        html +=     "<div class=\"ms-browser-search-title\">"+utils.translate("Search for:")+"</div>";
        html +=         " <div><button type=\"button\" class=\"button\" id=\"ms_browser_search_for_all\">"+utils.translate("all")+"</button>";
        html +=         " <button type=\"button\" class=\"button\" id=\"ms_browser_search_for_none\">"+utils.translate("none")+"</button></div>";
        for (i=0; i < this.search_for_fields.length; i++) {
            field = this.search_for_fields[i];
            if (this.should_be_displayed(dc, field.items)) {
                html += " <div><input id=\"ms_browser_search_"+field.name+"\" type=\"checkbox\" "+(field.initial ? "checked=\"checked\"" : "")+">";
                html += " <label for=\"ms_browser_search_"+field.name+"\">"+utils.escape_html(utils.translate(field.label))+"</label></div>";
            }
        }
        html += "</div>";
    }
    html += "</div>";
    if (this.browser.use_overlay) {
        this.$menu = $(html);
    } else {
        this.$menu = this.get_menu_catalog_jq();
    }
    // events
    $("form", this.$menu).submit({ obj: this }, function (evt) { evt.data.obj.on_search_submit(); });
    $("#ms_browser_search_in_all", this.$menu).click({ obj: this }, function (evt) {
        $(".ms-browser-search-in input[type=checkbox]", evt.data.obj.$main).prop("checked", true);
    });
    $("#ms_browser_search_in_none", this.$menu).click({ obj: this }, function (evt) {
        $(".ms-browser-search-in input[type=checkbox]", evt.data.obj.$main).prop("checked", false);
    });
    $("#ms_browser_search_for_all", this.$menu).click({ obj: this }, function (evt) {
        $(".ms-browser-search-for input[type=checkbox]", evt.data.obj.$main).prop("checked", true);
    });
    $("#ms_browser_search_for_none", this.$menu).click({ obj: this }, function (evt) {
        $(".ms-browser-search-for input[type=checkbox]", evt.data.obj.$main).prop("checked", false);
    });
    return this.$menu;
};
MSBrowserSearch.prototype.get_content_jq = function () {
    var html = "";
    html += "<div id=\"ms_browser_search\" class=\"ms-browser-content\" style=\"display: none;\">";
    html +=     "<div class=\"ms-browser-header\"><h1>"+utils.translate("Search results")+"</h1></div>";
    html +=     "<div class=\"ms-browser-block\">";
    html +=         "<div class=\"info\">"+utils.translate("Use the input in the left column to search for something.")+"</div>";
    html +=     "</div>";
    html += "</div>";
    this.$panel = $(html);
    this.$content = $(".ms-browser-block", this.$panel);
    return this.$panel;
};

MSBrowserSearch.prototype.on_show = function () {
    if (this.initialized)
        return;
    this.initialized = true;

    this.on_url_change();
    if (!this.browser.use_overlay && this.browser.get_active_tab() == "search") {
        $("#top_search_form form").submit({obj: this}, function (event) {
            $("#ms_browser_search_text").val($("#top_search_input").val());
            event.data.obj.on_search_submit();
            return false;
        });
    }
};

MSBrowserSearch.prototype.on_url_change = function () {
    if (!this.initialized)
        return;
    // Example of search url: http://192.168.42.8:8000/search/?text=test&in_titles=on&in_descriptions=on&in_keywords=on&in_licenses=on&in_companies=on&in_annotations=on&in_photos=on&for_channels=on&for_videos=on&for_lives=on&for_photos=on
    var data = this.parse_url();

    var dc = this.browser.displayable_content;
    var i, field, value;
    for (i=0; i < this.search_in_fields.length; i++) {
        field = this.search_in_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            if (data.has_in_vals)
                value = data[field.name] ? true : false;
            else
                value = field.initial;
            $("#ms_browser_search_"+field.name, this.$menu).prop("checked", value);
        }
    }
    for (i=0; i < this.search_for_fields.length; i++) {
        field = this.search_for_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            if (data.has_for_vals)
                value = data[field.name] ? true : false;
            else
                value = field.initial;
            $("#ms_browser_search_"+field.name, this.$menu).prop("checked", value);
        }
    }

    if (data.text) {
        $("#ms_browser_search_text", this.$menu).val(data.text);
        this.on_search_submit(true);
    }
};

MSBrowserSearch.prototype.parse_url = function () {
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
            }
            else {
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

MSBrowserSearch.prototype.on_search_submit = function (no_pushstate) {
    var search = $("#ms_browser_search_text", this.$menu).val();
    if (!search)
        return;
    this.browser.display_loading();
    var dc = this.browser.displayable_content;
    var url_query = "text="+search;
    // get fields to search in
    var fields = "";
    var i, field, value;
    for (i=0; i < this.search_in_fields.length; i++) {
        field = this.search_in_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            value = $("#ms_browser_search_"+field.name, this.$menu).is(":checked");
            if (value) {
                fields += field.name.substring(2);  // remove "in"
                url_query += "&"+field.name;
            }
        }
    }
    if (fields)
        fields = fields.substring(1);
    else
        fields = "metadata";
    // get content to search for
    var content = "";
    for (i=0; i < this.search_for_fields.length; i++) {
        field = this.search_for_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            value = $("#ms_browser_search_"+field.name, this.$menu).is(":checked");
            if (value) {
                content += field.name.substring(4, 5);  // get content first letter
                url_query += "&"+field.name;
            }
        }
    }
    if (!content)
        content = dc;
    // prepare search request
    var data = {
        search: search,
        content: content,
        fields: fields
    };
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
    // change url
    if (!this.browser.use_overlay && !no_pushstate) {
        var title = utils.translate("Result for")+" "+search;
        var url = this.browser.url_search+"?"+url_query;
        window.history.pushState({"ms_tab": "search", "search": search}, title, url);
    }
    // execute search request
    var obj = this;
    MSAPI.ajax_call("search", data, function (response) {
        obj._on_ajax_response(response);
        if (window.ga)
            window.ga("send", "pageview", "/ajax_search?search="+data.search+"&fields="+data.fields);
    });
};

MSBrowserSearch.prototype._on_ajax_error = function (response) {
    this.last_response = null;

    var message;
    if (!this.browser.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.browser.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message = "<div>"+response.error+"<p>"+utils.translate("Please login to access this page")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p></div>";
    }
    else
        message = "<div class=\"error\">"+response.error+"</div>";
    this.$content.html(message);
};

MSBrowserSearch.prototype._on_ajax_response = function (response) {
    this.browser.hide_loading();
    if (!response.success)
        return this._on_ajax_error(response);

    this.last_response = response;

    var nb_channels = response.channels ? response.channels.length : 0;
    var nb_videos = response.videos ? response.videos.length : 0;
    var nb_live_streams = response.live_streams ? response.live_streams.length : 0;
    var nb_photos_groups = response.photos_groups ? response.photos_groups.length : 0;
    var has_items = nb_channels > 0 || nb_videos > 0 || nb_live_streams > 0 || nb_photos_groups > 0;
    this.$content.html("");
    // search result display
    if (has_items) {
        var results = [];
        if (nb_channels > 0)
            results.push(nb_channels + " " + utils.translate("channel(s)"));
        if (nb_videos > 0)
            results.push(nb_videos + " " + utils.translate("video(s)"));
        if (nb_live_streams > 0)
            results.push(nb_live_streams + " " + utils.translate("live stream(s)"));
        if (nb_photos_groups > 0)
            results.push(nb_photos_groups + " " + utils.translate("photos group(s)"));
        var text = "<p id=\"matching_items_place\" class=\"marged\"><b>" + utils.translate("Matching items:") + "</b> " + results.join(", ") + "</p>";
        if (this.browser.use_overlay) {
            this.$content.append(text);
        } else {
            $("#matching_items_place").remove();
            $("#global .main-title").append(text);
        }
        this.browser.display_content(this.$content, response, null, "search");
    }
    else
        this.$content.html("<div class=\"info\">" + utils.translate("No results.") + "</div>");
};

MSBrowserSearch.prototype.refresh_display = function (reset) {
    if (reset && this.last_response)
        this.last_response = null;
    if (this.last_response)
        this._on_ajax_response(this.last_response);
    else
        this.on_search_submit(true);
};
