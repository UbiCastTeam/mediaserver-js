/*******************************************
* MediaServer - Tree manager               *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals utils, MSAPI */
"use strict";

function MSTreeManager(options) {
    // params
    this.$place = null;
    this.display_root = false;
    this.display_personal = false;
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
    this.content = {"0": {oid: "0", parent_oid: null}};
    this.loading_queue = {};
    this.has_personal_channel = false;
    this.personal_channel_info = null;

    utils.setup_class(this, options, [
        // allowed options
        "$place",
        "display_root",
        "display_personal",
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
    this.initial_oid = this.current_channel_oid;
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

    this.loading = true;

    this.id_prefix = "";
    while ($("#" + this.id_prefix + "tree_channel_0").length > 0) {
        this.id_prefix += "_";
    }

    // display link for root if display_root
    var html = "<div>";
    if (this.display_root) {
        html += "<div id=\"" + this.id_prefix + "tree_channel_0_link\" "+(this.current_channel_oid == "0" ? "class=\"channel-active\"" : "")+">";
        if (this.on_change)
            html += "<button type=\"button\" data-ref=\"0\" class=\"channel-btn\""+(this.current_channel_oid == "0" ? "title=\""+utils.translate("Root")+" "+ utils.translate("selected")+"\"" : "")+">"+utils.translate("Root")+"</button>";
        else
            html += "<a href=\""+this.channels_base_url+"\" class=\"channel-btn\""+(this.current_channel_oid == "0" ? "title=\""+utils.translate("Root")+" "+ utils.translate("selected")+"\"" : "")+">"+utils.translate("Root")+"</a>";
        html += "</div>";
    }
    html += "<ul class=\"list js-active-item border-color-blue active\" id=\"" + this.id_prefix + "tree_channel_0\"></ul></div>";
    this.$widget = $(html);
    if (this.display_root && this.on_change) {
        $(".channel-btn", this.$widget).click({ obj: this }, function (evt) {
            evt.data.obj.on_change($(this).attr("data-ref"));
        });
    }
    // load root
    var obj = this;
    this.loading = false;
    this.load_tree("0", function (result) {
        obj.loaded = true;
        if (result.success) {
            // open tree for selected channel
            if (obj.initial_oid && obj.current_channel_oid == obj.initial_oid)
                obj.open_tree(obj.current_channel_oid);
        }
        if (obj.display_personal && obj.has_personal_channel) {
            var $btn = $("<button type=\"button\" class=\"button channel-personal-btn\">"+utils.translate("My channel")+"</button>");
            $btn.click({ obj: obj }, function (evt) {
                evt.data.obj.open_personal_channel();
            });
            obj.$widget.prepend($btn);
        }
        obj.$place.empty();
        obj.$place.append(obj.$widget);
        if (obj.on_tree_loaded)
            obj.on_tree_loaded();
    });
};
MSTreeManager.prototype.load_tree = function (oid, callback) {
    if (oid === undefined)
        return;
    if (this.content[oid] && this.content[oid].loaded) {
        if (callback)
            callback({ success: true, oid: oid });
        return;
    }
    if (this.loading) {
        // add loading to queue
        this.loading_queue[oid] = callback;
        return;
    }

    this.loading = true;
    if (!this.content[oid])
        this.content[oid] = { oid: oid };

    var data = { recursive: "no" };
    if (oid != "0")
        data.parent_oid = oid;
    var obj = this;
    // get place to display channel tree
    var $target = $("#" + this.id_prefix + "tree_channel_" + oid, this.$widget);
    if (!$target.length) {
        // channel has no sub channels, nothing to load
        this.loading = false;
        if (callback)
            callback({ success: true, oid: oid });
        return;
    }
    // display loading if it is too long
    this.content[oid].timeout = setTimeout(function () {
        obj.content[oid].timeout = null;
        $target.css("display", "block");
        $target.html("<li style=\"display: block;\"><i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i> "+utils.translate("Loading")+"...</li>");
    }, 500);
    // load channel tree
    var scallback = function (response) {
        obj._on_tree_loaded(response, oid, $target, callback);
    };
    var ecallback = function (xhr, textStatus, thrownError) {
        if (xhr.status) {
            if (xhr.status == 401)
                return obj._on_tree_loaded({ success: false, error: utils.translate("Unable to get channels tree because you are not logged in.") }, oid, $target, callback);
            if (xhr.status == 403)
                return obj._on_tree_loaded({ success: false, error: utils.translate("Unable to get channels tree because you cannot access to this channel.") }, oid, $target, callback);
            if (xhr.status == 404)
                return obj._on_tree_loaded({ success: false, error: utils.translate("Channel does not exist.") }, oid, $target, callback);
            if (xhr.status == 500)
                return obj._on_tree_loaded({ success: false, error: utils.translate("An error occurred in the server. Please try again later.") }, oid, $target, callback);
        }
        if (textStatus == "timeout") {
            obj._on_tree_loaded({ success: false, error: utils.translate("Unable to get channels tree. Request timed out.") }, oid, $target, callback);
        } else if (textStatus == "error") {
            obj._on_tree_loaded({ success: false, error: utils.translate("The server cannot be reached.") }, oid, $target, callback);
        } else {
            obj._on_tree_loaded({ success: false, error: utils.translate("An error occurred during request:")+"<br/>&nbsp;&nbsp;&nbsp;&nbsp;"+textStatus+" "+thrownError }, oid, $target, callback);
        }
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
MSTreeManager.prototype._on_tree_loaded = function (result, oid, $target, callback) {
    if (this.content[oid].timeout) {
        clearTimeout(this.content[oid].timeout);
        delete this.content[oid].timeout;
    }
    var next_load;
    if (result.success) {
        if (result.channels) {
            // get html
            var html = "";
            for (var i=0; i < result.channels.length; i++) {
                var channel = result.channels[i];
                if (oid != "0") {
                    channel.parent_oid = oid;
                    channel.parent_title = this.content[oid] ? this.content[oid].title : "load error";
                } else {
                    channel.parent_oid = "0";
                    channel.parent_title = utils.translate("Root");
                }
                if (!this.content[channel.oid]) {
                    this.content[channel.oid] = channel;
                } else {
                    for (var field in channel) {
                        this.content[channel.oid][field] = channel[field];
                    }
                }
                if (this.on_data_retrieved)
                    this.on_data_retrieved(channel);
                var button = "";
                if (channel.channels) {
                    button = "<button type=\"button\" aria-expanded=\"false\" aria-controls=\"tree_channel_" + channel.oid + "\" aria-label=\"" + channel.title + "\" data-ref=\"" + channel.oid +
                               "\" class=\"channel-toggle button-text list-entry\">" +
                                 "<i class=\"fa fa-fw fa-angle-right\" aria-hidden=\"true\"></i>" +
                             "</button>";
                }
                html += "<li><span id=\"" + this.id_prefix + "tree_channel_" + channel.oid + "_link\" data-ref=\"" + channel.oid +
                               "\" class=\"" + (!this.on_change ? "aside-list-btn" : "") + (this.current_channel_oid == channel.oid ? " channel-active" : "") + "\">" + button;
                if (this.on_change)
                    html += "<button " + (channel.language ? "lang=\"" + channel.language + "\"" : "") + " type=\"button\" data-ref=\""+channel.oid+"\" class=\"channel-btn\"" + (this.current_channel_oid == channel.oid ? " title=\""+utils.escape_html(channel.title)+" " + utils.translate("selected") + "\"" : "") +">"+utils.escape_html(channel.title)+"</button>";
                else
                    html += "<a " + (channel.language ? "lang=\"" + channel.language + "\"" : "") + " href=\""+this.channels_base_url+channel[this.channels_url_field]+"\" class=\"channel-btn\">"+utils.escape_html(channel.title)+"</a>";
                html += "</span>";
                if (channel.channels)
                    html += "<ul class=\"list border-color-blue\" id=\"" + this.id_prefix + "tree_channel_"+channel.oid+"\"></ul>";
                html += "</li>";
                if (this.loading_queue[channel.oid] !== undefined) {
                    next_load = {oid: channel.oid, cb: this.loading_queue[channel.oid]};
                    delete this.loading_queue[channel.oid];
                }
            }
            var $html = $(html);
            $target.empty();
            $target.append($html);
            // bind click events
            if (this.on_change) {
                $(".channel-btn", $html).click({ obj: this }, function (evt) {
                    evt.data.obj.on_change($(this).attr("data-ref"));
                });
            }
            $(".channel-toggle", $html).click({ obj: this }, function (evt) {
                evt.stopPropagation();
                evt.data.obj.toggle_channel($(this).attr("data-ref"));
            });
            $(".aside-list-btn", $html).click({ obj: this }, function (evt) {
                evt.stopPropagation();
                evt.data.obj.toggle_channel($(this).attr("data-ref"));
            });
        }
        this.content[oid].loaded = true;
        if (result.personal_channel)
            this.has_personal_channel = true;
    } else if (result.error) {
        $target.html("<li class=\"error\">"+result.error+"</li>");
    } else {
        $target.html("<li class=\"error\">"+utils.translate("No information about error.")+"</li>");
    }

    this.loading = false;
    if (next_load)
        this.load_tree(next_load.oid, next_load.cb);
    if (callback) {
        result.oid = oid;
        callback(result);
    }
};
MSTreeManager.prototype.open_tree = function (oid) {
    if (oid == "0")
        return;
    // check that the path is known
    var obj = this;
    var on_path_known = function () {
        var oids = [];
        var channel = obj.content[oid];
        while (channel) {
            oids.push(channel.oid);
            channel = obj.content[channel.parent_oid];
        }
        oids.reverse();
        for (var i=0; i < oids.length; i ++) {
            if (oids[i] != "0") {
                obj.load_tree(oids[i], function (result) {
                    $("#" + obj.id_prefix + "tree_channel_" + result.oid, obj.$widget).css("display", "block").addClass("active");
                    $("#" + obj.id_prefix + "tree_channel_" + result.oid + "_link .channel-toggle", obj.$widget).addClass("fa-rotate-90");
                    $("#" + obj.id_prefix + "tree_channel_" + result.oid + "_link .channel-toggle", obj.$widget).attr("aria-expanded", true);
                });
            }
        }
    };
    if (!this.content[oid])
        this.content[oid] = { oid: oid };
    if (this.content[oid].parent_oid === undefined) {
        this.load_path(oid, function (result) {
            var path = [];
            if (result.path && result.path.length > 0)
                path = result.path;
            path.push(obj.content[oid]);
            for (var i=0; i < path.length; i ++) {
                var channel = path[i];
                if (i > 0)
                    channel.parent_oid = path[i - 1].oid;
                else
                    channel.parent_oid = "0";
                if (!obj.content[channel.oid]) {
                    obj.content[channel.oid] = channel;
                } else {
                    for (var field in channel) {
                        obj.content[channel.oid][field] = channel[field];
                    }
                }
                if (obj.on_data_retrieved)
                    obj.on_data_retrieved(channel);
            }
            on_path_known();
        });
    } else {
        on_path_known();
    }
};
MSTreeManager.prototype.close_tree = function (oid) {
    $("#" + this.id_prefix + "tree_channel_" + oid, this.$widget).css("display", "none").removeClass("active");
    $("#" + this.id_prefix + "tree_channel_" + oid + "_link .channel-toggle", this.$widget).attr("aria-expanded", false);
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
    $(".channel-active button", this.$widget).removeAttr("title");
    $(".channel-active", this.$widget).removeClass("channel-active");
    this.current_channel_oid = oid;
    $("#" + this.id_prefix + "tree_channel_" + this.current_channel_oid + "_link", this.$widget).addClass("channel-active");
    $("#" + this.id_prefix + "tree_channel_" + this.current_channel_oid + "_link button", this.$widget).attr("title", $("#" + this.id_prefix + "tree_channel_" + this.current_channel_oid + "_link", this.$widget).text() + " " + utils.translate("selected"));
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

MSTreeManager.prototype.open_personal_channel = function () {
    var obj = this;
    var callback = function (response) {
        if (response.success) {
            obj.personal_channel_info = response;
            $(".channel-personal-btn", obj.$widget).html(utils.translate("My channel"));
            obj.open_tree(response.oid);
            if (obj.on_change)
                obj.on_change(response.oid);
        } else {
            $(".channel-personal-btn", obj.$widget).html(utils.translate("My channel") + " (" + response.xhr.status + ")");
        }
    };
    if (!this.personal_channel_info) {
        MSAPI.ajax_call("get_channels_personal", {}, function (response) {
            callback(response);
        });
    } else {
        callback(this.personal_channel_info);
    }
};
