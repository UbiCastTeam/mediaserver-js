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
    this.filter_editable = null;
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
    this.overlay = null;

    this.catalog = {};
    this.display_mode = "list";
    this.displayed = "channels";
    this.current_selection = null;

    this.url_login = "/login/";
    this.url_channels = "/channels/";
    this.url_search = "/search/";
    this.url_latest = "/latest/";

    utils.setup_class(this, options, [
        // allowed options
        "title",
        "place",
        "selectable_content",
        "displayable_content",
        "filter_editable",
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

    var $messages;
    if (!this.use_overlay)
        $messages = $(".messages-block").detach(); // get Django messages

    // get elements
    this.init_options.browser = this;
    if (this.current_selection && this.current_selection.oid) {
        if (this.current_selection.oid.indexOf("c") === 0 || !isNaN(parseInt(this.current_selection.oid, 10)))
            this.init_options.current_channel_oid = this.current_selection.oid;
        else
            this.init_options.current_channel_oid = this.current_selection.parent_oid;
    }
    this.channels = new MSBrowserChannels(this.init_options);
    this.search = new MSBrowserSearch(this.init_options);
    this.latest = new MSBrowserLatest(this.init_options);

    this.build_widget();

    if (this.initial_state && this.initial_state.tab)
        this.change_tab(this.initial_state.tab, true);
    else
        this.change_tab("channels", true);

    if (this.initial_oid)
        this.pick(this.initial_oid, null, true);

    var obj = this;
    if (!this.use_overlay) {
        // display Django messages if any
        if ($messages.length > 0) {
            $messages.attr("class", "");
            setTimeout(function () {
                $(".ms-browser-message", obj.$widget).html("").append($messages);
                $(".ms-browser-message", obj.$widget).css("display", "block");
                setTimeout(function () {
                    $(".ms-browser-message", obj.$widget).css("display", "");
                }, 5000);
            }, 500);
        }
        // listen to navigation history changes
        window.onpopstate = function (event) {
            obj.on_hash_change(event.target.location);
        };
        // listen to scroll to fix left menu if required
        $(window).scroll(function () {
            obj.on_scroll();
        });
        // listen to hash changes
        $(window).bind("hashchange", function () {
            obj.on_hash_change();
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
    MSAPI.ajax_call(method, data, function (response) {
        if (response.success)
            obj.update_catalog(response.info, full);
        obj.hide_loading();
        callback(response);
    });
};
MSBrowser.prototype.pick = function (oid, action, no_close) {
    if (oid === null || oid === undefined) {
        // deselect
        if (this.current_selection && this.current_selection.oid)
            $("#item_entry_"+this.current_selection.oid+"_"+this.displayed, this.$main).removeClass("selected");
        return;
    }
    if (this.catalog[oid] && this.catalog[oid].is_full) {
        this._pick(oid, { success: true, info: this.catalog[oid] }, action, no_close);
        return;
    }
    // load info if no info are available
    var obj = this;
    this.get_info_for_oid(oid, true, function (result) {
        obj._pick(oid, result, action, no_close);
    });
};
MSBrowser.prototype._pick = function (oid, result, action, no_close) {
    if (!result.success) {
        // this should never happen
        console.log("Unable to get info about initial selection:"+result.error);
        return;
    }
    if (!this.use_overlay) {
        if (action == "delete" && window.delete_form_manager)
            window.delete_form_manager.show(oid, this.catalog[oid].title);
    }
    else {
        // change current selection
        if (this.current_selection && this.current_selection.oid)
            $("#item_entry_"+this.current_selection.oid+"_"+this.displayed, this.$main).removeClass("selected");
        this.current_selection = this.catalog[oid];
        $("#item_entry_"+oid+"_"+this.displayed, this.$main).addClass("selected");
        if (this.overlay && !no_close)
            this.overlay.hide();
        if (this.on_pick)
            this.on_pick(this.catalog[oid]);
        // select and open channel
        if (this.channels) {
            if (oid.indexOf("c") === 0 || !isNaN(parseInt(oid, 10)))
                this.channels.display_channel(oid);
            else
                this.channels.display_channel(result.info.parent_oid);
        }
    }
};
MSBrowser.prototype.get_last_pick = function () {
    return this.current_selection;
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
MSBrowser.prototype.on_hash_change = function () {
    if (window.location.pathname == this.url_channels) {
        var slug = window.location.hash;
        if (slug && slug[0] == "#")
            slug = slug.substring(1);
        if (slug)
            this.channels.display_channel_by_slug(slug);
        else
            this.channels.display_channel("0");
        this.change_tab("channels", true);
    }
    else if (window.location.pathname == this.url_search) {
        this.search.on_url_change();
        this.change_tab("search", true);
    }
    else if (window.location.pathname == this.url_latest) {
        this.change_tab("latest", true);
    }
};
