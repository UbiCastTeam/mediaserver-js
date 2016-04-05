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
        { name: "in_titles", label: "titles", initial: true, items: null },
        { name: "in_descriptions", label: "descriptions", initial: true, items: null },
        { name: "in_keywords", label: "keywords", initial: true, items: null },
        { name: "in_speakers", label: "speakers", initial: true, items: "vlp" },
        { name: "in_licenses", label: "licenses", initial: false, items: "vlp" },
        { name: "in_companies", label: "companies", initial: false, items: "vlp" },
        { name: "in_locations", label: "locations", initial: true, items: "vlp" },
        { name: "in_categories", label: "categories", initial: false, items: "vlp" },
        { name: "in_annotations", label: "annotations", initial: true, items: "vlp" },
        { name: "in_photos", label: "photos", initial: true, items: "p" },
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

MSBrowserSearch.prototype.get_menu_html = function () {
    var dc = this.browser.displayable_content;
    var i, field;
    var html = "";
    html += "<div id=\"ms_browser_search_menu\" class=\"ms-browser-block\" style=\"display: none;\">";
    html +=     "<form class=\"ms-browser-search-block\" method=\"get\" action=\".\" onsubmit=\"javascript: return false;\">";
    html +=         "<label class=\"ms-browser-search-title\" for=\"ms_browser_search_text\">"+utils.translate("Search:")+"</label>";
    html +=         " <div class=\"ms-browser-search-input\"><input id=\"ms_browser_search_text\" type=\"text\" value=\"\">";
    html +=         " <button type=\"submit\" class=\"std-btn\" id=\"ms_browser_search_start\">"+utils.translate("Go")+"</button></div>";
    html +=     "</form>";
    html +=     "<div class=\"ms-browser-search-block ms-browser-search-in\">";
    html +=         "<div class=\"ms-browser-search-title\">"+utils.translate("Search in:")+"</div>";
    html +=         " <div><button type=\"button\" class=\"std-btn\" id=\"ms_browser_search_in_all\">"+utils.translate("all")+"</button>";
    html +=         " <button type=\"button\" class=\"std-btn\" id=\"ms_browser_search_in_none\">"+utils.translate("none")+"</button></div>";
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
        html +=         " <div><button type=\"button\" class=\"std-btn\" id=\"ms_browser_search_for_all\">"+utils.translate("all")+"</button>";
        html +=         " <button type=\"button\" class=\"std-btn\" id=\"ms_browser_search_for_none\">"+utils.translate("none")+"</button></div>";
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
    this.$menu = $(html);
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
MSBrowserSearch.prototype.get_content_html = function () {
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

    // Example of search url: http://192.168.42.8:8000/search/?search=test&in_titles=on&in_descriptions=on&in_keywords=on&in_licenses=on&in_companies=on&in_annotations=on&in_photos=on&for_channels=on&for_videos=on&for_lives=on&for_photos=on
    var data = this.parse_url();

    var dc = this.browser.displayable_content;
    var i, field, value;
    for (i=0; i < this.search_in_fields.length; i++) {
        field = this.search_in_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            value = field.initial;
            if (field.name in data)
                value = data[field.name] ? true : false;
            $("#ms_browser_search_"+field.name, this.$menu).prop("checked", value);
        }
    }
    for (i=0; i < this.search_for_fields.length; i++) {
        field = this.search_for_fields[i];
        if (this.should_be_displayed(dc, field.items)) {
            value = field.initial;
            if (field.name in data)
                value = data[field.name] ? true : false;
            $("#ms_browser_search_"+field.name, this.$menu).prop("checked", value);
        }
    }

    if (data.search) {
        $("#ms_browser_search_text", this.$menu).val(data.search);
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
            }
            else {
                attr = tuples[i];
                value = true;
            }
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
    // get fields to search in
    var checked = {
        ms_browser_search_in_titles: $("#ms_browser_search_in_titles", this.$menu).is(":checked"),
        ms_browser_search_in_descriptions: $("#ms_browser_search_in_descriptions", this.$menu).is(":checked"),
        ms_browser_search_in_keywords: $("#ms_browser_search_in_keywords", this.$menu).is(":checked"),
        ms_browser_search_in_speakers: $("#ms_browser_search_in_speakers", this.$menu).is(":checked"),
        ms_browser_search_in_licenses: $("#ms_browser_search_in_licenses", this.$menu).is(":checked"),
        ms_browser_search_in_companies: $("#ms_browser_search_in_companies", this.$menu).is(":checked"),
        ms_browser_search_in_locations: $("#ms_browser_search_in_locations", this.$menu).is(":checked"),
        ms_browser_search_in_categories: $("#ms_browser_search_in_categories", this.$menu).is(":checked"),
        ms_browser_search_in_annotations: $("#ms_browser_search_in_annotations", this.$menu).is(":checked"),
        ms_browser_search_in_photos: $("#ms_browser_search_in_photos", this.$menu).is(":checked"),
        ms_browser_search_in_extref: $("#ms_browser_search_in_extref", this.$menu).is(":checked"),
        ms_browser_search_for_channels: $("#ms_browser_search_for_channels", this.$menu).is(":checked"),
        ms_browser_search_for_videos: $("#ms_browser_search_for_videos", this.$menu).is(":checked"),
        ms_browser_search_for_lives: $("#ms_browser_search_for_lives", this.$menu).is(":checked"),
        ms_browser_search_for_photos: $("#ms_browser_search_for_photos", this.$menu).is(":checked")
    };
    var dc = this.browser.displayable_content;
    var fields = "";
    if (checked.ms_browser_search_in_titles)
        fields += "_title";
    if (checked.ms_browser_search_in_descriptions)
        fields += "_description";
    if (checked.ms_browser_search_in_keywords)
        fields += "_keywords";
    if (dc.length > 1 || dc.indexOf("c") == -1) {
        if (checked.ms_browser_search_in_speakers)
            fields += "_speaker";
        if (checked.ms_browser_search_in_licenses)
            fields += "_license";
        if (checked.ms_browser_search_in_companies)
            fields += "_company";
        if (checked.ms_browser_search_in_locations)
            fields += "_location";
        if (checked.ms_browser_search_in_categories)
            fields += "_categories";
    }
    if (dc != "c" && checked.ms_browser_search_in_annotations)
        fields += "_annotations";
    if ((dc.indexOf("v") != -1 || dc.indexOf("p") != -1) && checked.ms_browser_search_in_photos)
        fields += "_photos";
    if (checked.ms_browser_search_in_extref)
        fields += "_extref";
    if (fields)
        fields = fields.substring(1);
    else
        fields = "metadata";
    // get content to search
    var content = "";
    if (dc.length > 1) {
        if (dc.indexOf("c") != -1 && checked.ms_browser_search_for_channels)
            content += "c";
        if (dc.indexOf("v") != -1 && checked.ms_browser_search_for_videos)
            content += "v";
        if (dc.indexOf("l") != -1 && checked.ms_browser_search_for_lives)
            content += "l";
        if (dc.indexOf("p") != -1 && checked.ms_browser_search_for_photos)
            content += "p";
    }
    if (!content)
        content = dc;
    // prepare search request
    var data = {
        search: search,
        content: content,
        fields: fields
    };
    if (this.filter_validated !== null) {
        if (this.filter_validated)
            data.validated = "yes";
        else
            data.validated = "no";
    }
    // change url
    if (!this.browser.use_overlay) {
        var title = utils.translate("Result for")+" "+search;
        var check_in_url = [];
        for (var check in checked) {
            var value = check.split("ms_browser_search_")[1];
            if (checked[check])
                value = value+"=on";
            else
                continue;
            check_in_url.push(value);
        }
        var url = this.browser.url_search+"?search="+search+"&"+check_in_url.join("&");
        if (!no_pushstate)
            window.history.pushState({"search": search, "filters": checked}, title, url);
    }
    // execute search request
    var obj = this;
    var callback = function (response) {
        obj._on_ajax_response(response);
    };
    MSAPI.ajax_call("search", data, callback);
};

MSBrowserSearch.prototype._on_ajax_error = function (response) {
    this.browser.hide_loading();
    this.last_response = null;

    var message = "";
    if (!this.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message = "<p>"+utils.translate("Please login to access this page")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p>";
    }
    this.$content.html("<div>"+response.error + message+"</div>");
};

MSBrowserSearch.prototype._on_ajax_response = function (response) {
    if (!response.success)
        return this._on_ajax_error(response);

    this.browser.hide_loading();
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
            results.push(nb_channels+" "+utils.translate("channel(s)"));
        if (nb_videos > 0)
            results.push(nb_videos+" "+utils.translate("video(s)"));
        if (nb_live_streams > 0)
            results.push(nb_live_streams+" "+utils.translate("live stream(s)"));
        if (nb_photos_groups > 0)
            results.push(nb_photos_groups+" "+utils.translate("photos group(s)"));
        this.$content.append("<div>"+utils.translate("Matching items:")+" "+results.join(", ")+"</div>");
    } else {
        this.$content.html("<div class=\"info\">"+utils.translate("No results.")+"</div>");
        return;
    }
    this.browser.display_content(this.$content, response);
};

MSBrowserSearch.prototype.refresh_display = function () {
    if (this.last_response)
        this._on_ajax_response(this.last_response);
};
