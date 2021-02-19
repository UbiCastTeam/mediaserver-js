/*******************************************
* MediaServer - MediaServer browser        *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */

function MSBrowserLatest (options) {
    // params
    this.browser = null;
    // vars
    this.$menu = null;
    this.$content = null;
    this.$place = null;
    this.lastResponse = null;
    this.more = false;
    this.startDate = '';
    this.dateLabel = '';
    this.$section = null;

    jsu.setObjectAttributes(this, options, [
        // allowed options
        'browser'
    ]);
    this.initOptions = options ? options : {};
}

MSBrowserLatest.prototype.getDisplayableContent = function () {
    let dc = this.browser.displayableContent;
    if (dc.length > 1 && this.browser.ltiMode && dc.indexOf('c') != -1) {
        dc = dc.replace(/c/g, '');
    }
    return dc;
};
MSBrowserLatest.prototype.getMenuJq = function () {
    const dc = this.getDisplayableContent();
    let html = '';
    html += '<div id="ms_browser_latest_menu" style="display: none;">';
    if (dc.length > 1) {
        html += '<div class="ms-browser-dropdown" id="ms_browser_latest_types_dropdown">';
        html += '<button type="button" aria-controls="ms_browser_latest_types_dropdown_menu" aria-expanded="false" class="button ms-browser-dropdown-button ' + this.browser.btnClass + '">' + jsu.translate('Content types') + ' <i class="fa fa-angle-down" aria-hidden="true"></i></button>';
        html += '<div class="ms-browser-dropdown-menu ms-browser-latest-types" id="ms_browser_latest_types_dropdown_menu">';
        html += '<h4>' + jsu.translate('Content types to display:') + '</h4>';
        if (dc.indexOf('c') != -1) {
            html += '<p><input id="latest_display_channel" type="checkbox">';
            html += ' <label for="latest_display_channel">' + jsu.translate('channels') + '</label></p>';
        }
        if (dc.indexOf('v') != -1) {
            html += '<p><input id="latest_display_video" type="checkbox">';
            html += ' <label for="latest_display_video">' + jsu.translate('videos') + '</label></p>';
        }
        if (dc.indexOf('l') != -1) {
            html += '<p><input id="latest_display_live" type="checkbox">';
            html += ' <label for="latest_display_live">' + jsu.translate('live streams') + '</label></p>';
        }
        if (dc.indexOf('p') != -1) {
            html += '<p><input id="latest_display_photos" type="checkbox">';
            html += ' <label for="latest_display_photos">' + jsu.translate('photos') + '</label></p>';
        }
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    this.$menu = $(html);
    // events
    if (dc.length > 1) {
        this.browser.setupDropdown($('#ms_browser_latest_types_dropdown', this.$menu));
        $('.ms-browser-latest-types input', this.$menu).change({ obj: this }, function (event) {
            event.data.obj.refreshDisplay(true);
            const typeLetter = this.id.split('_')[2][0];
            let types = jsu.getCookie('catalog-lastestTypes');
            if (!types) {
                types = 'vlp';
            }
            if (this.checked) {
                if (types.indexOf(typeLetter) == -1) {
                    types += typeLetter;
                }
            } else {
                types = types.replace(new RegExp(typeLetter), '');
            }
            jsu.setCookie('catalog-lastestTypes', types);
        });
    }
    return this.$menu;
};
MSBrowserLatest.prototype.getContentJq = function () {
    const moreLabel = jsu.translate('Display {count} more items');
    const html = '' +
        '<div id="ms_browser_latest" class="ms-browser-content" style="display: none;">' +
            '<div class="messages">' +
                '<div class="message info">' + jsu.translate('This list presents all media and channels ordered by add date.') + '</div>' +
            '</div>' +
            '<div class="ms-browser-latest-place"></div>' +
            '<div class="ms-browser-latest-btns">' +
                '<button type="button" class="button ms-browser-latest-more-10">' + moreLabel.replace(/\{count\}/, '10') + '</button>' +
                '<button type="button" class="button ms-browser-latest-more-30">' + moreLabel.replace(/\{count\}/, '30') + '</button>' +
            '</div>' +
        '</div>';
    this.$content = $(html);
    this.$place = $('.ms-browser-latest-place', this.$content);
    // events
    $('.ms-browser-latest-more-10', this.$content).click({ obj: this }, function (event) {
        event.data.obj.displayMore(10);
    });
    $('.ms-browser-latest-more-30', this.$content).click({ obj: this }, function (event) {
        event.data.obj.displayMore(30);
    });
    return this.$content;
};

MSBrowserLatest.prototype.onShow = function () {
    this.browser.setTitle('latest', jsu.translate('Latest content added'));
    if (this.initialized) {
        return;
    }
    this.initialized = true;

    const dc = this.getDisplayableContent();
    if (dc.length > 1) {
        let types = jsu.getCookie('catalog-lastestTypes');
        if (!types) {
            types = 'vlp';
        }
        $('.ms-browser-latest-types #latest_display_channel', this.$menu).prop('checked', types.indexOf('c') != -1);
        $('.ms-browser-latest-types #latest_display_video', this.$menu).prop('checked', types.indexOf('v') != -1);
        $('.ms-browser-latest-types #latest_display_live', this.$menu).prop('checked', types.indexOf('l') != -1);
        $('.ms-browser-latest-types #latest_display_photos', this.$menu).prop('checked', types.indexOf('p') != -1);
    }

    this.loadLatest();
};

MSBrowserLatest.prototype.loadLatest = function (count, end) {
    if (this.latestLoading) {
        return;
    }
    this.latestLoading = true;

    const dc = this.getDisplayableContent();
    const data = {};
    if (dc.length > 1) {
        data.content = '';
        if (dc.indexOf('c') != -1 && $('#latest_display_channel', this.$menu).is(':checked')) {
            data.content += 'c';
        }
        if (dc.indexOf('v') != -1 && $('#latest_display_video', this.$menu).is(':checked')) {
            data.content += 'v';
        }
        if (dc.indexOf('l') != -1 && $('#latest_display_live', this.$menu).is(':checked')) {
            data.content += 'l';
        }
        if (dc.indexOf('p') != -1 && $('#latest_display_photos', this.$menu).is(':checked')) {
            data.content += 'p';
        }
    } else if (dc) {
        data.content = dc;
    }
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
        /* eslint-disable camelcase */
        data.no_categories = true;
        /* eslint-enable camelcase */
    } else if (this.browser.filterCategories.length > 0) {
        data.categories = this.browser.filterCategories.join('\n');
    }

    let startValue = 0;
    if (this.startDate) {
        data.start = this.startDate;
        startValue = parseInt(this.startDate.replace(new RegExp('[-_]', 'g'), ''), 10);
        if (isNaN(startValue)) {
            startValue = 0;
        }
    }
    if (end) {
        const endValue = parseInt(end.replace(new RegExp('[-_]', 'g'), ''), 10);
        if (startValue > 0 && !isNaN(endValue) && endValue >= startValue) {
            this.latestLoading = false;
            console.log('cancelled');
            return;
        }
        data.end = end;
    }
    if (count) {
        data.count = count;
    }
    const obj = this;
    this.browser.displayLoading();
    this.browser.msapi.ajaxCall('getLatestContent', data, function (response) {
        if (response.items && response.items.length > 0) {
            // merge response items
            if (!obj.lastResponse) {
                obj.lastResponse = response;
            } else {
                obj.lastResponse.items = obj.lastResponse.items.concat(response.items);
            }
        }
        obj._onAjaxResponse(response);
        obj.latestLoading = false;
    });
};

MSBrowserLatest.prototype._onAjaxError = function (response) {
    let message = '<div class="messages">';
    if (!this.browser.useOverlay && (response.errorCode == '403' || response.errorCode == '401')) {
        const loginUrl = this.browser.urlLogin + '?next=' + window.location.pathname + (window.location.hash ? window.location.hash.substring(1) : '');
        message += '<div class="item-description">';
        message += '<div class="message error">' + response.error + '</div>';
        message += '<p>' + jsu.translate('Please login to access this page') + '<br /> <a href="' + loginUrl + '">' + jsu.translate('Sign in') + '</a></p>';
        message += '</div>';
    } else {
        message += '<div class="message error">' + response.error + '</div>';
    }
    message += '</div>';
    this.$place.html(message);
};

MSBrowserLatest.prototype._onAjaxResponse = function (response) {
    this.browser.hideLoading();
    if (!response.success) {
        return this._onAjaxError(response);
    }

    this.startDate = response.maxDate;
    this.more = response.more === true;
    for (let i = 0; i < response.items.length; i++) {
        const item = response.items[i];
        if (item.date_label && item.date_label != this.dateLabel) {
            this.dateLabel = item.date_label;
            const markup = (this.browser.pickMode ? 'h3' : 'h2');
            this.$place.append('<' + markup + '>' + this.dateLabel + '</' + markup + '>');
            this.$section = $('<ul class="ms-browser-section"></ul>');
            this.$place.append(this.$section);
        } else if (!this.$section) {
            this.$section = $('<ul class="ms-browser-section"></ul>');
            this.$place.append(this.$section);
            console.log('A browser section is missing in latest tab. This should not happen.', item.date_label, this.dateLabel);
        }
        let type;
        if (item.type == 'v') {
            type = 'video';
        } else if (item.type == 'l') {
            type = 'live';
        } else if (item.type == 'p') {
            type = 'photos';
        } else {
            type = 'channel';
        }
        const selectable = this.browser.selectableContent.indexOf(item.type) != -1;
        this.$section.append(this.browser.getContentEntry(type, item, selectable, 'latest'));
    }
    if (this.$section === null) {
        const $msg = $('<div class="messages"><div class="message info">' + jsu.translate('No contents.') + '</div></div>');
        this.$place.append($msg);
    }
    if (this.more) {
        $('.ms-browser-latest-btns', this.$content).css('display', 'block');
    } else {
        $('.ms-browser-latest-btns', this.$content).css('display', 'none');
    }
};

MSBrowserLatest.prototype.displayMore = function (count) {
    if (!this.more) {
        return;
    }
    this.loadLatest(count);
};
MSBrowserLatest.prototype.refreshDisplay = function (reset) {
    if (reset) {
        this.lastResponse = null;
    }
    if (this.lastResponse) {
        this.dateLabel = '';
        this.$section = null;
        this.$place.html('');
        this._onAjaxResponse(this.lastResponse);
    } else {
        this.more = false;
        this.startDate = '';
        this.dateLabel = '';
        this.$section = null;
        this.$place.html('');
        this.loadLatest();
    }
};

MSBrowserLatest.prototype.remove = function (oid) {
    this.browser.removeOidFromTab(this, oid);
};
