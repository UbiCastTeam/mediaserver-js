/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */
/* global MSAPIClient */
/* global MSBrowserChannels */
/* global MSBrowserLatest */
/* global MSBrowserSearch */
/* global OverlayDisplayManager */

function MSBrowser (options) {
    // params
    this.title = '';
    this.place = null;
    this.selectableContent = 'cvlp'; // v for videos, l for lives, p for photos group and c for channels
    this.displayableContent = 'cvlp';
    this.filterEditable = null;
    this.filterValidated = null;
    this.filterSpeaker = null;
    this.filterCategories = [];
    this.filterNoCategories = false;
    this.parentSelectionOid = null; // special for channel parent selection
    this.initialOid = null;
    this.initialState = null;
    this.onPick = null;
    this.hideHeader = false;
    this.btnClass = '';
    this.msapi = null;
    this.treeManager = true;
    this.displayTypesIcons = false;
    this.displayItunesRss = true;
    // vars
    this.useOverlay = true;
    this.pickMode = true;
    this.iframeMode = false;
    this.ltiMode = false;
    this.linksUrlParams = '';
    this.linksTarget = '';
    this.$widget = null;
    this.$menu = null;
    this.$main = null;
    this.overlay = null;

    this.catalog = {};
    this.displayAsThumbnails = false;
    this.displayed = 'channels';
    this.currentSelection = null;
    this.siteSettingsCategories = [];

    this.urlLogin = '/login/';
    this.urlChannels = '/channels/';
    this.urlLatest = '/latest/';
    this.urlSearch = '/search/';
    this.urlPostLink = '/lti/post-link/';

    this.defaultSearchIn = [];

    jsu.setObjectAttributes(this, options, [
        // allowed options
        'title',
        'place',
        'msapi',
        'selectableContent',
        'displayableContent',
        'filterEditable',
        'filterValidated',
        'filterSpeaker',
        'parentSelectionOid',
        'initialOid',
        'initialState',
        'onPick',
        'hideHeader',
        'btnClass',
        'treeManager',
        'displayTypesIcons',
        'displayItunesRss',
        'defaultSearchIn'
    ]);

    if (!this.msapi) {
        this.msapi = new MSAPIClient(options);
    }
    this.initOptions = options ? options : {};
    this.useOverlay = !(this.place);

    if (!this.useOverlay) {
        const obj = this;
        $(document).ready(function () {
            obj.init();
        });
    }
}

MSBrowser.prototype.init = function () {
    if (this.initialized) {
        return;
    }
    this.initialized = true;

    if (jsu.getCookie('catalog-displayMode') == 'thumbnail') {
        this.displayAsThumbnails = true;
        if (!this.useOverlay) {
            $('#container').removeClass('max-width-1200');
        }
    }

    if (jsu.getCookie('catalog-displayTypesIcons') == 'yes') {
        this.displayTypesIcons = true;
    }

    const urlData = this.parseUrl();

    if (!this.useOverlay) {
        this.pickMode = false;
        const urlParams = [];

        if (urlData.iframe) {
            this.iframeMode = true;
            this.urlLogin = '/login/iframe/';
            urlParams.push('iframe');
        }

        if (urlData.speaker) {
            this.filterSpeaker = urlData.speaker;
            urlParams.push('speaker=' + window.encodeURIComponent(this.filterSpeaker));
        }

        if (urlData.mine) {
            this.filterSpeaker = 'self';
            urlParams.push('mine');
            this.treeManager = false;
        }

        if (urlData.lti) {
            this.ltiMode = true;
            urlParams.push('lti');
        }

        if (urlData.newtab) {
            this.linksTarget = ' target="Blank"';
            urlParams.push('newtab');
        }

        if (urlData.pick) {
            this.pickMode = true;
            if (urlData.pick.toString().match(/^[cvlp]+$/)) {
                this.selectableContent = urlData.pick;
                this.displayableContent = urlData.pick;
                if (this.displayableContent.indexOf('c') < 0) {
                    this.displayableContent = 'c' + this.displayableContent;
                }
            } else {
                this.selectableContent = 'vlp';
                this.displayableContent = 'cvlp';
            }
            urlParams.push('pick=' + this.selectableContent);
            if (!this.initialOid && urlData.initial) {
                this.initialOid = urlData.initial.toString();
                urlParams.push('initial=' + window.encodeURIComponent(this.initialOid));
            }
        }

        if (urlData['return'] && ((window.parent && urlData['return'].toString().indexOf('postMessageAPI') === 0) || (urlData['return'].toString().indexOf('https://') === 0 && urlData['return'].toString().length > 8))) {
            if (!this.pickMode) {
                this.pickMode = true;
                this.selectableContent = 'vlp';
                this.displayableContent = 'cvlp';
                urlParams.push('pick=' + this.selectableContent);
            }
            urlParams.push('return=' + urlData['return']);
            let returnTarget;
            if (window.parent && urlData['return'].toString().indexOf('postMessageAPI') === 0) {
                returnTarget = urlData['return'];
            } else {
                returnTarget = this.urlPostLink + '?return=' + urlData['return'];
            }
            this.onPick = function (item, initialPick) {
                if (initialPick) {
                    return;
                }
                if (returnTarget.indexOf('postMessageAPI') === 0) {
                    const topFrame = window.opener ? window.opener.parent : window.parent;
                    const targetName = returnTarget.substring('postMessageAPI'.length).replace(/^: + |: + $/g, '');
                    topFrame.postMessage({item: item, initialPick: Boolean(initialPick), target: targetName}, '*');
                    if (window.opener) {
                        window.close();
                    }
                } else {
                    window.location = returnTarget + '&oid=' + item.oid;
                }
            };
        }

        if (urlParams.length > 0) {
            this.linksUrlParams = urlParams.join('&');
            this.urlLogin += '?' + this.linksUrlParams;
            this.urlChannels += '?' + this.linksUrlParams;
            this.urlLatest += '?' + this.linksUrlParams;
            this.urlSearch += '?' + this.linksUrlParams;
        }
    }

    // get elements
    this.initOptions.browser = this;
    if (this.currentSelection && this.currentSelection.oid) {
        if (this.currentSelection.oid.indexOf('c') === 0 || !isNaN(parseInt(this.currentSelection.oid, 10))) {
            this.initOptions.currentChannelOid = this.currentSelection.oid;
        } else {
            this.initOptions.currentChannelOid = this.currentSelection.parent_oid;
        }
    }
    this.channels = new MSBrowserChannels(this.initOptions);
    this.latest = new MSBrowserLatest(this.initOptions);
    this.search = new MSBrowserSearch(this.initOptions);

    this.buildWidget();

    if (this.initialState && this.initialState.tab) {
        this.changeTab(this.initialState.tab, true);
    } else {
        this.changeTab('channels', true);
    }

    if (this.initialOid) {
        this.pick(this.initialOid, null, true);
    }

    const obj = this;
    if (!this.useOverlay) {
        // listen to hash changes
        $(window).bind('hashchange', function () {
            obj.onUrlChange();
        });
    } else {
        this.overlay = new OverlayDisplayManager();
    }
    // initialize categories
    this.loadCategories();
    $(window).resize(function () {
        obj.onResize();
    });
    this.onResize();
};
MSBrowser.prototype.open = function () {
    if (!this.useOverlay) {
        return;
    }
    this.init();
    this.overlay.show({
        mode: 'html',
        title: this.title,
        html: this.$widget
    });
};
MSBrowser.prototype.updateCatalog = function (item, full) {
    if (!item || !item.oid) {
        return;
    }
    if (!this.catalog[item.oid]) {
        if (full) {
            item.isFull = true;
        }
        this.catalog[item.oid] = item;
    } else {
        let field;
        for (field in item) {
            this.catalog[item.oid][field] = item[field];
        }
        if (full) {
            this.catalog[item.oid].isFull = true;
        }
    }
};
MSBrowser.prototype.getInfoForOid = function (oid, full, callback) {
    const isMedia = oid && (oid[0] == 'v' || oid[0] == 'l' || oid[0] == 'p');
    return this.getInfo({ oid: oid }, isMedia, full, callback);
};
MSBrowser.prototype.getInfoForSlug = function (slug, isMedia, full, callback) {
    return this.getInfo({ slug: slug }, isMedia, full, callback);
};
MSBrowser.prototype.getInfo = function (data, isMedia, full, callback) {
    if ((!data.oid && !data.slug) || !callback) {
        return;
    }
    const field = data.oid ? 'oid' : 'slug';
    let item = null;
    let sOid;
    for (sOid in this.catalog) {
        if (!isMedia && sOid[0] == 'c' || isMedia && sOid[0] != 'c') {
            if (this.catalog[sOid][field] == data[field]) {
                if (!full) {
                    item = this.catalog[sOid];
                } else if (this.catalog[sOid].is_full) {
                    item = this.catalog[sOid];
                }
                break;
            }
        }
    }
    if (item) {
        return callback({ success: true, info: item });
    }
    this.displayLoading();
    if (full) {
        data.full = 'yes';
    }
    const method = isMedia ? 'getMedias' : 'getChannels';
    const obj = this;
    this.msapi.ajaxCall(method, data, function (response) {
        if (response.success) {
            obj.updateCatalog(response.info, full);
        }
        obj.hideLoading();
        callback(response);
    });
};
MSBrowser.prototype.pick = function (oid, action, initialPick) {
    if (oid === null || oid === undefined) {
        // deselect
        if (this.currentSelection && this.currentSelection.oid) {
            $('.item-entry-' + this.currentSelection.oid, this.$main).removeClass('selected');
        }
        return;
    }
    if (this.catalog[oid] && this.catalog[oid].isFull) {
        this._pick(oid, { success: true, info: this.catalog[oid] }, action, initialPick);
        return;
    }
    // load info if no info are available
    const obj = this;
    this.getInfoForOid(oid, true, function (result) {
        obj._pick(oid, result, action, initialPick);
    });
};
MSBrowser.prototype._pick = function (oid, result, action, initialPick) {
    if (!result.success) {
        // this should never happen
        console.log('Unable to get info about initial selection:' + result.error);
        return;
    }
    if (!this.pickMode) {
        if (action == 'delete' && window.deleteFormManager) {
            window.deleteFormManager.show(oid, this.catalog[oid].title);
        }
    } else {
        // change current selection
        if (this.currentSelection && this.currentSelection.oid) {
            $('.item-entry-' + this.currentSelection.oid, this.$main).removeClass('selected');
        }
        this.currentSelection = this.catalog[oid];
        $('.item-entry-' + this.currentSelection.oid, this.$main).addClass('selected');
        if (this.overlay && !initialPick) {
            this.overlay.hide();
        }
        if (this.onPick) {
            this.onPick(this.catalog[oid], initialPick);
        }
        // select and open channel
        if (!this.useOverlay && result.info.parent_slug) {
            window.location.hash = '#' + result.info.parent_slug;
        }
        if (this.channels && (!initialPick || !this.initialState || !this.initialState.channelSlug)) {
            if (oid.indexOf('c') === 0 || !isNaN(parseInt(oid, 10))) {
                this.channels.displayChannel(oid);
            } else {
                this.channels.displayChannel(result.info.parent_oid);
            }
        }
    }
};
MSBrowser.prototype.remove = function (oid) {
    // remove given oid from display without reloading page
    // this do not remove the object in the server
    if (!oid || !this.catalog[oid]) {
        return;
    }
    this.channels.remove(oid);
    this.latest.remove(oid);
    this.search.remove(oid);
};
MSBrowser.prototype.getLastPick = function () {
    return this.currentSelection;
};
MSBrowser.prototype.getSelectedOid = function () {
    if (!this.initialized) {
        return this.initialOid;
    } else if (this.currentSelection) {
        return this.currentSelection.oid;
    } else {
        return null;
    }
};
MSBrowser.prototype.parseUrl = function () {
    const data = {};
    const query = window.location.search ? window.location.search.substring(1) : null;
    if (query) {
        const tuples = query.split('&');
        for (let i = 0; i < tuples.length; i++) {
            let attr, value;
            if (tuples[i].indexOf('=') != -1) {
                attr = tuples[i].substring(0, tuples[i].indexOf('='));
                value = tuples[i].substring(attr.length + 1);
                if (value == 'on') {
                    value = true;
                } else if (value == 'off') {
                    value = false;
                } else {
                    value = window.decodeURIComponent(value.replace(/\+/g, '%20'));
                }
            } else {
                attr = tuples[i];
                value = true;
            }
            if (attr.substring(0, 3) == 'in_') {
                data.hasInVals = true;
            } else if (attr.substring(0, 4) == 'for_') {
                data.hasForVals = true;
            }
            data[attr] = value;
        }
    }
    return data;
};
/* events handlers */
MSBrowser.prototype.onUrlChange = function () {
    const path = window.location.pathname + window.location.search;
    if (path.indexOf('/channels/') === 0) {
        let slug = window.location.hash;
        if (slug && slug[0] == '#') {
            slug = slug.substring(1);
        }
        if (slug) {
            this.channels.displayChannelBySlug(slug);
        } else {
            if (this.filterSpeaker == 'self') {
                this.channels.displayPersonalChannel();
            } else {
                this.channels.displayChannel('0');
            }
        }
        this.changeTab('channels', true);
    } else if (path.indexOf('/latest/') === 0) {
        this.changeTab('latest', true);
    } else if (path.indexOf('/search/') === 0) {
        this.search.onUrlChange();
        this.changeTab('search', true);
    }
};
MSBrowser.prototype.onResize = function () {
    if (this.useOverlay) {
        const width = $(window).width() - 70;
        this.$widget.width(width);
        const height = $(window).height() - 100;
        this.$widget.height(height);
    }
};
MSBrowser.prototype.loadCategories = function () {
    const obj = this;
    this.msapi.ajaxCall('listCategories', {}, function (response) {
        if (response.data) {
            obj.siteSettingsCategories = response.data;
            obj.displayCategories();
        }
    });
};
