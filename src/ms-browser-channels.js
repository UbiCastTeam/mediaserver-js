/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */
/* global MSTreeManager */

function MSBrowserChannels (options) {
    // params
    this.browser = null;
    this.displayItunesRss = false;
    this.currentChannelOid = '0';
    // vars
    this.$menu = null;
    this.$content = null;
    this.treeManager = null;
    this.order = 'default';
    this.lastResponse = null;

    jsu.setObjectAttributes(this, options, [
        // allowed options
        'browser',
        'displayItunesRss',
        'currentChannelOid'
    ]);
    this.initOptions = options ? options : {};
}

MSBrowserChannels.prototype.getMenuJq = function () {
    let html = '';
    html += '<div id="ms_browser_channels_menu" style="display: none;">';
    html += '</div>';
    this.$menu = $(html);
    return this.$menu;
};
MSBrowserChannels.prototype.getContentJq = function () {
    let html = '';
    html += '<div id="ms_browser_channels" class="ms-browser-content" style="display: none;">';
    if (this.browser.treeManager) {
        html += '<div class="ms-browser-tree-place ms-channels-tree">';
        html += '<div><i class="fa fa-spinner fa-spin" aria-hidden="true"></i> ' + jsu.translate('Loading...') + '</div>';
        html += '</div>';
    }
    html += '<div class="ms-browser-channels-place">';
    html += '<div class="messages"><div class="message info">' + jsu.translate('Select a channel to display its content.') + '</div></div>';
    html += '</div>';
    html += '</div>';
    this.$content = $(html);
    this.$place = $('.ms-browser-channels-place', this.$content);
    return this.$content;
};

MSBrowserChannels.prototype.refreshTitle = function () {
    if (this.browser.getActiveTab() != 'channels') {
        return;
    }
    const item = this.lastResponse ? this.lastResponse.info : undefined;
    if (item && item.oid != '0') {
        let html = '<span class="item-entry-preview"><img src="' + item.thumb + '" alt="' + jsu.escapeHTML(item.title) + '"/></span>';
        html += '<span class="channel-titles-place">';
        const parentTitle = item.parent_oid && item.parent_oid != '0' ? item.parent_title : jsu.translate('Root');
        if (!this.browser.useOverlay && parentTitle) {
            html += '<a class="parent-channel-title" href="#' + (item.parent_slug ? item.parent_slug : '') + '"' + (item.parent_language ? 'lang="' + item.parent_language + '"' : '') + '>' + jsu.escapeHTML(parentTitle) + '</a>';
        }
        html += '<span class="channel-title"' + (item.language ? 'lang="' + item.language + '"' : '') + '>' + jsu.escapeHTML(item.title) + '</span>';
        html += '</span>';
        if (this.browser.currentSelection && this.browser.currentSelection.oid == item.oid) {
            html = '<span class="selected">' + html + '</span>';
        }
        this.browser.setTitle(item.title, html);
    } else if (this.browser.ltiMode) {
        this.browser.setTitle(jsu.translate('My channel'));
    } else {
        this.browser.setTitle(jsu.translate('Main channels'));
    }
};

MSBrowserChannels.prototype.onShow = function () {
    this.refreshTitle();
    if (this.initialized) {
        return;
    }
    this.initialized = true;

    this.defaultLogoSrc = $('#mainlogo .header-logo').attr('src');
    this.defaultFavSrc = $('#favicon_link').attr('src');

    // tree manager
    const obj = this;
    if (this.browser.treeManager) {
        const params = {
            $place: $('.ms-browser-tree-place', this.$content),
            msapi: this.browser.msapi,
            displayRoot: this.browser.displayableContent.indexOf('c') != -1,
            displayPersonal: true,
            currentChannelOid: this.currentChannelOid,
            onDataRetrieved: function (data) {
                obj.browser.updateCatalog(data);
            }
        };
        if (this.browser.pickMode) {
            params.onChange = function (oid) {
                obj.displayChannel(oid);
            };
        }
        this.treeManager = new MSTreeManager(params);
    }

    // load first channel
    if (this.initOptions.initialState && this.initOptions.initialState.channelSlug) {
        this.displayChannelBySlug(this.initOptions.initialState.channelSlug);
    } else if (this.browser.filterSpeaker == 'self') {
        this.displayPersonalChannel();
    } else {
        this.displayChannel(this.currentChannelOid);
    }
};

MSBrowserChannels.prototype.setOrder = function (order) {
    this.order = order ? order : 'default';
    this.refreshDisplay(true);
};
MSBrowserChannels.prototype.displayPersonalChannel = function () {
    const obj = this;
    if (!this.personalChannelOid) {
        this.browser.msapi.ajaxCall('getChannelsPersonal', {}, function (response) {
            if (response.success) {
                obj.personalChannelOid = response.oid;
                obj.displayChannel(response.oid);
            } else if (response.errorCode == 403) {
                obj._onChannelError({ error: jsu.translate('You are not allowed to have a personnal channel.') });
            } else {
                obj._onChannelError(response);
            }
        });
    } else {
        obj.displayChannel(this.personalChannelOid);
    }
};
MSBrowserChannels.prototype.displayChannelBySlug = function (slug) {
    const obj = this;
    this.browser.getInfoForSlug(slug, false, true, function (response) {
        if (!response.success) {
            obj._onChannelError(response);
        } else {
            obj.displayChannel(response.info.oid);
        }
    });
};
MSBrowserChannels.prototype.displayChannel = function (oid) {
    this.currentChannelOid = oid;
    this.browser.boxHideInfo();

    if (!this.initialized) {
        return;
    }
    this.browser.displayLoading();
    if (this.treeManager) {
        this.treeManager.setActive(oid);
    }
    if (oid != '0') {
        const obj = this;
        this.browser.getInfoForOid(oid, true, function (response) {
            obj._onChannelInfo(response, oid);
        });
    } else {
        this._onChannelInfo(null, oid);
    }
};
MSBrowserChannels.prototype.displayParent = function () {
    if (!this.currentChannelOid) {
        return;
    }
    const oid = this.currentChannelOid;
    const parentOid = (this.browser.catalog[oid] && this.browser.catalog[oid].parent_oid) ? this.browser.catalog[oid].parent_oid : '0';
    this.displayChannel(parentOid);
};

MSBrowserChannels.prototype._onChannelError = function (response) {
    this.lastResponse = null;

    let message = '<div class="messages">';
    if (!this.browser.useOverlay && (response.errorCode == '403' || response.errorCode == '401')) {
        const loginUrl = this.browser.urlLogin + '?next=' + window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : '');
        message += '<div class="item-description">';
        message += '<div class="message error">' + response.error + '</div>';
        message += '<p>' + jsu.translate('Please login to access this channel') + '<br /> <a href="' + loginUrl + '">' + jsu.translate('Sign in') + '</a></p>';
        message += '</div>';
    } else {
        message += '<div class="message error">' + response.error + '</div>';
    }
    message += '</div>';
    this.$place.html(message);
};

MSBrowserChannels.prototype._onChannelInfo = function (responseInfo, oid) {
    if (this.currentChannelOid != oid) {
        this.browser.hideLoading();
        return;
    }
    if (responseInfo && !responseInfo.success) {
        return this._onChannelError(responseInfo);
    }

    const data = {};
    /* eslint-disable camelcase */
    if (oid && oid != '0') {
        data.parent_oid = oid;
    }
    if (this.browser.parentSelectionOid) {
        data.parent_selection_oid = this.browser.parentSelectionOid;
    }
    /* eslint-enable camelcase */
    if (this.browser.displayableContent) {
        data.content = this.browser.displayableContent;
    }
    if (this.browser.filterEditable !== null) {
        data.editable = this.browser.filterEditable ? 'yes' : 'no';
    }
    if (this.browser.filterValidated !== null) {
        data.validated = this.browser.filterValidated ? 'yes' : 'no';
    }
    if (!this.browser.ltiMode && this.browser.filterSpeaker !== null) {
        data.speaker = this.browser.filterSpeaker;
    }
    if (this.browser.filterNoCategories) {
        data.no_categories = true; // eslint-disable-line camelcase
    } else if (this.browser.filterCategories.length > 0) {
        data.categories = this.browser.filterCategories.join('\n');
    }
    data.order_by = this.order; // eslint-disable-line camelcase
    const obj = this;
    this.browser.msapi.ajaxCall('getChannelsContent', data, function (response) {
        // Merge response
        if (responseInfo) {
            /* eslint-disable camelcase */
            if (responseInfo.info) {
                response.info = responseInfo.info;
            }
            if (responseInfo.parent_selectable) {
                response.parent_selectable = responseInfo.parent_selectable;
            }
            if (responseInfo.selectable) {
                response.selectable = responseInfo.selectable;
            }
            /* eslint-enable camelcase */
        }
        obj._onChannelContent(response, oid);
    });
};

MSBrowserChannels.prototype._onChannelContent = function (response, oid) {
    this.browser.hideLoading();
    if (this.currentChannelOid != oid) {
        return;
    }
    if (!response.success) {
        return this._onChannelError(response);
    }

    this.lastResponse = response;

    if (!this.browser.useOverlay && this.browser.displayAsThumbnails) {
        this.browser.boxHideInfo();
    }

    // update top bar
    this.$menu.html('');
    let $entryLinks;
    if (oid != '0') {
        // back to parent button
        if (!this.browser.ltiMode || oid != this.personalChannelOid) {
            const parentOid = response.info.parent_oid ? response.info.parent_oid : '0';
            const parentTitle = response.info.parent_title ? response.info.parent_title : jsu.translate('Parent channel');
            const parent = {
                oid: parentOid,
                title: parentTitle,
                slug: response.info.parent_slug
            };
            if (response.info.parent_oid && response.info.parent_slug) {
                this.browser.updateCatalog(parent);
            }
            let $back;
            if (!this.browser.useOverlay) {
                $back = $('<a class="button ' + this.browser.btnClass + ' back-button" href="' + this.browser.getButtonLink(parent, 'view') + '"></a>');
            } else {
                $back = $('<button type="button" class="button ' + this.browser.btnClass + ' back-button"></button>');
                $back.click({ obj: this, oid: parent.oid }, function (event) {
                    event.data.obj.displayChannel(event.data.oid);
                });
            }
            if (!this.browser.useOverlay && $('.navbar .back.button-text').length > 0) {
                $back.html('<i class="fa fa-chevron-circle-up fa-fw fa-2x" aria-hidden="true"></i>');
                $back.attr('title', jsu.translate('Parent channel'));
                $back.attr('aria-label', jsu.translate('Parent channel'));
                $back.addClass('back').addClass('button-text');
                $('.navbar .back.button-text').replaceWith($back);
            } else {
                $back.html('<i class="fa fa-chevron-circle-up" aria-hidden="true"></i> <span class="hidden-below-800">' + jsu.translate('Parent channel') + '</span>');
                this.$menu.append($back);
            }
            if (this.browser.pickMode) {
                const availableStorageHtml = this.browser.msapi.getAvailableStorageDisplay(response.info);
                if (availableStorageHtml) {
                    this.$menu.append(availableStorageHtml + ' ');
                    if (!window.uwlb) {
                        $('.tooltip-button', this.$menu).click(function () {
                            $('span', this).toggle();
                        });
                    }
                }
            }
        }
        // current channel buttons
        const currentSelectable = this.browser.selectableContent.indexOf('c') != -1 && (!this.browser.parentSelectionOid || response.selectable);
        $entryLinks = this.browser.getEntryLinks(response.info, 'current', currentSelectable);
    } else {
        response.oid = '0';
        $entryLinks = this.browser.getEntryLinks(response, 'current', false);
        if (!this.browser.useOverlay && $('.navbar .back.button-text').length > 0) {
            $('.navbar .back.button-text').attr('href', '..');
        }
    }
    if ($entryLinks) {
        this.$menu.append($entryLinks);
    }

    // update list place
    this.$place.html('');
    if (this.browser.useOverlay) {
        this.$place.scrollTop(0);
    } else {
        // current Channel data
        if (oid != '0') {
            const $currentItemDesc = $('<div class="item-description"></div>');
            let isEmpty = true;
            let storageDisplay = response.info.can_edit ? this.browser.msapi.getStorageDisplay(response.info) : '';
            if (response.info.views || response.info.comments) {
                let annoAndViews = '<div class="' + (response.info.short_description || response.info.display_rss_links || storageDisplay ? 'right' : 'align-right') + ' channel-description-stats">';
                if (response.info.views) {
                    annoAndViews += '<span class="inline-block">' + response.info.views + ' ' + jsu.translate('views');
                    if (response.info.views_last_month) {
                        annoAndViews += ', ' + response.info.views_last_month + ' ' + jsu.translate('this month');
                    }
                    annoAndViews += '</span>';
                }
                if (response.info.comments) {
                    annoAndViews += ' <span class="inline-block">' + response.info.comments + ' ' + jsu.translate('annotations');
                    if (response.info.comments_last_month) {
                        annoAndViews += ', ' + response.info.comments_last_month + ' ' + jsu.translate('this month');
                    }
                    annoAndViews += '</span>';
                }
                annoAndViews += '</div>';
                $currentItemDesc.append(annoAndViews);
                isEmpty = false;
            }
            if (response.info.short_description) {
                const $desc = $('<div class="channel-description-text">' + response.info.short_description + '</div>');
                if (response.info.short_description != response.info.description) {
                    $desc.addClass('short-desc');
                    $desc.click({ description: response.info.description }, function (event) {
                        $(this).html(event.data.description).unbind('click').removeClass('short-desc');
                    });
                }
                $currentItemDesc.append($desc);
                isEmpty = false;
            }
            if (response.info.items_count) {
                const results = [];
                if (response.info.channels_count) {
                    results.push(response.info.channels_count + ' ' + jsu.translate('channel(s)'));
                }
                if (response.info.videos_count) {
                    results.push(response.info.videos_count + ' ' + jsu.translate('video(s)'));
                }
                if (response.info.lives_count) {
                    results.push(response.info.lives_count + ' ' + jsu.translate('live stream(s)'));
                }
                if (response.info.pgroups_count) {
                    results.push(response.info.pgroups_count + ' ' + jsu.translate('photos group(s)'));
                }
                let countDisplay = '<div class="channel-items-count">' + jsu.translate('Channel content:');
                countDisplay += ' <span>' + jsu.escapeHTML(results.join(', ')) + '</span>';
                countDisplay += ' <button type="button" class="tooltip-button no-padding no-border no-background" aria-describedby="id_count_help" aria-label="' + jsu.translate('help') + '"><i class="fa fa-question-circle fa-fw" aria-hidden="true"></i><span role="tooltip" id="id_count_help" class="tooltip-hidden-content">' + jsu.translate('Sub channels items are included in counts.') + '</span></button>';
                countDisplay += '</div>';
                $currentItemDesc.append(countDisplay);
                if (!window.uwlb) {
                    $('.channel-items-count .tooltip-button', $currentItemDesc).click(function () {
                        $('span', this).toggle();
                    });
                }
                isEmpty = false;
            }
            if (storageDisplay) {
                storageDisplay = '<div class="channel-storage-usage">' + jsu.translate('Storage usage:') + ' ' + storageDisplay + '</div>';
                $currentItemDesc.append(storageDisplay);
                if (!window.uwlb) {
                    $('.channel-storage-usage .tooltip-button', $currentItemDesc).click(function () {
                        $('span', this).toggle();
                    });
                }
                isEmpty = false;
            }
            if (response.info.display_rss_links) {
                let rss = '<div class="channel-description-rss"> ';
                if (this.displayItunesRss) {
                    rss += ' <span class="inline-block">' + jsu.translate('Subscribe to channel videos RSS:') + '</span>';
                    rss += ' <a class="nowrap" href="/channels/' + response.info.oid + '/rss.xml">';
                    rss += '<i class="fa fa-rss" aria-hidden="true"></i> ' + jsu.translate('standard') + '</a>';
                    rss += ' <a class="nowrap" href="/channels/' + response.info.oid + '/itunes-video.xml">';
                    rss += '<i class="fa fa-apple" aria-hidden="true"></i> ' + jsu.translate('iTunes') + '</a>';
                    rss += ' <a class="nowrap" href="/channels/' + response.info.oid + '/itunes-audio.xml">';
                    rss += '<i class="fa fa-apple" aria-hidden="true"></i> ' + jsu.translate('iTunes (audio only)') + '</a>';
                } else {
                    rss += ' <a class="nowrap" href="/channels/' + response.info.oid + '/rss.xml">';
                    rss += '<i class="fa fa-rss" aria-hidden="true"></i> ' + jsu.translate('Subscribe to channel videos RSS') + '</a>';
                }
                rss += '</div>';
                $currentItemDesc.append(rss);
                isEmpty = false;
            }
            if (!isEmpty) {
                this.$place.append($currentItemDesc);
            }
        }
        // channel custom CSS
        $('head .csslistlink').remove();
        if (response.info) {
            let csslinks = '';
            let index;
            for (index in response.info.css_list) {
                csslinks += '<link class="csslistlink" rel="stylesheet" type="text/css" href="' + response.info.css_list[index] + '"/>';
            }
            $('head').append(csslinks);
        }
        if (response.info && response.info.logo_url) {
            $('#mainlogo .header-logo').attr('src', response.info.logo_url);
        } else {
            $('#mainlogo .header-logo').attr('src', this.defaultLogoSrc);
        }
        if (response.info && response.info.favicon_url) {
            $('#faviconLink').attr('href', response.info.favicon_url);
        } else {
            $('#faviconLink').attr('href', this.defaultFavSrc);
        }
    }

    const nbChannels = response.channels ? response.channels.length : 0;
    const nbVideos = response.videos ? response.videos.length : 0;
    const nbLiveStreams = response.live_streams ? response.live_streams.length : 0;
    const nbPhotosGroups = response.photos_groups ? response.photos_groups.length : 0;
    const hasItems = nbChannels > 0 || nbVideos > 0 || nbLiveStreams > 0 || nbPhotosGroups > 0;
    // channel display
    this.refreshTitle();
    if (hasItems) {
        this.browser.displayContent(this.$place, response, oid, 'channels');
    } else {
        let msg;
        if (this.browser.selectableContent.indexOf('c') == -1) {
            msg = jsu.translate('This channel contains no media.');
        } else if (this.browser.displayableContent.length > 1) {
            msg = jsu.translate('This channel contains no sub channels and no media.');
        } else {
            msg = jsu.translate('This channel contains no sub channels.');
        }
        msg += '<br/>' + jsu.translate('Some contents may still exist in this channel but if it is the case your account is not allowed to see them.');
        this.$place.append('<div class="messages"><div class="message info">' + msg + '</div></div>');
    }
};

MSBrowserChannels.prototype.refreshDisplay = function (reset) {
    if (reset && this.lastResponse) {
        this.lastResponse = null;
    }
    if (this.lastResponse) {
        this._onChannelContent(this.lastResponse, this.currentChannelOid);
    } else if (this.browser.ltiMode) {
        this.displayPersonalChannel();
    } else {
        this.displayChannel(this.currentChannelOid);
    }
};

MSBrowserChannels.prototype.remove = function (oid) {
    if (this.currentChannelOid == oid) {
        // display parent channel
        const parentOid = (this.browser.catalog[oid] && this.browser.catalog[oid].parent_oid) ? this.browser.catalog[oid].parent_oid : '0';
        if (!this.browser.pickMode && this.browser.catalog[parentOid] && this.browser.catalog[parentOid].slug) {
            window.location.hash = '#' + this.browser.catalog[parentOid].slug;
        } else {
            this.displayChannel(parentOid);
        }
    } else {
        this.browser.removeOidFromTab(this, oid);
    }
};
