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
    this.$panel = null;
    this.last_response = null;
    this.more = false;
    this.start_date = "";
    this.date_label = "";
    this.$section = null;

    utils.setup_class(this, options, [
        // allowed options
        "browser",
        "display_itunes_rss"
    ]);
    this.init_options = options ? options : {};
}

MSBrowserLatest.prototype.get_menu_jq = function () {
    var dc = this.browser.displayable_content;
    var html = "";
    html += "<div id=\"ms_browser_latest_menu\" class=\"ms-browser-block\" style=\"display: none;\">";
    html +=     "<div class=\"info\">"+utils.translate("This list presents all media and channels ordered by add date.")+"</div>";
    if (dc.length > 1 && dc.indexOf("c") != -1) {
        html += "<p>";
        html +=     "<input id=\"latest_display_channels\" type=\"checkbox\">";
        html +=     " <label for=\"latest_display_channels\">"+utils.translate("display channels")+"</label>";
        html += "</p>";
        html += "<p><button type=\"button\" class=\"std-btn ms-browser-latest-refresh\">"+utils.translate("Apply")+"</button></p>";
    }
    html += "</div>";
    this.$menu = $(html);
    // events
    $(".ms-browser-latest-refresh", this.$menu).click({ obj: this }, function (evt) { evt.data.obj.refresh_display(); });
    return this.$menu;
};
MSBrowserLatest.prototype.get_content_jq = function () {
    var html = "";
    html += "<div id=\"ms_browser_latest\" class=\"ms-browser-content\" style=\"display: none;\">";
    html +=     "<div class=\"ms-browser-header\"><h1>"+utils.translate("Latest content added")+"</h1></div>";
    html +=     "<div class=\"ms-browser-block\">";
    html +=         "<div class=\"ms-browser-latest-place\"></div>";
    html +=         "<div class=\"ms-browser-latest-btns\">";
    html +=             "<button type=\"button\" class=\"std-btn ms-browser-latest-more-5\">"+utils.translate("Display 5 more items")+"</button>";
    html +=             "<button type=\"button\" class=\"std-btn ms-browser-latest-more-20\">"+utils.translate("Display 20 more items")+"</button>";
    html +=         "</div>";
    html +=     "</div>";
    html += "</div>";
    this.$panel = $(html);
    this.$content = $(".ms-browser-latest-place", this.$panel);
    // events
    $(".ms-browser-latest-more-5", this.$panel).click({ obj: this }, function (evt) { evt.data.obj.display_more(5); });
    $(".ms-browser-latest-more-20", this.$panel).click({ obj: this }, function (evt) { evt.data.obj.display_more(20); });
    return this.$panel;
};

MSBrowserLatest.prototype.on_show = function () {
    if (this.initialized)
        return;
    this.initialized = true;

    // TODO restore values from cookies
    this.load_latest();
};

MSBrowserLatest.prototype.load_latest = function (count, end) {
    if (this.latest_loading)
        return;
    this.latest_loading = true;
    
    var dc = this.browser.displayable_content;
    var data = {};
    if (dc)
        data.content = dc;
    if (dc.length > 1 && dc.indexOf("c") != -1 && !$("#latest_display_channels", this.$main).is(":checked")) {
        data.content = "";
        for (var i=0; i < dc.length; i++) {
            if (dc[i] != "c")
                data.content += dc[i];
        }
    }
    if (this.browser.filter_editable !== null)
        data.editable = this.browser.filter_editable ? "yes" : "no";
    if (this.browser.filter_validated !== null)
        data.validated = this.browser.filter_validated ? "yes" : "no";
    
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
    var callback = function (response) {
        if (response.items && this.last_response && this.last_response.items) {
            // merge response items
            response.items = this.last_response.items.concat(response.items);
        }
        obj._on_ajax_response(response);
        obj.latest_loading = false;
    };
    MSAPI.ajax_call("get_latest_content", data, callback);
};

MSBrowserLatest.prototype._on_ajax_error = function (response) {
    this.browser.hide_loading();
    this.last_response = null;

    var message;
    if (!this.use_overlay && (response.error_code == "403" || response.error_code == "401")) {
        var login_url = this.url_login+"?next="+window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : "");
        message = "<div>"+response.error+"<p>"+utils.translate("Please login to access this page")+"<br /> <a href=\""+login_url+"\">"+utils.translate("Sign in")+"</a></p></div>";
    }
    else
        message = "<div class=\"error\">"+response.error+"</div>";
    this.$content.html(message);
};

MSBrowserLatest.prototype._on_ajax_response = function (response) {
    if (!response.success)
        return this._on_ajax_error(response);

    this.browser.hide_loading();
    this.last_response = response;

    this.start_date = response.max_date;
    this.more = response.more === true;
    if (!this.$section)
        this.$section = $("<div class=\"ms-browser-section\"></div>");
    for (var i=0; i < response.items.length; i++) {
        var item = response.items[i];
        if (item.date_label && (item.date_label != this.date_label)) {
            this.date_label = item.date_label;
            this.$content.append(this.$section);
            this.$section = $("<div class=\"ms-browser-section\"></div>");
            this.$section.append("<h3 class=\"ms-browser-section-title\">"+item.date_label+"</h3>");
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
    this.$content.append(this.$section);
    if (this.more)
        $(".ms-browser-latest-btns", this.$panel).css("display", "block");
    else
        $(".ms-browser-latest-btns", this.$panel).css("display", "none");
};

MSBrowserLatest.prototype.display_more = function (count) {
    if (!this.more)
        return;
    this.load_latest(count);
};
MSBrowserLatest.prototype.refresh_display = function (reset) {
    if (reset && this.last_response)
        this.last_response = null;
    if (this.last_response) {
        this.date_label = "";
        this.$section = null;
        this.$content.html("");
        this._on_ajax_response(this.last_response);
    }
    else {
        this.more = false;
        this.start_date = "";
        this.date_label = "";
        this.$section = null;
        this.$content.html("");
        this.load_latest();
    }
};
