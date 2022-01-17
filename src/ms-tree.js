/*******************************************
* MediaServer - Tree manager               *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */
/* global MSAPIClient */

function MSTreeManager (options) {
    // params
    this.$place = null;
    this.msapi = null;
    this.displayRoot = false;
    this.displayPersonal = false;
    this.autoInit = true;
    this.currentChannelOid = '0';
    this.onChange = null;
    this.onDataRetrieved = null;
    this.onTreeLoaded = null;
    this.channelsBaseUrl = '/channels/#';
    this.channelsUrlField = 'slug';
    this.treeUrl = '';
    this.pathUrl = '';

    // vars
    this.$widget = null;
    this.loaded = false;
    this.loading = false;
    this.content = {'0': {'oid': '0', 'parent_oid': null}};
    this.loadingQueue = {};
    this.hasPersonalChannel = false;
    this.personalChannelInfo = null;

    jsu.setObjectAttributes(this, options, [
        // allowed options
        '$place',
        'msapi',
        'displayRoot',
        'displayPersonal',
        'autoInit',
        'currentChannelOid',
        'onChange',
        'onDataRetrieved',
        'onTreeLoaded',
        'channelsBaseUrl',
        'channelsUrlField',
        'treeUrl',
        'pathUrl'
    ]);
    this.initialOid = this.currentChannelOid;
    if (!this.msapi) {
        this.msapi = new MSAPIClient(options);
    }
    if (this.autoInit) {
        const obj = this;
        $(document).ready(function () {
            obj.init();
        });
    }
}

MSTreeManager.prototype.init = function () {
    if (this.loaded || this.loading) {
        return;
    }
    if (!this.$place) {
        return console.log('No place defined for tree.');
    }
    if (!this.$place.length) {
        return console.log('Place for tree doesn\'t exist. Requested place:', this.$place);
    }

    this.loading = true;

    if (window.location.search) {
        this.channelsBaseUrl = this.channelsBaseUrl.substring(0, this.channelsBaseUrl.length - 1) + window.location.search + '#';
    }

    this.idPrefix = '';
    while ($('#' + this.idPrefix + 'tree_channel_0').length > 0) {
        this.idPrefix += '_';
    }

    // display link for root if displayRoot
    let html = '<div>';
    if (this.displayRoot) {
        html += '<div id="' + this.idPrefix + 'tree_channel_0_link" ' + (this.currentChannelOid == '0' ? 'class="channel-active"' : '') + '>';
        if (this.onChange) {
            html += '<button type="button" data-ref="0" class="channel-btn"' + (this.currentChannelOid == '0' ? 'title="' + jsu.translateAttribute('Root') + ' ' + jsu.translateAttribute('selected') + '"' : '') + '>' + jsu.translateHTML('Root') + '</button>';
        } else {
            html += '<a href="' + this.channelsBaseUrl + '" class="channel-btn"' + (this.currentChannelOid == '0' ? 'title="' + jsu.translateAttribute('Root') + ' ' + jsu.translateAttribute('selected') + '"' : '') + '>' + jsu.translateHTML('Root') + '</a>';
        }
        html += '</div>';
    }
    html += '<ul class="list js-active-item border-color-blue active" id="' + this.idPrefix + 'tree_channel_0"></ul></div>';
    this.$widget = $(html);
    if (this.displayRoot && this.onChange) {
        $('.channel-btn', this.$widget).click({ obj: this }, function (evt) {
            evt.data.obj.onChange($(this).attr('data-ref'));
        });
    }
    // load root
    const obj = this;
    this.loading = false;
    this.loadTree('0', function (result) {
        obj.loaded = true;
        if (result.success) {
            // open tree for selected channel
            if (obj.initialOid && obj.currentChannelOid == obj.initialOid) {
                obj.openTree(obj.currentChannelOid);
            }
        }
        if (obj.displayPersonal && obj.hasPersonalChannel) {
            const $btn = $('<button type="button" class="button channel-personal-btn"><i class="fa fa-bookmark" aria-hidden="true"></i> <span>' + jsu.translateHTML('My channel') + '</span></button>');
            $btn.click({ obj: obj }, function (evt) {
                evt.data.obj.openPersonalChannel();
            });
            obj.$widget.prepend($btn);
        }
        obj.$place.empty();
        obj.$place.append(obj.$widget);
        if (obj.onTreeLoaded) {
            obj.onTreeLoaded();
        }
    });
};
MSTreeManager.prototype.loadTree = function (oid, callback) {
    if (oid === undefined) {
        return;
    }
    if (this.content[oid] && this.content[oid].loaded) {
        if (callback) {
            callback({ success: true, oid: oid });
        }
        return;
    }
    if (this.loading) {
        // add loading to queue
        this.loadingQueue[oid] = callback;
        return;
    }

    this.loading = true;
    if (!this.content[oid]) {
        this.content[oid] = { oid: oid };
    }

    const data = { recursive: 'no' };
    if (oid != '0') {
        /* eslint-disable camelcase */
        data.parent_oid = oid;
        /* eslint-enable camelcase */
    }
    const obj = this;
    // get place to display channel tree
    const $target = $('#' + this.idPrefix + 'tree_channel_' + oid, this.$widget);
    if (!$target.length) {
        // channel has no sub channels, nothing to load
        this.loading = false;
        if (callback) {
            callback({ success: true, oid: oid });
        }
        return;
    }
    // display loading if it is too long
    this.content[oid].timeout = setTimeout(function () {
        obj.content[oid].timeout = null;
        $target.css('display', 'block');
        $target.html('<li style="display: block;"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i> ' + jsu.translateHTML('Loading') + '...</li>');
    }, 500);
    // load channel tree
    const scallback = function (response) {
        obj._onTreeLoaded(response, oid, $target, callback);
    };
    const ecallback = function (xhr, textStatus, thrownError) {
        if (xhr.status) {
            switch (xhr.status) {
                case 401:
                    return obj._onTreeLoaded({ success: false, error: jsu.translate('Unable to get channels tree because you are not logged in.') }, oid, $target, callback);
                case 403:
                    return obj._onTreeLoaded({ success: false, error: jsu.translate('Unable to get channels tree because you cannot access to this channel.') }, oid, $target, callback);
                case 404:
                    return obj._onTreeLoaded({ success: false, error: jsu.translate('Channel does not exist.') }, oid, $target, callback);
                case 500:
                    return obj._onTreeLoaded({ success: false, error: jsu.translate('An error occurred in the server. Please try again later.') }, oid, $target, callback);
            }
        }
        if (textStatus == 'timeout') {
            obj._onTreeLoaded({ success: false, error: jsu.translate('Unable to get channels tree. Request timed out.') }, oid, $target, callback);
        } else if (textStatus == 'error') {
            obj._onTreeLoaded({ success: false, error: jsu.translate('The server cannot be reached.') }, oid, $target, callback);
        } else {
            obj._onTreeLoaded({ success: false, error: jsu.translate('An error occurred during request:') + '<br/>&nbsp;&nbsp;&nbsp;&nbsp;' + textStatus + ' ' + thrownError }, oid, $target, callback);
        }
    };
    if (this.treeUrl) {
        $.ajax({
            url: this.treeUrl,
            data: data,
            dataType: 'json',
            cache: false,
            success: scallback,
            error: ecallback
        });
    } else {
        this.msapi.ajaxCall('getChannelsTree', data, function (response) {
            if (response.success) {
                scallback(response);
            } else {
                ecallback(response.xhr, response.textStatus, response.thrownError);
            }
        });
    }
};
MSTreeManager.prototype._onTreeLoaded = function (result, oid, $target, callback) {
    if (this.content[oid].timeout) {
        clearTimeout(this.content[oid].timeout);
        delete this.content[oid].timeout;
    }
    let nextLoad;
    if (result.success) {
        if (result.channels) {
            // get html
            let html = '';
            for (let i = 0; i < result.channels.length; i++) {
                const channel = result.channels[i];
                /* eslint-disable camelcase */
                if (oid != '0') {
                    channel.parent_oid = oid;
                } else {
                    channel.parent_oid = '0';
                }
                /* eslint-enable camelcase */
                if (!this.content[channel.oid]) {
                    this.content[channel.oid] = channel;
                } else {
                    let field;
                    for (field in channel) {
                        this.content[channel.oid][field] = channel[field];
                    }
                }
                if (this.onDataRetrieved) {
                    this.onDataRetrieved(channel);
                }
                let button = '';
                if (channel.channels) {
                    button = '<button type="button" aria-expanded="false" aria-controls="tree_channel_' + channel.oid + '" aria-label="' + jsu.escapeAttribute(channel.title) + '" data-ref="' + channel.oid +
                               '" class="channel-toggle button-text list-entry">' +
                                 '<i class="fa fa-fw fa-angle-right" aria-hidden="true"></i>' +
                             '</button>';
                }
                html += '<li><span id="' + this.idPrefix + 'tree_channel_' + channel.oid + '_link" data-ref="' + channel.oid +
                               '" class="' + (!this.onChange ? 'aside-list-btn' : '') + (this.currentChannelOid == channel.oid ? ' channel-active' : '') + '">' + button;
                if (this.onChange) {
                    html += '<button ' + (channel.language ? 'lang="' + jsu.escapeAttribute(channel.language) + '"' : '') +
                        ' type="button" data-ref="' + channel.oid + '"' +
                        ' class="channel-btn"' + (this.currentChannelOid == channel.oid ? ' title="' + jsu.escapeAttribute(channel.title + ' ' + jsu.translate('selected')) + '"' : '') + '>' +
                        jsu.escapeHTML(channel.title) + '</button>';
                } else {
                    html += '<a ' + (channel.language ? 'lang="' + jsu.escapeAttribute(channel.language) + '"' : '') + ' href="' + this.channelsBaseUrl + channel[this.channelsUrlField] + '" class="channel-btn">' + jsu.escapeHTML(channel.title) + '</a>';
                }
                html += '</span>';
                if (channel.channels) {
                    html += '<ul class="list border-color-blue" id="' + this.idPrefix + 'tree_channel_' + channel.oid + '"></ul>';
                }
                html += '</li>';
                if (this.loadingQueue[channel.oid] !== undefined) {
                    nextLoad = {oid: channel.oid, cb: this.loadingQueue[channel.oid]};
                    delete this.loadingQueue[channel.oid];
                }
            }
            const $html = $(html);
            $target.empty();
            $target.append($html);
            // bind click events
            if (this.onChange) {
                $('.channel-btn', $html).click({ obj: this }, function (evt) {
                    evt.data.obj.onChange($(this).attr('data-ref'));
                });
            }
            $('.channel-toggle', $html).click({ obj: this }, function (evt) {
                evt.stopPropagation();
                evt.data.obj.toggleChannel($(this).attr('data-ref'));
            });
            $('.aside-list-btn', $html).click({ obj: this }, function (evt) {
                evt.stopPropagation();
                evt.data.obj.toggleChannel($(this).attr('data-ref'));
            });
        }
        this.content[oid].loaded = true;
        if (result.personal_channel) {
            this.hasPersonalChannel = true;
        }
    } else if (result.error) {
        $target.html('<li class="error">' + jsu.escapeHTML(result.error) + '</li>');
    } else {
        $target.html('<li class="error">' + jsu.translateHTML('No information about error.') + '</li>');
    }

    this.loading = false;
    if (nextLoad) {
        this.loadTree(nextLoad.oid, nextLoad.cb);
    }
    if (callback) {
        result.oid = oid;
        callback(result);
    }
};
MSTreeManager.prototype.openTree = function (oid) {
    if (oid == '0') {
        return;
    }
    // check that the path is known
    const obj = this;
    const onPathKnown = function () {
        const oids = [];
        let channel = obj.content[oid];
        while (channel) {
            oids.push(channel.oid);
            channel = obj.content[channel.parent_oid];
        }
        oids.reverse();
        for (let i = 0; i < oids.length; i++) {
            if (oids[i] != '0') {
                obj.loadTree(oids[i], function (result) {
                    $('#' + obj.idPrefix + 'tree_channel_' + result.oid, obj.$widget).css('display', 'block').addClass('active');
                    $('#' + obj.idPrefix + 'tree_channel_' + result.oid + '_link .channel-toggle', obj.$widget).addClass('fa-rotate-90');
                    $('#' + obj.idPrefix + 'tree_channel_' + result.oid + '_link .channel-toggle', obj.$widget).attr('aria-expanded', true);
                });
            }
        }
    };
    if (!this.content[oid]) {
        this.content[oid] = { oid: oid };
    }
    if (this.content[oid].parent_oid === undefined) {
        this.loadPath(oid, function (result) {
            let path = [];
            if (result.path && result.path.length > 0) {
                path = result.path;
            }
            path.push(obj.content[oid]);
            for (let i = 0; i < path.length; i++) {
                const channel = path[i];
                /* eslint-disable camelcase */
                if (i > 0) {
                    channel.parent_oid = path[i - 1].oid;
                } else {
                    channel.parent_oid = '0';
                }
                /* eslint-enable camelcase */
                if (!obj.content[channel.oid]) {
                    obj.content[channel.oid] = channel;
                } else {
                    let field;
                    for (field in channel) {
                        obj.content[channel.oid][field] = channel[field];
                    }
                }
                if (obj.onDataRetrieved) {
                    obj.onDataRetrieved(channel);
                }
            }
            onPathKnown();
        });
    } else {
        onPathKnown();
    }
};
MSTreeManager.prototype.closeTree = function (oid) {
    $('#' + this.idPrefix + 'tree_channel_' + oid, this.$widget).css('display', 'none').removeClass('active');
    $('#' + this.idPrefix + 'tree_channel_' + oid + '_link .channel-toggle', this.$widget).attr('aria-expanded', false);
    $('#' + this.idPrefix + 'tree_channel_' + oid + '_link .channel-toggle', this.$widget).removeClass('fa-rotate-90');
};
MSTreeManager.prototype.toggleChannel = function (oid) {
    const $btn = $('#' + this.idPrefix + 'tree_channel_' + oid + '_link .channel-toggle', this.$widget);
    if ($btn.hasClass('fa-rotate-90')) {
        this.closeTree(oid);
    } else {
        this.openTree(oid);
    }
};

MSTreeManager.prototype.setActive = function (oid) {
    if (this.currentChannelOid == oid) {
        return;
    }
    $('.channel-active button', this.$widget).removeAttr('title');
    $('.channel-active', this.$widget).removeClass('channel-active');
    this.currentChannelOid = oid;
    $('#' + this.idPrefix + 'tree_channel_' + this.currentChannelOid + '_link', this.$widget).addClass('channel-active');
    $('#' + this.idPrefix + 'tree_channel_' + this.currentChannelOid + '_link button', this.$widget).attr('title', $('#' + this.idPrefix + 'tree_channel_' + this.currentChannelOid + '_link', this.$widget).text() + ' ' + jsu.translate('selected'));
    this.openTree(oid);
};

MSTreeManager.prototype.loadPath = function (oid, callback) {
    const data = { oid: oid };
    const scallback = function (response) {
        if (!response.success) {
            console.log('Error getting path for oid ' + oid + '. Error: ' + response.error);
        }
        callback(response);
    };
    const ecallback = function (xhr, textStatus, thrownError) {
        console.log('Error getting path for oid ' + oid + '. Error: ' + textStatus + ' | ' + thrownError);
        callback({ success: false, error: textStatus + ' | ' + thrownError });
    };
    if (this.pathUrl) {
        $.ajax({
            url: this.pathUrl,
            data: data,
            dataType: 'json',
            cache: false,
            success: scallback,
            error: ecallback
        });
    } else {
        this.msapi.ajaxCall('getChannelsPath', data, function (response) {
            if (response.success) {
                scallback(response);
            } else {
                ecallback(response.xhr, response.textStatus, response.thrownError);
            }
        });
    }
};

MSTreeManager.prototype.openPersonalChannel = function () {
    const obj = this;
    const callback = function (response) {
        if (response.success) {
            obj.personalChannelInfo = response;
            $('.channel-personal-btn span', obj.$widget).text(jsu.translate('My channel'));
            obj.openTree(response.oid);
            if (obj.onChange) {
                obj.onChange(response.oid);
            } else {
                window.location.hash = '#' + response.slug;
            }
        } else {
            $('.channel-personal-btn span', obj.$widget).text(jsu.translate('My channel') + ' (' + response.xhr.status + ')');
        }
    };
    if (!this.personalChannelInfo) {
        this.msapi.ajaxCall('getChannelsPersonal', {}, function (response) {
            callback(response);
        });
    } else {
        callback(this.personalChannelInfo);
    }
};
