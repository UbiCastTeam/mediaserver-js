/*******************************************
* MediaServer - Tree manager               *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals utils, MSAPI */

function MSTreeManager(options) {
    // params
    this.$place = null;
    this.display_root = false;
    this.auto_init = true;
    this.current_channel_oid = "0";
    this.on_change = null;
    this.on_data_retrieved = null;
    this.on_tree_loaded = null;
    this.channels_base_url = "/channels/#";
    this.channels_url_field = "slug";
    this.tree_url = "";
    this.path_url = "";

    // vars
    this.$widget = null;
    this.loaded = false;
    this.loading = false;
    this.content = {};

    utils.setup_class(this, options, [
        // allowed options
        "$place",
        "display_root",
        "auto_init",
        "current_channel_oid",
        "on_change",
        "on_data_retrieved",
        "on_tree_loaded",
        "channels_base_url",
        "channels_url_field",
        "tree_url",
        "path_url"
    ]);
    MSAPI.configure(options);
    if (this.auto_init) {
        var obj = this;
        $(document).ready(function () {
            obj.init();
        });
    }
}

MSTreeManager.prototype.init = function () {
    if (this.loaded || this.loading)
        return;
    if (!this.$place)
        return console.log("No place defined for tree.");
    if (!this.$place.length)
        return console.log("Place for tree doesn't exist. Requested place: '"+this.$place+"'.");
    this.id_prefix = this.slugify(this.$place.selector);
    this.loading = true;
    // display link for root if display_root
    var html = "<div>";
    if (this.display_root) {
        html += "<div id=\"" + this.id_prefix + "tree_channel_0_link\" "+(this.current_channel_oid == "0" ? "class=\"channel-active\"" : "")+">";
        if (this.on_change)
            html += "<button type=\"button\" data-ref=\"0\" class=\"channel-btn\">"+utils.translate("Root")+"</button>";
        else
            html += "<a href=\""+this.channels_base_url+"\" class=\"channel-btn\">"+utils.translate("Root")+"</a>";
        html += "</div>";
    }
    html += "<ul class=\"list border-color-green active\" id=\"" + this.id_prefix + "tree_channel_0\"></ul></div>";
    this.$widget = $(html);
    if (this.display_root && this.on_change) {
        $(".channel-btn", this.$widget).click({ obj: this }, function (evt) {
            evt.data.obj.on_change($(this).attr("data-ref"));
        });
    }

    // load root
    var obj = this;
    this.load_tree("0", function (result) {
        obj.loading = false;
        obj.loaded = true;
        if (result.success) {
            // expand tree for selected channel
            if (obj.current_channel_oid)
                obj.expand_tree(obj.current_channel_oid);
        }
        obj.$place.html("");
        obj.$place.append(obj.$widget);
        if (obj.on_tree_loaded)
            obj.on_tree_loaded();
    });
};
MSTreeManager.prototype.load_tree = function (parent_oid, callback) {
    if (this.content[parent_oid] && (this.content[parent_oid].loaded || this.content[parent_oid].loading)) {
        if (callback)
            callback({ success: true });
        return;
    }
    if (!this.content[parent_oid])
        this.content[parent_oid] = { oid: parent_oid };
    this.content[parent_oid].loading = true;

    var data = { recursive: "no" };
    if (parent_oid != "0")
        data.parent_oid = parent_oid;
    var obj = this;
    // get place to display channel tree
    var $target = $("#" + this.id_prefix + "tree_channel_" + parent_oid, this.$widget);
    if (!$target.length) {
        this.content[parent_oid].loading = false;
        if (callback)
            callback({ success: false, error: "Target does not exist." });
        return;
    }
    // display loading if it is too long
    this.content[parent_oid].timeout = setTimeout(function () {
        obj.content[parent_oid].timeout = null;
        $target.html("<li><div class=\"loading\">"+utils.translate("Loading")+"...</div></li>");
    }, 500);
    // load channel tree
    var scallback = function (response) {
        obj._ajax_cb(response, parent_oid, $target, callback);
    };
    var ecallback = function (xhr, textStatus, thrownError) {
        if (xhr.status) {
            if (xhr.status == 401)
                return obj._ajax_cb({ success: false, error: utils.translate("Unable to get channels tree because you are not logged in.") }, parent_oid, $target, callback);
            if (xhr.status == 403)
                return obj._ajax_cb({ success: false, error: utils.translate("Unable to get channels tree because you cannot access to this channel.") }, parent_oid, $target, callback);
            if (xhr.status == 404)
                return obj._ajax_cb({ success: false, error: utils.translate("Channel does not exist.") }, parent_oid, $target, callback);
            if (xhr.status == 500)
                return obj._ajax_cb({ success: false, error: utils.translate("An error occured in medias server. Please try again later.") }, parent_oid, $target, callback);
        }
        if (textStatus == "timeout")
            obj._ajax_cb({ success: false, error: utils.translate("Unable to get channels tree. Request timed out.") }, parent_oid, $target, callback);
        else if (textStatus == "error")
            obj._ajax_cb({ success: false, error: utils.translate("The server cannot be reached.") }, parent_oid, $target, callback);
        else
            obj._ajax_cb({ success: false, error: utils.translate("An error occured during request:")+"<br/>&nbsp;&nbsp;&nbsp;&nbsp;"+textStatus+" "+thrownError }, parent_oid, $target, callback);
    };
    if (this.tree_url) {
        $.ajax({
            url: this.tree_url,
            data: data,
            dataType: "json",
            cache: false,
            success: scallback,
            error: ecallback
        });
    } else {
        MSAPI.ajax_call("get_channels_tree", data, function (response) {
            if (response.success)
                scallback(response);
            else
                ecallback(response.xhr, response.textStatus, response.thrownError);
        });
    }
};
MSTreeManager.prototype._ajax_cb = function (result, parent_oid, $target, callback) {
    if (this.content[parent_oid].timeout) {
        clearTimeout(this.content[parent_oid].timeout);
        delete this.content[parent_oid].timeout;
    }
    if (result.success) {
        if (result.channels) {
            // get html
            var html = "";
            for (var i=0; i < result.channels.length; i++) {
                var channel = result.channels[i];
                if (parent_oid != "0") {
                    channel.parent_oid = parent_oid;
                    channel.parent_title = this.content[parent_oid] ? this.content[parent_oid].title : "load error";
                }
                else {
                    channel.parent_oid = "0";
                    channel.parent_title = utils.translate("Root");
                }
                if (!this.content[channel.oid])
                    this.content[channel.oid] = channel;
                else {
                    for (var field in channel) {
                        this.content[channel.oid][field] = channel[field];
                    }
                }
                if (this.on_data_retrieved)
                    this.on_data_retrieved(channel);
                var button = "";
                if (channel.channels)
                    button = "<button type=\"button\" data-ref=\"" + channel.oid +
                               "\" class=\"channel-toggle button-text list-entry\">" +
                                 "<i class=\"fa fa-fw fa-angle-right\" aria-hidden=\"true\"></i>" +
                             "</button>";
                html += "<li><div id=\"" + this.id_prefix + "tree_channel_" + channel.oid + "_link\" class=\"aside-list-btn" +
                        (this.current_channel_oid == channel.oid ? " channel-active" : "") + "\">" + button;
                if (this.on_change)
                    html += "<button type=\"button\" data-ref=\""+channel.oid+"\" class=\"channel-btn\">"+utils.escape_html(channel.title)+"</button>";
                else
                    html += "<a href=\""+this.channels_base_url+channel[this.channels_url_field]+"\" class=\"channel-btn" + (channel.channels ? "" : " aside-list-btn") + "\">"+utils.escape_html(channel.title)+"</a>";
                html += "</div>";
                if (channel.channels)
                    html += "<ul class=\"list green\" id=\"" + this.id_prefix + "tree_channel_"+channel.oid+"\"></ul>";
                html += "</li>";
            }
            var $html = $(html);
            $target.html("");
            $target.append($html);
            // bind click events
            if (this.on_change) {
                $(".channel-btn", $html).click({ obj: this }, function (evt) {
                    evt.data.obj.on_change($(this).attr("data-ref"));
                });
            }
            $(".channel-toggle", $html).click({ obj: this }, function (evt) {
                evt.data.obj.toggle_channel($(this).attr("data-ref"));
            });
        }
        this.content[parent_oid].loaded = true;
    }
    else if (result.error) {
        $target.html("<li><div class=\"error\">"+result.error+"</div></li>");
    }
    else {
        $target.html("<li><div class=\"error\">"+utils.translate("No information about error.")+"</div></li>");
    }
    this.content[parent_oid].loading = false;

    if (callback)
        callback(result);
};
MSTreeManager.prototype.expand_tree = function (oid) {
    if (oid == "0" || !this.loaded || this.loading)
        return;
    // get path of channel and open all levels
    var obj = this;
    var callback = function (path) {
        if (path.length > 0) {
            var cat_oid = path.shift().oid;
            obj.load_tree(cat_oid, function (result) {
                if (result.success)
                    callback(path);
            });
        }
        else {
            var cat = obj.content[oid];
            while (cat) {
                $("#" + obj.id_prefix + "tree_channel_" + cat.oid, obj.$widget).css("display", "block").addClass("active");
                $("#" + obj.id_prefix + "tree_channel_" + cat.oid + "_link .channel-toggle", obj.$widget).addClass("fa-rotate-90");
                cat = obj.content[cat.parent_oid];
            }
        }
    };
    // check that the path is known
    if (!this.content[oid] || this.content[oid].parent_oid === undefined) {
        this.load_path(oid, function (result) {
            var path = result.path;
            if (!path)
                path = [];
            if (!obj.content[oid])
                obj.content[oid] = { oid: oid };
            path.push(obj.content[oid]);
            callback(path);
        });
    }
    else {
        var path = [];
        var cat = obj.content[oid];
        while (cat) {
            path.push(cat);
            cat = obj.content[cat.parent_oid];
        }
        path.reverse();
        callback(path);
    }
};
MSTreeManager.prototype.open_tree = function (oid) {
    $("#" + this.id_prefix + "tree_channel_" + oid, this.$widget).css("display", "block").addClass("active");
    $("#" + this.id_prefix + "tree_channel_" + oid + "_link .channel-toggle", this.$widget).addClass("fa-rotate-90");
    this.load_tree(oid);
};
MSTreeManager.prototype.close_tree = function (oid) {
    $("#" + this.id_prefix + "tree_channel_" + oid, this.$widget).css("display", "none").removeClass("active");
    $("#" + this.id_prefix + "tree_channel_" + oid + "_link .channel-toggle", this.$widget).removeClass("fa-rotate-90");
};
MSTreeManager.prototype.toggle_channel = function (oid) {
    var $btn = $("#" + this.id_prefix + "tree_channel_" + oid + "_link .channel-toggle", this.$widget);
    if ($btn.hasClass("fa-rotate-90"))
        this.close_tree(oid);
    else
        this.open_tree(oid);
};

MSTreeManager.prototype.set_active = function (oid) {
    if (this.current_channel_oid == oid)
        return;
    $("#" + this.id_prefix + "tree_channel_" + this.current_channel_oid + "_link", this.$widget).removeClass("channel-active");
    this.current_channel_oid = oid;
    $("#" + this.id_prefix + "tree_channel_" + this.current_channel_oid + "_link", this.$widget).addClass("channel-active");
    this.open_tree(oid);
};


MSTreeManager.prototype.load_path = function (oid, callback) {
    var data = { oid: oid };
    var scallback = function (response) {
        if (!response.success)
        console.log("Error getting path for oid "+oid+". Error: "+response.error);
        callback(response);
    };
    var ecallback = function (xhr, textStatus, thrownError) {
        console.log("Error getting path for oid "+oid+". Error: "+textStatus+" | "+thrownError);
        callback({ success: false, error: textStatus+" | "+thrownError });
    };
    if (this.path_url) {
        $.ajax({
            url: this.path_url,
            data: data,
            dataType: "json",
            cache: false,
            success: scallback,
            error: ecallback
        });
    } else {
        MSAPI.ajax_call("get_channels_path", data, function (response) {
            if (response.success)
                scallback(response);
            else
                ecallback(response.xhr, response.textStatus, response.thrownError);
        });
    }
};

MSTreeManager.prototype.slugify = function (text) {
    return text.toString().toLowerCase().trim()
           .replace(/\s+/g, "-")
           .replace(/&/g, "-and-")
           .replace(/[^\w\-]+/g, "")
           .replace(/\-\-+/g, "-");
};