/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */

function MSBrowserSearch (options) {
    // params
    this.browser = null;
    // vars
    this.$menu = null;
    this.$content = null;
    this.order = 'default';
    this.lastResponse = null;
    this.searchInFields = [
        { name: 'in_title', label: jsu.escapeHTML(jsu.translate('titles')), initial: true, items: null },
        { name: 'in_description', label: jsu.escapeHTML(jsu.translate('descriptions')), initial: false, items: null },
        { name: 'in_keywords', label: jsu.escapeHTML(jsu.translate('keywords')), initial: true, items: null },
        { name: 'in_speaker', label: jsu.escapeHTML(jsu.translate('speakers')), initial: true, items: 'vlp' },
        { name: 'in_license', label: jsu.escapeHTML(jsu.translate('licenses')), initial: false, items: 'vlp' },
        { name: 'in_company', label: jsu.escapeHTML(jsu.translate('companies')), initial: false, items: 'vlp' },
        { name: 'in_location', label: jsu.escapeHTML(jsu.translate('locations')), initial: false, items: 'vlp' },
        { name: 'in_categories', label: jsu.escapeHTML(jsu.translate('categories')), initial: false, items: 'vlp' },
        { name: 'in_annotations', label: jsu.escapeHTML(jsu.translate('comments, slides, ...')), initial: false, items: 'vlp' },
        { name: 'in_photos', label: jsu.escapeHTML(jsu.translate('photos')), initial: false, items: 'p' },
        { name: 'in_extref', label: jsu.escapeHTML(jsu.translate('external references')), initial: true, items: null },
        { name: 'in_extdata', label: jsu.escapeHTML(jsu.translate('external data')), initial: false, items: null }
    ];
    if (options.defaultSearchIn) {
        for (let i = 0; i < this.searchInFields.length; i++) {
            const name = this.searchInFields[i].name.replace('in_', '');
            if (options.defaultSearchIn.indexOf(name) !== -1) {
                this.searchInFields[i].initial = true;
            } else {
                this.searchInFields[i].initial = false;
            }
        }
    }
    this.searchForFields = [
        { name: 'for_channels', label: jsu.escapeHTML(jsu.translate('channels')), initial: true, items: 'c' },
        { name: 'for_videos', label: jsu.escapeHTML(jsu.translate('videos')), initial: true, items: 'v' },
        { name: 'for_lives', label: jsu.escapeHTML(jsu.translate('live streams')), initial: true, items: 'l' },
        { name: 'for_photos', label: jsu.escapeHTML(jsu.translate('photos groups')), initial: true, items: 'p' }
    ];

    jsu.setObjectAttributes(this, options, [
        // allowed options
        'browser'
    ]);
    this.initOptions = options ? options : {};
}

MSBrowserSearch.prototype.getDisplayableContent = function () {
    let dc = this.browser.displayableContent;
    if (dc.length > 1 && this.browser.ltiMode && dc.indexOf('c') != -1) {
        dc = dc.replace(/c/g, '');
    }
    return dc;
};
MSBrowserSearch.prototype.shouldBeDisplayed = function (dc, items) {
    if (!items) {
        return true;
    }
    for (let i = 0; i < dc.length; i++) {
        if (items.indexOf(dc[i]) != -1) {
            return true;
        }
    }
    return false;
};
MSBrowserSearch.prototype.getMenuJq = function () {
    const dc = this.getDisplayableContent();
    let html = '<div id="ms_browser_search_menu" style="display: none;">' +
        '<form class="ms-browser-search-form" method="get" action="." onsubmit="javascript: return false;">' +
            '<label for="ms_browser_search_text"><span class="hidden-below-800">' + jsu.translate('Search:') + '</span></label>' +
            ' <input id="ms_browser_search_text" type="text" value="">' +
            ' <button type="submit" class="button" id="ms_browser_search_start">' + jsu.translate('Go') + '</button>' +
        '</form>' +
        '<div class="ms-browser-dropdown" id="ms_browser_search_in_dropdown">' +
            '<button type="button" aria-controls="ms_browser_search_in_dropdown_menu" aria-expanded="false" class="button ms-browser-dropdown-button ' + this.browser.btnClass + '">' + jsu.translate('Search in') + ' <i class="fa fa-angle-down" aria-hidden="true"></i></button>' +
            '<div class="ms-browser-dropdown-menu ms-browser-search-in" id="ms_browser_search_in_dropdown_menu">' +
                ' <div><button type="button" class="button" id="ms_browser_search_in_all">' + jsu.translate('all') + '</button>' +
                ' <button type="button" class="button" id="ms_browser_search_in_none">' + jsu.translate('none') + '</button></div>';
    for (let i = 0; i < this.searchInFields.length; i++) {
        const field = this.searchInFields[i];
        if (this.shouldBeDisplayed(dc, field.items)) {
            html += ' <div><input id="ms_browser_search_' + field.name + '" type="checkbox" ' + (field.initial ? 'checked="checked"' : '') + '>';
            html += ' <label for="ms_browser_search_' + field.name + '">' + field.label + '</label></div>';
        }
    }
    html += '' +
            '</div>' +
        '</div>';
    if (dc.length > 1) {
        html += '' +
            '<div class="ms-browser-dropdown" id="ms_browser_search_for_dropdown">' +
                '<button type="button" aria-controls="ms_browser_search_for_dropdown_menu" aria-expanded="false" class="button ms-browser-dropdown-button ' + this.browser.btnClass + '">' + jsu.translate('Search for') + ' <i class="fa fa-angle-down" aria-hidden="true"></i></button>' +
                '<div class="ms-browser-dropdown-menu ms-browser-search-for" id="ms_browser_search_for_dropdown_menu">' +
                    ' <div><button type="button" class="button" id="ms_browser_search_for_all">' + jsu.translate('all') + '</button>' +
                    ' <button type="button" class="button" id="ms_browser_search_for_none">' + jsu.translate('none') + '</button></div>';
        for (let i = 0; i < this.searchForFields.length; i++) {
            const field = this.searchForFields[i];
            if (this.shouldBeDisplayed(dc, field.items)) {
                html += ' <div><input id="ms_browser_search_' + field.name + '" type="checkbox" ' + (field.initial ? 'checked="checked"' : '') + '>';
                html += ' <label for="ms_browser_search_' + field.name + '">' + field.label + '</label></div>';
            }
        }
        html += '' +
                '</div>' +
            '</div>';
    }
    html += '</div>';
    this.$menu = $(html);
    // events
    this.browser.setupDropdown($('#ms_browser_search_in_dropdown', this.$menu));
    this.browser.setupDropdown($('#ms_browser_search_for_dropdown', this.$menu));
    $('form', this.$menu).submit({ obj: this }, function (event) {
        event.data.obj.onSearchSubmit();
    });
    $('#ms_browser_search_in_all', this.$menu).click({ obj: this }, function (event) {
        $('.ms-browser-search-in input[type=checkbox]', event.data.obj.$main).prop('checked', true);
        event.data.obj.onSearchSubmit();
    });
    $('#ms_browser_search_in_none', this.$menu).click({ obj: this }, function (event) {
        $('.ms-browser-search-in input[type=checkbox]', event.data.obj.$main).prop('checked', false);
        event.data.obj.onSearchSubmit();
    });
    $('#ms_browser_search_for_all', this.$menu).click({ obj: this }, function (event) {
        $('.ms-browser-search-for input[type=checkbox]', event.data.obj.$main).prop('checked', true);
        event.data.obj.onSearchSubmit();
    });
    $('#ms_browser_search_for_none', this.$menu).click({ obj: this }, function (event) {
        $('.ms-browser-search-for input[type=checkbox]', event.data.obj.$main).prop('checked', false);
        event.data.obj.onSearchSubmit();
    });
    $('input[type=checkbox]', this.$menu).change({obj: this}, function (event) {
        event.data.obj.onSearchSubmit();
    });
    return this.$menu;
};
MSBrowserSearch.prototype.getContentJq = function () {
    const html = '' +
        '<div id="ms_browser_search" class="ms-browser-content" style="display: none;">' +
            '<div class="messages"><div class="message info">' + jsu.translate('Use the input above to search for something.') + '</div></div>' +
        '</div>';
    this.$content = $(html);
    return this.$content;
};

MSBrowserSearch.prototype.onShow = function () {
    this.browser.setTitle(this.currentTitle ? this.currentTitle : jsu.translate('Search'));
    if (this.initialized) {
        return;
    }
    this.initialized = true;
    this.browser.hideMoreBtns();

    this.onUrlChange();
    if (!this.browser.useOverlay && this.browser.getActiveTab() == 'search') {
        $('#top_search_form form').submit({obj: this}, function (event) {
            $('#ms_browser_search_text').val($('#top_search_input').val());
            event.data.obj.onSearchSubmit();
            return false;
        });
    }
};
MSBrowserSearch.prototype.setOrder = function (order) {
    this.order = order ? order : 'default';
    this.refreshDisplay(true);
};

MSBrowserSearch.prototype.onUrlChange = function () {
    if (!this.initialized) {
        return;
    }
    // Example of search url: http://192.168.42.8:8000/search/?text=test&in_titles=on&in_descriptions=on&in_keywords=on&in_licenses=on&in_companies=on&in_annotations=on&in_photos=on&for_channels=on&for_videos=on&for_lives=on&for_photos=on
    const data = this.browser.parseUrl();

    const dc = this.getDisplayableContent();
    for (let i = 0; i < this.searchInFields.length; i++) {
        const field = this.searchInFields[i];
        if (this.shouldBeDisplayed(dc, field.items)) {
            let value;
            if (data.hasInVals) {
                value = Boolean(data[field.name]);
            } else {
                value = field.initial;
            }
            $('#ms_browser_search_' + field.name, this.$menu).prop('checked', value);
        }
    }
    for (let i = 0; i < this.searchForFields.length; i++) {
        const field = this.searchForFields[i];
        if (this.shouldBeDisplayed(dc, field.items)) {
            let value;
            if (data.hasForVals) {
                value = Boolean(data[field.name]);
            } else {
                value = field.initial;
            }
            $('#ms_browser_search_' + field.name, this.$menu).prop('checked', value);
        }
    }

    if (data.text) {
        $('#ms_browser_search_text', this.$menu).val(data.text);
        this.onSearchSubmit(true);
    }
};

MSBrowserSearch.prototype.onSearchSubmit = function (noPushstate) {
    const search = $('#ms_browser_search_text', this.$menu).val();
    if (!search) {
        return;
    }
    this.browser.displayLoading();
    const dc = this.getDisplayableContent();
    let urlQuery = 'text=' + search;
    // get fields to search in
    let fields = '';
    for (let i = 0; i < this.searchInFields.length; i++) {
        const field = this.searchInFields[i];
        if (this.shouldBeDisplayed(dc, field.items)) {
            const value = $('#ms_browser_search_' + field.name, this.$menu).is(':checked');
            if (value) {
                fields += field.name.substring(2); // remove 'in'
                urlQuery += '&' + field.name;
            }
        }
    }
    if (fields) {
        fields = fields.substring(1);
    } else {
        fields = 'metadata';
    }
    // get content to search for
    let content = '';
    for (let i = 0; i < this.searchForFields.length; i++) {
        const field = this.searchForFields[i];
        if (this.shouldBeDisplayed(dc, field.items)) {
            const value = $('#ms_browser_search_' + field.name, this.$menu).is(':checked');
            if (value) {
                content += field.name.substring(4, 5); // get content first letter
                urlQuery += '&' + field.name;
            }
        }
    }
    if (!content) {
        content = dc;
    }
    // prepare search request
    const data = {
        search: search,
        content: content,
        order_by: this.order, // eslint-disable-line camelcase
        fields: fields
    };
    if (this.browser.filterEditable !== null) {
        data.editable = this.browser.filterEditable ? 'yes' : 'no';
    }
    if (this.browser.filterValidated !== null) {
        data.validated = this.browser.filterValidated ? 'yes' : 'no';
    }
    if (this.browser.filterSpeaker !== null) {
        data.speaker = this.browser.filterSpeaker;
    }
    if (this.browser.filterNoCategories) {
        data.no_categories = true; // eslint-disable-line camelcase
    } else if (this.browser.filterCategories.length > 0) {
        data.categories = this.browser.filterCategories.join('\n');
    }
    // change url
    const title = jsu.escapeHTML(jsu.translate('Search results for:') + ' ' + search);
    this.currentTitle = title;
    this.browser.setTitle(title);
    if (!this.browser.pickMode && !noPushstate) {
        let url = this.browser.urlSearch;
        if (url.indexOf('?') < 0) {
            url += '?' + urlQuery;
        } else {
            url += '&' + urlQuery;
        }
        if (!this.lastUrl || this.lastUrl != url) {
            this.lastUrl = url;
            window.history.pushState({'ms_tab': 'search', 'search': search}, title, url);
        }
    }
    // execute search request
    const obj = this;
    this.browser.msapi.ajaxCall('search', data, function (response) {
        obj._onAjaxResponse(response);
        if (window.gaPageview) {
            window.gaPageview('ajax search', '/ajax_search?search=' + data.search + '&fields=' + data.fields);
        }
    });
};

MSBrowserSearch.prototype._onAjaxError = function (response) {
    this.lastResponse = null;

    let message = '<div class="messages">';
    if (!this.browser.useOverlay && (response.errorCode == '403' || response.errorCode == '401')) {
        const loginUrl = this.browser.urlLogin + '?next=' + window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : '');
        message += '<div class="item-description">';
        message += '<div class="message error">' + jsu.escapeHTML(response.error) + '</div>';
        message += '<p>' + jsu.translate('Please login to access this page') + '<br /> <a href="' + loginUrl + '">' + jsu.translate('Sign in') + '</a></p>';
        message += '</div>';
    } else {
        message += '<div class="message error">' + jsu.escapeHTML(response.error) + '</div>';
    }
    message += '</div>';
    this.$content.html(message);
};

MSBrowserSearch.prototype._onAjaxResponse = function (response) {
    this.browser.hideLoading();
    if (!response.success) {
        return this._onAjaxError(response);
    }

    this.lastResponse = response;

    const nbChannels = response.channels ? response.channels.length : 0;
    const nbVideos = response.videos ? response.videos.length : 0;
    const nbLiveStreams = response.live_streams ? response.live_streams.length : 0;
    const nbPhotosGroups = response.photos_groups ? response.photos_groups.length : 0;
    const hasItems = nbChannels > 0 || nbVideos > 0 || nbLiveStreams > 0 || nbPhotosGroups > 0;
    this.$content.html('');
    // search result display
    if (hasItems) {
        const results = [];
        if (nbChannels > 0) {
            results.push(nbChannels + ' ' + jsu.translate('channel(s)'));
        }
        if (nbVideos > 0) {
            results.push(nbVideos + ' ' + jsu.translate('video(s)'));
        }
        if (nbLiveStreams > 0) {
            results.push(nbLiveStreams + ' ' + jsu.translate('live stream(s)'));
        }
        if (nbPhotosGroups > 0) {
            results.push(nbPhotosGroups + ' ' + jsu.translate('photos group(s)'));
        }
        const text = '<div class="ms-browser-search-matching"><b>' + jsu.translate('Matching items:') + '</b> ' + jsu.escapeHTML(results.join(', ')) + '</div>';
        this.$content.append(text);
        this.browser.displayContent(this.$content, response, null, 'search');
    } else {
        this.$content.html('<div class="messages"><div class="message info">' + jsu.translate('No results.') + '</div></div>');
    }
};

MSBrowserSearch.prototype.refreshDisplay = function (reset) {
    if (reset && this.lastResponse) {
        this.lastResponse = null;
    }
    if (this.lastResponse) {
        this._onAjaxResponse(this.lastResponse);
    } else {
        this.onSearchSubmit(true);
    }
};

MSBrowserSearch.prototype.remove = function (oid) {
    this.browser.removeOidFromTab(this, oid);
};
