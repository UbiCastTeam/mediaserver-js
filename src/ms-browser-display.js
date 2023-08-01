/*******************************************
* MediaServer - MediaServer browser        *
* MSBrowser class extension                *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* global jsu */
/* global MSBrowser */
/* global OverlayDisplayManager */

MSBrowser.prototype.buildWidget = function () {
    // build widget structure
    this.lastOverlayFocus = document.activeElement;
    this.previousFocus = null;
    let channelsLabel, searchLabel, latestLabel;
    if (this.filterSpeaker == 'self') {
        channelsLabel = jsu.translate('My channel');
        latestLabel = jsu.translate('My media');
        searchLabel = jsu.translate('Search in my media');
    } else {
        channelsLabel = jsu.translate('Channels');
        latestLabel = jsu.translate('Latest content');
        searchLabel = jsu.translate('Search');
    }
    let html = '' +
        '<div class="ms-browser ms-browser-container' + (this.useOverlay ? ' in-overlay' : '') + (this.treeManager ? ' has-tree' : '') + (this.displayTypesIcons ? ' show-types-icons' : '') + (this.hideHeader ? ' no-header' : '') + '">' +
            '<div class="ms-browser-header">' +
                '<div class="ms-browser-menu">';
    if (!this.useOverlay) {
        html += '' +
            '<a id="ms_browser_channels_tab" class="ms-browser-tab button ' + this.btnClass + '" href="' + this.urlChannels + '" title="' + jsu.escapeAttribute(channelsLabel) + '" aria-label="' + jsu.escapeAttribute(channelsLabel) + '"><i class="fa fa-folder-open" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(channelsLabel) + '</span></a>' +
            '<a id="ms_browser_latest_tab" class="ms-browser-tab button ' + this.btnClass + '" href="' + this.urlLatest + '" title="' + jsu.escapeAttribute(latestLabel) + '" aria-label="' + jsu.escapeAttribute(latestLabel) + '"><i class="fa fa-clock-o" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(latestLabel) + '</span></a>' +
            '<a id="ms_browser_search_tab" class="ms-browser-tab button ' + this.btnClass + '" href="' + this.urlSearch + '" title="' + jsu.escapeAttribute(searchLabel) + '" aria-label="' + jsu.escapeAttribute(searchLabel) + '"><i class="fa fa-search" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(searchLabel) + '</span></a>';
    } else {
        html += '' +
            '<button type="button" id="ms_browser_channels_tab" class="ms-browser-tab button ' + this.btnClass + '" title="' + jsu.escapeAttribute(channelsLabel) + '" aria-label="' + jsu.escapeAttribute(channelsLabel) + '"><i class="fa fa-folder-open" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(channelsLabel) + '</span></button>' +
            '<button type="button" id="ms_browser_latest_tab" class="ms-browser-tab button ' + this.btnClass + '" title="' + jsu.escapeAttribute(latestLabel) + '" aria-label="' + jsu.escapeAttribute(latestLabel) + '"><i class="fa fa-clock-o" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(latestLabel) + '</span></button>' +
            '<button type="button" id="ms_browser_search_tab" class="ms-browser-tab button ' + this.btnClass + '" title="' + jsu.escapeAttribute(searchLabel) + '" aria-label="' + jsu.escapeAttribute(searchLabel) + '"><i class="fa fa-search" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">' + jsu.escapeHTML(searchLabel) + '</span></button>';
    }
    html += '' +
                '</div>' +
                '<h2 class="ms-browser-title"></h2>' +
            '</div>' +
            '<div class="ms-browser-bar"></div>' +
            '<div class="ms-browser-main ms-items">' +
                '<div class="ms-browser-clear"></div>' +
                '<div class="ms-browser-loading"><div>' +
                    '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i> ' + jsu.translateHTML('Loading...') +
                '</div></div>' +
                '<div class="ms-browser-message"><div></div></div>' +
            '</div>' +
        '</div>';
    this.$widget = $(html);
    let $barButtons, $topButtons;
    if (!this.useOverlay && $('nav .buttons-left').length > 0) {
        $topButtons = $('nav .buttons-left');
        $topButtons.addClass('ms-browser');
        if (this.hideHeader) {
            $topButtons.addClass('no-header');
        }
        $topButtons.append(this.getTopMenuJq());
        $barButtons = $('#commands_place');
        $barButtons.addClass('ms-browser');
        if (this.hideHeader) {
            $barButtons.addClass('no-header');
        }
        $barButtons.addClass('ms-browser-dropdown-right');
    } else {
        $topButtons = $('.ms-browser-header', this.$widget);
        $topButtons.addClass('ms-browser-dropdown-right');
        $topButtons.prepend(this.getTopMenuJq());
        $barButtons = $('.ms-browser-bar', this.$widget);
        $barButtons.addClass('ms-browser-dropdown-right');
    }
    $barButtons.append(this.latest.getMenuJq());
    $barButtons.append(this.channels.getMenuJq());
    $barButtons.append(this.search.getMenuJq());
    this.$main = $('.ms-browser-main', this.$widget);
    this.$main.append(this.latest.getContentJq());
    this.$main.append(this.channels.getContentJq());
    this.$main.append(this.search.getContentJq());
    this.$main.append('<div class="ms-browser-clear"></div>');
    this.$menu = $('.ms-browser-menu', this.$widget);

    // get initial media or channel info
    if (this.place) {
        $(this.place).html(this.$widget);
    }

    // events
    $('#ms_browser_channels_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.changeTab('channels'); return false;
    });
    $('#ms_browser_latest_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.changeTab('latest'); return false;
    });
    $('#ms_browser_search_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.changeTab('search'); return false;
    });
    $('.ms-browser-more-btn button', this.$widget).click({ obj: this }, function (event) {
        event.data.obj.displayMore(event.data.obj.displayCount);
    });
};
MSBrowser.prototype.getTopMenuJq = function () {
    const sortingValues = [
        { 'default': jsu.translate('Use default sorting') },
        { 'creation_date-desc': jsu.translate('Creation date, descending') },
        { 'creation_date-asc': jsu.translate('Creation date, ascending') },
        { 'add_date-desc': jsu.translate('Add date, descending') },
        { 'add_date-asc': jsu.translate('Add date, ascending') },
        { 'title-desc': jsu.translate('Title, descending') },
        { 'title-asc': jsu.translate('Title, ascending') },
        { 'slug-desc': jsu.translate('Slug, descending') },
        { 'slug-asc': jsu.translate('Slug, ascending') },
        // { 'comments-desc': jsu.translate('Number of annotations, descending') },
        // { 'comments-asc': jsu.translate('Number of annotations, ascending') },
        { 'views-desc': jsu.translate('Number of views, descending') },
        { 'views-asc': jsu.translate('Number of views, ascending') }
    ];
    let html = '<div class="ms-browser-top-buttons">' +
        '<div class="ms-browser-dropdown" id="ms_browser_display_dropdown">' +
        '<button aria-controls="ms_browser_display_dropdow_menu" aria-expanded="false" type="button" title="' + jsu.translateAttribute('Display') + '" class="button ms-browser-dropdown-button ' + this.btnClass + '"><i class="fa fa-tv" aria-hidden="true"></i> <span class="hidden-below-1280">' + jsu.translateHTML('Display') + ' </span><i class="fa fa-angle-down" aria-hidden="true"></i></button>' +
        '<div class="ms-browser-dropdown-menu" id="ms_browser_display_dropdow_menu">' +
        // display mode
        '<div><h4>' + jsu.translateHTML('Display mode:') + '</h4>' +
        '<button type="button" class="button ' + (!this.displayAsThumbnails ? 'active' : '') + '" id="ms_browser_display_as_list" title="' + jsu.translateAttribute('list') + (!this.displayAsThumbnails ? ' (' + jsu.translateAttribute('selected setting') + ')' : '') + '">' + jsu.translateHTML('list') + '</button>' +
        '<button type="button" class="button ' + (this.displayAsThumbnails ? 'active' : '') + '" id="ms_browser_display_as_thumbnails" title="' + jsu.translateAttribute('thumbnails') + (this.displayAsThumbnails ? ' (' + jsu.translateAttribute('selected setting') + ')' : '') + '">' + jsu.translateHTML('thumbnails') + '</button><br/>' +
        '<label for="ms_browser_number_item">' + jsu.translateHTML('Number of items:') + '</label>' +
        '<select id="ms_browser_number_item">';
    for (const value of [10, 30, 100]) {
        html += '<option value="' + value + '"' + (value == this.displayCount ? ' selected="selected"' : '') + '>' + value + '</option>';
    }
    html += '</select><br/>' +
        '<input id="ms_browser_display_types_icons" type="checkbox" ' + (this.displayTypesIcons ? 'checked="checked"' : '') + '>' +
        ' <label for="ms_browser_display_types_icons">' + jsu.translateHTML('display items type icons') + '</label></div>' +
        // channel sorting
        '<div class="ms-browser-channel-order"><h4><label for="ms_browser_order_channel">' + jsu.translate('Sort by:') + '</label></h4>' +
        ' <select id="ms_browser_order_channel">';
    let index;
    for (index in sortingValues) {
        for (const key in sortingValues[index]) {
            html += '<option value="' + key + '">' + jsu.escapeHTML(sortingValues[index][key]) + '</option>';
        }
    }
    html += '</select></div>';
    // filters
    const optHtml = '' +
        '<option value="">' + jsu.translateHTML('unspecified') + '</option>' +
        '<option value="yes">' + jsu.translateHTML('yes') + '</option>' +
        '<option value="no">' + jsu.translateHTML('no') + '</option>';
    html += '<div class="ms-browser-filters"><h4>' + jsu.translateHTML('Filters:') + '</h4>' +
        ' <form id="ms_browser_filters_form">' +
        ' <label for="ms_browser_filter_editable">' + jsu.translateHTML('Editable:') + '</label>' +
        ' <select id="ms_browser_filter_editable">' + optHtml + '</select>';
    if (this.displayableContent.length > 1 || this.displayableContent != 'c') {
        html += ' <br/>' +
            ' <label for="ms_browser_filter_validated">' + jsu.translateHTML('Published:') + '</label>' +
            ' <select id="ms_browser_filter_validated">' + optHtml + '</select>';
        if (this.filterSpeaker != 'self') {
            html += ' <br/>' +
                ' <label for="ms_browser_filter_speaker">' + jsu.translateHTML('Speaker:') + '</label>' +
                ' <input type="text" id="ms_browser_filter_speaker" value="' + (this.filterSpeaker ? this.filterSpeaker : '') + '"/>' +
                ' <button type="submit" class="button">' + jsu.translateHTML('Ok') + '</button>';
        }
    }
    html += ' </form>' +
        '</div>' +
        '</div>' +
        '</div>';

    html += '</div>';
    this.$topMenu = $(html);
    // events
    const $dropdown = $('#ms_browser_display_dropdown', this.$topMenu);
    this.setupDropdown($dropdown);
    $('#ms_browser_display_as_list', $dropdown).click({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.setDisplayAsList();
    });
    $('#ms_browser_display_as_thumbnails', $dropdown).click({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.setDisplayAsThumbnails();
    });
    $('#ms_browser_display_types_icons', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.setDisplayTypesIcons(this.checked);
    });
    $('#ms_browser_order_channel', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.channels.setOrder($(this).val());
        event.data.obj.search.setOrder($(this).val());
    });
    $('#ms_browser_filters_form select', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        $('#ms_browser_filters_form', event.data.$dropdown).submit();
    });
    $('#ms_browser_filters_form', $dropdown).submit({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.onFiltersSubmit($(this));
        return false;
    });
    $('#ms_browser_number_item', $dropdown).change({ obj: this }, function (event) {
        const newValue = parseInt(this.value, 10);
        if (newValue > event.data.obj.displayCount) {
            event.data.obj.displayMore(newValue - event.data.obj.displayCount);
        }
        event.data.obj.displayCount = newValue;
        $('.ms-browser-more-btn button').text(event.data.obj.moreLabel.replace(/\{count\}/, event.data.obj.displayCount));
        jsu.setCookie('catalog-displayCount', newValue);
    });
    // detect focus change
    try {
        this.focusWasInDropdown = false;
        window.addEventListener('blur', function () {
            this.checkFocusDropdown();
        }.bind(this), true);
        window.addEventListener('focus', function () {
            this.checkFocusDropdown();
        }.bind(this), true);
    } catch (e) {
        console.error('Failed to listen to focus changes: ' + e);
    }
    return this.$topMenu;
};
MSBrowser.prototype.getMoreButton = function () {
    if (!this.moreLabel) {
        this.moreLabel = jsu.translate('Display {count} more items');
    }
    return '' +
        '<div class="ms-browser-more-btn">' +
            '<button type="button" class="button">' + this.moreLabel.replace(/\{count\}/, this.displayCount) + '</button>' +
        '</div>';
};
MSBrowser.prototype.setTitle = function (text, html) {
    if (!html) {
        html = text;
    }

    if (!this.useOverlay && $('#global .main-title h1').length > 0) {
        $('#global .main-title h1').html(html);
        $('#global .main-title h1').attr('tabindex', '-1');
        $('#global .main-title h1').focus();
    } else {
        $('.ms-browser-title', this.$widget).html(html);
    }

    if (!this.useOverlay && document.title) {
        if (!this.documentTilteSuffix) {
            const index = document.title.indexOf(' - ');
            if (index != -1) {
                this.documentTilteSuffix = document.title.substring(index);
            } else {
                this.documentTilteSuffix = ' - Nudgis';
            }
        }
        document.title = text + this.documentTilteSuffix;
    }
};

MSBrowser.prototype.setupDropdown = function ($dropdown) {
    $('.ms-browser-dropdown-button', $dropdown).click({ $dropdown: $dropdown }, function (event) {
        const $btn = $('.ms-browser-dropdown-button', event.data.$dropdown);
        const $menu = $('.ms-browser-dropdown-menu', event.data.$dropdown);
        $menu.attr('tabindex', '-1');
        if ($btn.hasClass('active')) {
            $btn.removeClass('active');
            $btn.attr('aria-expanded', false);
            $menu.removeClass('active');
        } else {
            $btn.addClass('active');
            $btn.attr('aria-expanded', true);
            $menu.addClass('active');
        }
    });
    $(document).click({ $dropdown: $dropdown }, function (event) {
        const $btn = $('.ms-browser-dropdown-button', event.data.$dropdown);
        const $menu = $('.ms-browser-dropdown-menu', event.data.$dropdown);
        if ($btn.hasClass('active') && !$menu.is(event.target) && $menu.has(event.target).length === 0 &&
            !$btn.is(event.target) && $btn.has(event.target).length === 0) {
            $btn.removeClass('active');
            $btn.attr('aria-expanded', false);
            $menu.removeClass('active');
        }
    });
};
MSBrowser.prototype.closeDropdown = function ($dropdown) {
    const $btn = $('.ms-browser-dropdown-button', $dropdown);
    const $menu = $('.ms-browser-dropdown-menu', $dropdown);
    if ($btn.hasClass('active')) {
        $btn.removeClass('active');
        $btn.attr('aria-expanded', false);
        $menu.removeClass('active');
    }
};
MSBrowser.prototype.checkFocusDropdown = function () {
    // close dropdowns when focus quit the menu
    if (!document.activeElement || document.activeElement == document.body) {
        return;
    }
    let isFocused = false;
    let node = document.activeElement;
    while (node) {
        if (node.className && node.className.indexOf('ms-browser-dropdown-menu') != -1) {
            isFocused = true;
            this.focusWasInDropdown = true;
            break;
        }
        node = node.parentNode;
    }
    if (!isFocused && this.focusWasInDropdown) {
        this.focusWasInDropdown = false;
        $('.ms-browser-dropdown-button.active').removeClass('active').attr('aria-expanded', false);
        $('.ms-browser-dropdown-menu.active').removeClass('active');
    }
};

MSBrowser.prototype.onFiltersSubmit = function ($form) {
    const inputs = [
        { type: 'choice', id: 'ms_browser_filter_editable', name: 'filterEditable' },
        { type: 'choice', id: 'ms_browser_filter_validated', name: 'filterValidated' }
    ];
    if (this.filterSpeaker != 'self') {
        inputs.push({ type: 'text', id: 'ms_browser_filter_speaker', name: 'filterSpeaker' });
    }
    let changed = false;
    for (let i = 0; i < inputs.length; i++) {
        const $input = $('#' + inputs[i].id, $form);
        if ($input.length > 0) {
            let value = $input.val();
            if (inputs[i].type == 'choice') {
                switch (value) {
                    case 'yes': value = true; break;
                    case 'no': value = false; break;
                    default: value = null; break;
                }
            } else if (!value) {
                value = null;
            }
            if (this[inputs[i].name] !== value) {
                this[inputs[i].name] = value;
                changed = true;
            }
        }
    }
    if (changed) {
        if (this.useOverlay) {
            this.channels.refreshDisplay(true);
            this.latest.refreshDisplay(true);
            this.search.refreshDisplay(true);
        } else {
            const currentTab = this.getActiveTab();
            switch (currentTab) {
                case 'channels':
                    this.channels.refreshDisplay(true);
                    break;
                case 'latest':
                    this.latest.refreshDisplay(true);
                    break;
                case 'search':
                    this.search.refreshDisplay(true);
                    break;
            }
        }
    }
};
MSBrowser.prototype.setDisplayAsList = function () {
    const $asThumb = $('#ms_browser_display_as_thumbnails', this.$topMenu);
    const $asList = $('#ms_browser_display_as_list', this.$topMenu);
    if ($asList.hasClass('active')) {
        return;
    }
    this.displayAsThumbnails = false;
    $asThumb.removeClass('active').attr('title', $asThumb.text());
    $asList.addClass('active').attr('title', $asList.text() + ' (' + jsu.translate('selected setting') + ')');
    if (!this.useOverlay) {
        $('#global').addClass('max-width-1200');
    }
    jsu.setCookie('catalog-displayMode', 'list');
    this.channels.refreshDisplay();
    this.latest.refreshDisplay();
    this.search.refreshDisplay();
};
MSBrowser.prototype.setDisplayAsThumbnails = function () {
    const $asThumb = $('#ms_browser_display_as_thumbnails', this.$topMenu);
    const $asList = $('#ms_browser_display_as_list', this.$topMenu);
    if ($asThumb.hasClass('active')) {
        return;
    }
    this.displayAsThumbnails = true;
    $asList.removeClass('active').attr('title', $asList.text());
    $asThumb.addClass('active').attr('title', $asThumb.text() + ' (' + jsu.translate('selected setting') + ')');
    if (!this.useOverlay) {
        $('#global').removeClass('max-width-1200');
    }
    jsu.setCookie('catalog-displayMode', 'thumbnail');
    this.channels.refreshDisplay();
    this.latest.refreshDisplay();
    this.search.refreshDisplay();
};
MSBrowser.prototype.setDisplayTypesIcons = function (checked) {
    this.displayTypesIcons = checked;
    if (checked) {
        this.$widget.addClass('show-types-icons');
    } else {
        this.$widget.removeClass('show-types-icons');
    }
    jsu.setCookie('catalog-displayTypesIcons', checked ? 'yes' : 'no');
};
MSBrowser.prototype.getActiveTab = function () {
    const $active = $('.ms-browser-tab.active', this.$menu);
    let name = $active.length > 0 ? $active.attr('id').replace(/_tab/g, '').replace(/ms_browser_/g, '') : null;
    if (!name && !this.pickMode) {
        if ($('.ms-browser').hasClass('channels')) {
            name = 'channels';
        } else if ($('.ms-browser').hasClass('latest')) {
            name = 'latest';
        } else if ($('.ms-browser').hasClass('search')) {
            name = 'search';
        }
    }
    return name;
};
MSBrowser.prototype.changeTab = function (tab, noPushstate) {
    const previous = this.getActiveTab();
    if (previous == tab) {
        return;
    }

    if (previous && this[previous]) {
        $('.ms-browser').removeClass(previous);
        $('#ms_browser_' + previous + '_tab', this.$menu).removeClass('active').attr('title', $('#ms_browser_' + previous + '_tab', this.$menu).text());
        this[previous].$menu.css('display', 'none');
        this[previous].$content.css('display', 'none');
    }
    $('.ms-browser').addClass(tab);
    $('#ms_browser_' + tab + '_tab', this.$menu).addClass('active').attr('title', $('#ms_browser_' + tab + '_tab', this.$menu).text() + ' (' + jsu.translate('selected tab') + ')');
    if (this[tab]) {
        this[tab].$menu.css('display', '');
        this[tab].$content.css('display', '');
        this[tab].onShow();
    }
    // special case
    if (tab != 'latest') {
        $('.ms-browser-channel-order', this.$topMenu).css('display', '');
    } else {
        $('.ms-browser-channel-order', this.$topMenu).css('display', 'none');
    }

    if (!this.useOverlay && !noPushstate) {
        let url;
        if (tab == 'search') {
            url = this.urlSearch;
        } else if (tab == 'latest') {
            url = this.urlLatest;
        } else {
            url = this.urlChannels + window.location.hash;
        }
        window.history.pushState({'ms_tab': tab}, tab, url);
    }
};

MSBrowser.prototype.displayLoading = function () {
    if (isNaN(this.loadingCount)) {
        this.loadingCount = 1;
    } else {
        this.loadingCount++;
    }
    if (this.loadingTimeout) {
        return;
    }
    const obj = this;
    this.loadingTimeout = setTimeout(function () {
        $('.ms-browser-loading', obj.$widget).css('display', 'block');
        obj.loadingTimeout = null;
    }, 500);
};
MSBrowser.prototype.hideLoading = function () {
    if (this.loadingCount) {
        this.loadingCount--;
    }
    if (isNaN(this.loadingCount) || this.loadingCount > 0) {
        return;
    }
    if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
    }
    $('.ms-browser-loading', this.$widget).css('display', '');
};

MSBrowser.prototype.displayContent = function ($container, data, channelOid, tab, count) {
    if (!count) {
        count = this.displayCount;
    }
    if (data.channels && data.channels.length > 0) {
        let channels = [];
        if (count > 0) {
            channels = data.channels.slice(0, count);
            this.moreChannels = data.channels.slice(count);
            count -= channels.length;
        } else {
            this.moreChannels = data.channels;
        }
        if (channels.length > 0) {
            this.displayItems($container, channels, 'channel', tab, channelOid);
        }
    }
    if (data.live_streams && data.live_streams.length > 0) {
        let liveStreams = [];
        if (count > 0) {
            liveStreams = data.live_streams.slice(0, count);
            this.moreLiveStreams = data.live_streams.slice(count);
            count -= liveStreams.length;
        } else {
            this.moreLiveStreams = data.live_streams;
        }
        if (liveStreams.length > 0) {
            this.displayItems($container, liveStreams, 'live', tab);
        }
    }
    if (data.videos && data.videos.length > 0) {
        let videos = [];
        if (count > 0) {
            videos = data.videos.slice(0, count);
            this.moreVideos = data.videos.slice(count);
            count -= videos.length;
        } else {
            this.moreVideos = data.videos;
        }
        if (videos.length > 0) {
            this.displayItems($container, videos, 'video', tab);
        }
    }
    if (data.photos_groups && data.photos_groups.length > 0) {
        let photosGroups = [];
        if (count > 0) {
            photosGroups = data.photos_groups.slice(0, count);
            this.morePhotosGroups = data.photos_groups.slice(count);
            count -= photosGroups.length;
        } else {
            this.morePhotosGroups = data.photos_groups;
        }
        if (photosGroups.length > 0) {
            this.displayItems($container, photosGroups, 'photos', tab);
        }
    }
    if ((this.moreChannels.length + this.moreLiveStreams.length + this.moreVideos.length + this.morePhotosGroups.length) > 0) {
        this.showMoreBtns(tab);
    } else {
        this.hideMoreBtns(tab);
    }
};
MSBrowser.prototype.displayItems = function ($container, items, type, tab, channelOid) {
    const markup = (this.pickMode ? 'h3' : 'h2');
    const selectable = this.selectableContent.indexOf(type[0]) != -1;
    let label = '';
    switch (type) {
        case 'channel':
            label = jsu.translate('Channels');
            if (channelOid && channelOid != '0') {
                label = jsu.translate('Sub channels');
            }
            break;
        case 'live':
            label = jsu.translate('Live streams');
            break;
        case 'video':
            label = jsu.translate('Videos');
            break;
        case 'photos':
            label = jsu.translate('Photos groups');
            break;
    }
    if (!$('#header_type_' + type, $container).length) {
        $container.append('<' + markup + ' id="header_type_' + type + '">' + label + '</' + markup + '>');
    }
    let $section = $('#section_type_' + type, $container);
    if (!$section.length) {
        $section = $('<ul id="section_type_' + type + '" class="ms-browser-section"></ul>');
    }
    for (let i = 0; i < items.length; i++) {
        if (type == 'channels' && items[i].parent_oid === undefined && channelOid) {
            /* eslint-disable-next-line camelcase */
            items[i].parent_oid = channelOid;
        }
        $section.append(this.getContentEntry(type, items[i], selectable, tab));
    }
    $container.append($section);
};
MSBrowser.prototype.showMoreBtns = function (tab) {
    $('#ms_browser_' + tab + ' .ms-browser-more-btn', this.place).css('display', 'block');
};
MSBrowser.prototype.hideMoreBtns = function (tab) {
    $('#ms_browser_' + tab + ' .ms-browser-more-btn', this.place).css('display', 'none');
};
MSBrowser.prototype.displayMore = function (count) {
    const currentTab = this.getActiveTab();
    const data = {
        'channels': this.moreChannels,
        'live_streams': this.moreLiveStreams,
        'videos': this.moreVideos,
        'photos_groups': this.morePhotosGroups
    };
    if (currentTab === 'latest') {
        this.latest.displayMore(count);
    } else if (currentTab === 'channels') {
        this.displayContent(this.channels.$place, data, null, 'channels', count);
    } else if (currentTab === 'search') {
        this.displayContent(this.search.$place, data, null, 'search', count);
    }
};
MSBrowser.prototype.getContentEntry = function (itemType, item, gselectable, tab) {
    this.updateCatalog(item);
    const oid = item.oid;
    const selectable = gselectable && (!this.parentSelectionOid || item.selectable);
    const clickable = this.pickMode && (selectable || itemType == 'channel');
    let $entry = null;
    $entry = $('<li class="item-entry item-type-' + itemType + ' item-entry-' + oid + '"></li>');
    $entry.attr('id', 'item_entry_' + oid + '_' + tab);
    $entry.addClass(this.displayAsThumbnails ? 'thumbnail' : 'list');
    if (this.currentSelection && this.currentSelection.oid == oid) {
        $entry.addClass('selected');
        $entry.attr('title', item.title + ' ' + jsu.translate('selected'));
    }
    if (selectable) {
        $entry.addClass('selectable');
    }
    if (clickable) {
        $entry.addClass('clickable');
    }
    if (item.extra_class) {
        $entry.addClass(item.extra_class);
    }
    let html = this._getEntryBlockHtml(item, itemType, clickable, tab);
    if (this.displayAsThumbnails && !this.pickMode) {
        html += '<div class="item-entry-buttons">';
        html += '<button type="button" class="item-entry-info" title="' + jsu.translateAttribute('Open information panel') + '"><i class="fa fa-info" aria-hidden="true"></i></button>';
        if (item.can_edit) {
            html += '<a title="' + jsu.translateAttribute('Edit') + '" href="' + this.getButtonLink(item, 'edit') + '"' + this.linksTarget + '><i class="fa fa-pencil" aria-hidden="true"></i></a>';
        }
        html += '<div class="overlay-info ms-items" id="item_entry_' + oid + '_' + tab + '_info" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="item_entry_' + item.oid + '_' + tab + '_info_title" aria-modal="true"></div>';
        html += '</div>';
    }
    const $entryBlock = $(html);
    this._setOnClickEntryBlock($entryBlock, oid, itemType, item, selectable);
    $entry.append($entryBlock);
    if (this.displayAsThumbnails) {
        this._setThumbnailInfoBoxHtml(itemType, selectable, oid, $entry, item, tab);
    } else {
        const $entryLinks = this.getEntryLinks(item, itemType, selectable);
        if ($entryLinks) {
            $entry.append($entryLinks);
        }
    }
    $('.item-entry-link', $entry).focus(function () {
        $('.item-entry').removeClass('focus');
        $(this).parent().addClass('focus');
    });
    return $entry;
};
MSBrowser.prototype.couldDisplay = function (type) {
    return this.catalogFieldsToDisplay.indexOf(type) !== -1;
};
MSBrowser.prototype._cleanSpeakers = function (speakerStr) {
    const speakers = [];
    for (let speaker of speakerStr.split(',')) {
        speaker = speaker.trim();
        if (speaker) {
            speakers.push(speaker);
        }
    }
    return speakers.join(', ');
};
MSBrowser.prototype._getEntryBlockHtml = function (item, itemType, clickable, tab) {
    let markup = 'span';
    let href = '';
    let buttonStyle = ' tabindex="0" role="button"';
    if (!this.useOverlay && item.slug && (!this.pickMode || itemType == 'channel')) {
        markup = 'a';
        buttonStyle = '';
        href = ' href="' + this.getButtonLink(item, 'view') + '"';
        if (itemType != 'channel') {
            href += this.linksTarget;
        }
    }

    let html = '<' + markup + href + buttonStyle + ' class="item-entry-link"' + (clickable && itemType != 'channel' ? ' title="' + jsu.translateAttribute('Click to select this media') + '"' : '') + '>';

    /********************** Image preview ****************/
    let imagePreview = '<span class="item-entry-preview">';
    imagePreview += '<span class="item-entry-preview-aligner"></span>';
    if (item.thumb) {
        imagePreview += '<img src="' + jsu.escapeAttribute(item.thumb) + '" alt=""' + (item.language ? ' lang="' + jsu.escapeAttribute(item.language) + '"' : '') + '/>';
    }
    if (!this.pickMode && itemType != 'channel') {
        imagePreview += '<b class="item-entry-preview-play"><i class="fa fa-play fa-4x" aria-hidden="true"></i></b>';
    }
    imagePreview += '</span>';
    html += imagePreview;

    /********************** Content ********************/
    let content = '<span class="item-entry-content">';

    /********************** Top bar ****************/
    let topBar = '<span class="item-entry-top-bar">';
    // type icon
    if (itemType == 'channel') {
        topBar += '<span class="item-entry-layout layout-channel" title="' +
                    jsu.translateAttribute('This item is a channel') + '"></span>';
    } else {
        if (itemType == 'photos') {
            topBar += '<span class="item-entry-layout layout-pgroup" title="' +
                        jsu.translateAttribute('This item is a photos group') + '"></span>';
        } else {
            topBar += '<span class="item-entry-layout ';
            if (item.layout) {
                topBar += 'layout-' + jsu.escapeAttribute(item.layout);
            } else {
                topBar += 'layout-video';
            }
            topBar += '" title="';
            let titleText = itemType == 'live' ? jsu.translateHTML('This item is a live stream') : jsu.translateHTML('This item is a video');
            if (item.layout) {
                if (item.layout == 'composition') {
                    titleText += ' (' + jsu.translateHTML('dynamic Rich Media') + ')';
                } else if (item.layout == 'webinar') {
                    titleText += ' (' + jsu.translateHTML('classic Rich Media') + ')';
                } else {
                    titleText += ' (' + jsu.escapeHTML(item.layout.replace(/_/, ' ')) + ')';
                }
            }
            topBar += titleText;
            topBar += '"><span class="sr-only">' + titleText + '</span></span>';
        }
    }
    // element topBar
    if (item.can_edit) {
        if (itemType == 'channel') {
            if (item.unlisted) {
                topBar += '<span class="item-entry-unlisted" title="' +
                            jsu.translateAttribute('This channel is unlisted') + '"><span class="sr-only">' +
                            jsu.translateHTML('This channel is unlisted') + '</span></span>';
            }
        } else {
            if (!item.validated) {
                topBar += '<span class="item-entry-notpublished" title="' +
                            jsu.translateAttribute('This media is not published') + '"><span class="sr-only">' +
                            jsu.translateHTML('This media is not published') + '</span></span>';
            } else if (item.unlisted) {
                topBar += '<span class="item-entry-unlisted" title="' +
                            jsu.translateAttribute('This media is published and unlisted') + '"><span class="sr-only">' +
                            jsu.translateHTML('This media is published and unlisted') + '</span></span>';
            } else {
                topBar += '<span class="item-entry-published" title="' +
                            jsu.translateAttribute('This media is published') + '"><span class="sr-only">' +
                            jsu.translateHTML('This media is published') + '</span></span>';
            }
            if (itemType == 'video' && !item.ready) {
                topBar += '<span class="item-entry-notready" title="' +
                            jsu.translateAttribute('This video is not ready') + '"><span class="sr-only">' +
                            jsu.translateHTML('This video is not ready') + '</span></span>';
            }
            if (itemType == 'live' && item.status == 'ongoing') {
                topBar += '<span class="item-entry-live-running" title="' + jsu.translateAttribute('This live is running') + '">' +
                    '<span class="sr-only">' + jsu.translateHTML('This live is running') + '</span>' +
                '</span>';
            }
        }
    }
    // duration
    if (this.couldDisplay('duration') && item.duration) {
        topBar += '<span class="item-entry-duration">' + jsu.escapeHTML(item.duration) + '</span>';
    }
    if (this.couldDisplay('language') && item.language) {
        const langHtml = this.getLangHTML(item);
        topBar += '<span class="item-entry-language">' + langHtml + '</span>';
    }

    // title
    if (!this.displayAsThumbnails) {
        topBar += '<span class="item-entry-title"' + (item.language ? ' lang="' + jsu.escapeAttribute(item.language) + '"' : '') + '>' + jsu.escapeHTML(item.title) + '</span>';
    }
    topBar += '</span>';
    content += topBar;

    /********************** Bottom bar ****************/
    let bottomBar = '<span class="item-entry-bottom-bar">';
    if (this.displayAsThumbnails) {
        bottomBar += '<span class="item-entry-title"' + (item.language ? ' lang="' + jsu.escapeAttribute(item.language) + '"' : '') + '>' + jsu.escapeHTML(item.title) + '</span>';
    } else {
        if (this.couldDisplay('creation_date') && item.creation) {
            bottomBar += '<span class="item-entry-date">' + jsu.translateHTML('Created on') + ' ' +
                        jsu.getDateDisplay(item.creation) + '</span>';
        }
        if (this.couldDisplay('description') && item.short_description) {
            bottomBar += '<span class="item-entry-description">' + jsu.escapeHTML($('<span>' + item.short_description + '</span>').text()) + '</span>';
        }
        if (this.couldDisplay('license') && item.license) {
            bottomBar += '<span class="item-entry-license">' + jsu.translateHTML('License:') + ' ' + jsu.escapeHTML(item.license) + '</span>';
        }
        if (this.couldDisplay('speaker') && item.speaker) {
            bottomBar += '<span class="item-entry-speaker">' + jsu.translateHTML('Speaker:') + ' ' + jsu.escapeHTML(this._cleanSpeakers(item.speaker)) + '</span>';
        }
        if (this.couldDisplay('company') && item.company) {
            bottomBar += '<span class="item-entry-company">' + jsu.translateHTML('Company:') + ' ' + jsu.escapeHTML(item.company) + '</span>';
        }
        if (this.couldDisplay('views') && item.views) {
            bottomBar += '<span class="item-entry-views">' + item.views + ' ' + jsu.translate('views');
            if (item.views_last_month) {
                bottomBar += ', ' + item.views_last_month + ' ' + jsu.translate('this month');
            }
            bottomBar += '</span>';
        }
        if (this.couldDisplay('storage') && item.can_edit && item.storage_used !== null && item.storage_used !== undefined) {
            const storageDisplay = this.msapi.getStorageMinimalDisplay(item);
            if (storageDisplay) {
                bottomBar += '<span class="item-entry-storage">' + jsu.translate('Storage usage:') + ' ' + storageDisplay + '</span>';
            }
        }
        if (tab == 'latest') {
            if (this.couldDisplay('type')) {
                bottomBar += '<span class="item-entry-type">' + jsu.translateHTML('Type:') + ' ' +
                            jsu.translateHTML(itemType) + '</span>';
            }
            if (this.couldDisplay('add_date') && item.add_date) {
                bottomBar += '<span class="item-entry-date">' + jsu.translateHTML('Added on') + ' ' +
                                jsu.getDateDisplay(item.add_date) + '</span>';
            }
            if (this.couldDisplay('parent') && item.parent_title) {
                bottomBar += '<span class="item-entry-parent">' + jsu.translateHTML('Parent channel:') + ' ' +
                                jsu.escapeHTML(item.parent_title) + '</span>';
            }
        }
    }
    bottomBar += '</span>';
    content += bottomBar;
    content += '</span>';

    html += content;
    html += '</' + markup + '>';

    /********************** Search data **********************/
    if (!this.displayAsThumbnails && !this.pickMode && tab == 'search' && (item.annotations || item.photos)) {
        html += '<span class="item-entry-extra">';
        let i;
        if (item.annotations) {
            html += '<span>' + jsu.translateHTML('Matching annotations:') + '</span><ul>';
            for (i = 0; i < item.annotations.length; i++) {
                const annotation = item.annotations[i];
                html += '<li><a href="' + this.getButtonLink(item, 'view') + '#start=' + annotation.time + '&autoplay"' + this.linksTarget + '>';
                if (annotation.title) {
                    html += jsu.escapeHTML(annotation.title);
                }
                html += ' (' + jsu.escapeHTML(annotation.time_display) + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        if (item.photos) {
            html += '<span>' + jsu.translateHTML('Matching photos:') + '</span><ul>';
            for (i = 0; i < item.photos.length; i++) {
                const photo = item.photos[i];
                html += '<li><a href="' + this.getButtonLink(item, 'view') + '#' + photo.index + '"' + this.linksTarget + '>';
                if (photo.title) {
                    html += jsu.escapeHTML(photo.title);
                }
                html += ' (#' + photo.index + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        html += '</span>';
    }
    return html;
};
MSBrowser.prototype.getLangHTML = function (item) {
    if (item.language) {
        if (item.icon_lang) {
            return '<i aria-hidden="true" class="icon-lang ' + item.icon_lang + '"></i>';
        } else {
            return '<i class="text-lang" aria-hidden="true">[' + item.language + ']</i>';
        }
    }
};
MSBrowser.prototype._setOnClickEntryBlock = function ($entryBlock, oid, itemType, item, selectable) {
    let listenClick = false;
    if (itemType == 'channel' || itemType == 'parent') {
        if (this.useOverlay) {
            $entryBlock.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.channels.displayChannel(event.data.oid);
                event.data.obj.changeTab('channels');
                jsu.focusFirstDescendant($('#ms_browser_channels .ms-browser-channels-place')[0]);
            });
            listenClick = true;
        }
    } else if (this.pickMode && selectable) {
        $entryBlock.click({ obj: this, oid: oid }, function (event) {
            event.data.obj.pick(event.data.oid);
        });
        listenClick = true;
    }
    if (listenClick) {
        $entryBlock.keydown({ obj: this, oid: oid }, function (event) {
            if (event.which == '13') { // enter
                event.preventDefault();
                event.stopPropagation();
                $(this).click();
            }
        });
    }
    if (!this.pickMode && item.can_delete) {
        $('.item-entry-pick-delete-media', $entryBlock).click({ obj: this, oid: oid }, function (event) {
            event.data.obj.pick(event.data.oid, 'delete');
        });
    }
};

MSBrowser.prototype.getEntryLinks = function (item, itemType, selectable) {
    let html = '';
    const isTrashBin = item.oid === 'c00000000000000trash';
    const itemInTrash = !!item.trash_data;
    if (this.pickMode) {
        if (selectable) {
            const selected = this.currentSelection && this.currentSelection.oid == item.oid;
            const icon = selected ? 'fa-check-circle' : 'fa-check';
            let label;
            if (itemType == 'channel' || itemType == 'current') {
                if (selected) {
                    label = jsu.translate('This channel is selected');
                } else {
                    label = jsu.translate('Select this channel');
                }
            } else {
                if (selected) {
                    label = jsu.translate('This media is selected');
                } else {
                    label = jsu.translate('Select this media');
                }
            }
            html += '<button type="button" class="' + this.btnClass + ' button main item-entry-pick"><i class="fa ' + icon + '" aria-hidden="true"></i> <span class="hidden-below-800">' + jsu.escapeHTML(label) + '</span></button>';
        }
    } else {
        if (itemType == 'current') {
            if (item.can_see_stats) {
                html += '<button type="button" title="' + jsu.translateAttribute('Statistics') + '" class="' + this.btnClass + ' button default item-entry-pick-stats-media"><i class="fa fa-bar-chart" aria-hidden="true"></i> <span class="hidden-below-1280">' + jsu.translateHTML('Statistics') + '</span></button>';
            }
            if (item.can_edit) {
                html += '<a title="' + jsu.translateAttribute('Edit') + '" class="' + this.btnClass + ' button default item-entry-pick item-entry-pick-edit-media" href="' + this.getButtonLink(item, 'edit') + '"' + this.linksTarget + '><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden-below-800">' + jsu.translateHTML('Edit') + '</span></a>';
            }
            if (item.can_delete) {
                html += '<button type="button" title="' + jsu.translateAttribute('Delete') + '" class="' + this.btnClass + ' button danger item-entry-pick-delete-media"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-800">' + jsu.translateHTML('Delete') + '</span></button>';
            }
            if (item.can_add_channel) {
                const addChannelIcon = '<i class="fa fa-folder" aria-hidden="true"></i>' +
                ' <i class="fa fa-plus color-green" aria-hidden="true"></i>';
                html += '<a title="' + jsu.translateAttribute('Add a sub channel') + '"' +
                        ' class="' + this.btnClass + ' button item-entry-pick item-entry-pick-add-channel" href="' +
                        this.getButtonLink(item, 'addChannel') + '"' + this.linksTarget + '>' + addChannelIcon +
                        ' <span class="hidden-below-800">' +
                        jsu.translateHTML('Add a sub channel') + '</span></a>';
            }
            if (item.oid != '0' && item.can_add_video) {
                const addVideoIcon = '<i class="fa fa-film" aria-hidden="true"></i>' +
                ' <i class="fa fa-plus color-green" aria-hidden="true"></i>';
                html += '<a title="' + jsu.translateAttribute('Add a video') + '"' +
                        ' class="' + this.btnClass + ' button item-entry-pick item-entry-pick-add-video" href="' +
                        this.getButtonLink(item, 'addVideo') + '"' + this.linksTarget + '>' + addVideoIcon +
                        ' <span class="hidden-below-800">' +
                        jsu.translateHTML('Add a video') + '</span></a>';
            }
            if (isTrashBin) {
                html += '<button type="button" title="' + jsu.translateAttribute('Restore everything from the recycle bin. All items will be restored in their respective original channels. If the destination channel for an item doesn\'t exist anymore, the content will be moved to the fallback restoration channel.') + '"' +
                                'class="' + this.btnClass + ' button main trash-restore-all-media">' +
                            '<i class="fa fa-refresh" aria-hidden="true"></i>' +
                            '<span class="hidden-below-800" style="margin-left: 0.3em;">' +
                                jsu.translateHTML('Restore all') +
                            '</span>' +
                        '</button>';
                html += '<button type="button" title="' + jsu.translateAttribute('Permanently delete everything in recycle bin') + '"' +
                                'class="' + this.btnClass + ' button danger trash-delete-all-media">' +
                            '<i class="fa fa-trash" aria-hidden="true"></i>' +
                            '<span class="hidden-below-800" style="margin-left: 0.3em;">' +
                                jsu.translateHTML('Delete all') +
                            '</span>' +
                        '</button>';
            }
        } else {
            if (itemType != 'channel' && this.ltiMode) {
                html += '<button type="button" class="' + this.btnClass + ' button default item-entry-copy" data-link="' + this.getButtonLink(item, 'lti', true) + '"><i class="fa fa-chain" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('Copy LTI link') + '</span></button>';
            }
            if ((itemType != 'channel' && this.ltiMode) || item.can_edit || item.can_delete) {
                html += '<a class="' + this.btnClass + ' button default item-entry-pick-view-media" href="' + this.getButtonLink(item, 'view') + '"' + this.linksTarget + '><i class="fa fa-eye" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('See') + '</span></a>';
            }
            if (item.can_edit) {
                html += '<a class="' + this.btnClass + ' button item-entry-pick-edit-media default" href="' + this.getButtonLink(item, 'edit') + '"' + this.linksTarget + '><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('Edit') + '</span></a>';
            }
            if (itemInTrash) {
                if (item.can_delete) {
                    html += '<button type="button" class="' + this.btnClass + ' button item-entry-pick-trash-delete-media danger"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('Delete definitively') + '</span></button>';
                    html += '<button type="button" class="' + this.btnClass + ' button item-entry-pick-trash-restore-media main" title="' + jsu.translateAttribute('This item will be restored in its original channel. If the destination channel doesn\'t exist anymore, the item will be moved to the fallback restoration channel.') + '"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('Restore') + '</span></button>';
                }
            } else {
                if (item.can_delete) {
                    html += '<button type="button" class="' + this.btnClass + ' button item-entry-pick-delete-media danger"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-440">' + jsu.translateHTML('Delete') + '</span></button>';
                }
            }
        }
    }
    if (!html) {
        return null;
    }
    html = '<span class="item-entry-links"><span class="item-entry-links-container">' + html + '</span></span>';
    const $entryLinks = $(html);
    // events
    if (itemType == 'channel' || itemType == 'parent') {
        $('.item-entry-display', $entryLinks).click({ obj: this, item: item }, function (event) {
            if (event.data.obj.pickMode) {
                event.data.obj.channels.displayChannel(event.data.item.oid);
            }
        });
    }
    if (selectable) {
        $('.item-entry-pick', $entryLinks).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid);
        });
    }
    if (!this.pickMode && itemType == 'current' && item.can_see_stats) {
        $('.item-entry-pick-stats-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            event.data.obj.openStatistics(event.data.item.oid);
        });
    }
    if (!this.pickMode && item.can_delete) {
        $('.item-entry-pick-delete-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid, 'delete');
        });
    }
    if (isTrashBin) {
        $('.trash-restore-all-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            const allSubItems = [];
            console.log(event.data.obj.channels.lastResponse);
            for (const itemType of ['channels', 'videos', 'live_streams', 'photos_groups']) {
                if (Array.isArray(event.data.obj.channels.lastResponse[itemType])) {
                    for (const item of event.data.obj.channels.lastResponse[itemType]) {
                        allSubItems.push(item);
                    }
                }
            }
            event.data.obj.deleteOrRestore(allSubItems, true);
        });
        $('.trash-delete-all-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            const allSubItems = [];
            for (const itemType of ['channels', 'videos', 'live_streams', 'photos_groups']) {
                if (Array.isArray(event.data.obj.channels.lastResponse[itemType])) {
                    for (const item of event.data.obj.channels.lastResponse[itemType]) {
                        allSubItems.push(item);
                    }
                }
            }
            event.data.obj.deleteOrRestore(allSubItems);
        });
    }
    if (itemInTrash) {
        $('.item-entry-pick-trash-delete-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            event.data.obj.deleteOrRestore([event.data.item]);
        });
        $('.item-entry-pick-trash-restore-media', $entryLinks).click({ obj: this, item: item }, function (event) {
            event.data.obj.deleteOrRestore([event.data.item], true);
        });
    }
    const $copyBtn = $('.item-entry-copy', $entryLinks);
    if ($copyBtn.length > 0) {
        $('.item-entry-copy', $entryLinks).click(function () {
            const $btn = $(this);
            const toCopy = $btn.attr('data-link');
            // invisible inputs cannot be copied
            const $tempInput = $('<input type="text" style="position: absolute; left: -10000px; top: 0;"/>').val(toCopy);
            $('body').append($tempInput);
            $tempInput.select();
            let successful, msg;
            try {
                successful = document.execCommand('copy');
                msg = successful ? jsu.translate('copied') : jsu.translate('cannot copy');
            } catch (err) {
                successful = false;
                msg = jsu.translate('failed to copy');
                console.error('Failed to copy to clipboard: ' + err);
            }
            msg = '<i class="fa ' + (successful ? 'fa-check' : 'fa-warning') + '" aria-hidden="true"></i> ' + jsu.escapeHTML(msg);
            $btn.append('<span class="copy-msg">' + msg + '</span>');
            $btn.addClass('copied');
            setTimeout(function () {
                $btn.removeClass('copied');
                $('.copy-msg', $btn).remove();
            }, 1000);
            $tempInput.remove();
        });
    }

    return $entryLinks;
};
MSBrowser.prototype.getButtonLink = function (item, action, absolute) {
    let url = '';
    let hash = '';
    let type = '';
    if (item && item.oid) {
        type = item.oid[0];
    }
    if (!action && (!type || type === '' || type === '0') && (!item || item.oid == '0')) {
        url = '/channels/';
        hash = '#';
    } else if (action == 'view') {
        if (!item.slug && item.oid != '0') {
            // FIXME: the following call is asynchronous and won't work
            this.getInfoForOid(item.oid, false, function (data) {
                item = data.info;
            });
        }
        if (type == '0') {
            url = '/channels/';
            hash = '#';
        } else if (type == 'c') {
            url = '/channels/';
            hash = '#' + item.slug;
        } else {
            if (type == 'l') {
                url = '/lives/' + item.slug + '/';
            } else if (type == 'v') {
                url = '/videos/' + item.slug + '/';
            } else if (type == 'p') {
                url = '/photos/' + item.slug + '/';
            }
            if (url && this.iframeMode) {
                url += 'iframe/';
            }
        }
    } else if (action == 'lti') {
        url = '/lti/' + item.oid + '/';
    } else if (action == 'edit') {
        if (this.iframeMode) {
            url = '/edit/iframe/' + item.oid + '/';
        } else {
            url = '/edit/' + item.oid + '/';
        }
    } else if (action == 'addChannel') {
        url = '/add-content/channel/?in=' + (item && item.oid != '0' ? item.oid : 'root');
    } else if (action == 'addVideo') {
        url = '/add-content/';
        hash = '#add_media_by_upload';
        if (item && item.oid != '0') {
            url += '?in=' + item.oid;
        }
    } else {
        console.error('Unrecognized action specified in MSBrowser.prototype.getButtonLink call:', item, action, absolute);
        return '';
    }

    if (absolute) {
        url = window.location.protocol + '//' + window.location.host + url;
    }

    if (this.linksUrlParams && action != 'lti') {
        url += (url.indexOf('?') < 0 ? '?' : '&') + this.linksUrlParams;
    }
    return url + hash;
};
MSBrowser.prototype._getThumbnailInfoBoxHtml = function (item, itemType, selectable, tab) {
    let html = '<div><div tabindex="0"></div>';
    html += '<div class="trap-focus">';
    html += '<div class="overlay-info-title" id="item_entry_' + item.oid + '_' + tab + '_info_title" >';
    html += '<button type="button" class="overlay-info-close button default ' + this.btnClass + '" title="' + jsu.translateAttribute('Hide this window') + '" aria-label="' + jsu.translateAttribute('Hide this window') + '"><i class="fa fa-close" aria-hidden="true"></i></button>';
    html += '<h1><a href="' + this.getButtonLink(item, 'view') + '"' + this.linksTarget + '>' + jsu.escapeHTML(item.title) + '</a></h1>';
    html += '</div>';
    html += '<div class="overlay-info-content">';
    if (!this.pickMode && tab == 'search' && (item.annotations || item.photos)) {
        if (item.annotations) {
            html += '<div><b>' + jsu.translateHTML('Matching annotations:') + '</b></div>';
            html += '<ul>';
            for (let i = 0; i < item.annotations.length; i++) {
                const annotation = item.annotations[i];
                html += '<li><a href="' + this.getButtonLink(item, 'view') + '#start=' + annotation.time + '&autoplay"' + this.linksTarget + '>';
                if (annotation.title) {
                    html += jsu.escapeHTML(annotation.title);
                }
                html += ' (' + jsu.escapeHTML(annotation.time_display) + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        if (item.photos) {
            html += '<div><b>' + jsu.translate('Matching photos:') + '</b></div>';
            html += '<ul>';
            for (let i = 0; i < item.photos.length; i++) {
                const photo = item.photos[i];
                html += '<li><a href="' + this.getButtonLink(item, 'view') + '#' + photo.index + '"' + this.linksTarget + '>';
                if (photo.title) {
                    html += jsu.escapeHTML(photo.title);
                }
                html += ' (#' + photo.index + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        html += '<hr/>';
    }
    html += '<table class="overlay-info-table">';
    html += '<caption class="sr-only">' + jsu.translateHTML('Media information') + '</caption>';
    if (this.couldDisplay('creation_date') && item.creation && itemType == 'video') {
        html += '<tr>';
        html += '<th scope="row" class="overlay-info-label">' + jsu.translateHTML('Recording date') + ' :</th>';
        html += '<td>' + jsu.getDateDisplay(item.creation) + '</td>';
        html += '</tr>';
    }
    if (this.couldDisplay('add_date') && item.add_date) {
        html += '<tr>';
        html += '<th scope="row" class="overlay-info-label">' + jsu.translateHTML('Publishing date') + ' :</th>';
        html += '<td>' + jsu.getDateDisplay(item.add_date) + '</td>';
        html += '</tr>';
    }
    if (this.couldDisplay('duration') && item.duration) {
        html += '<tr>';
        html += '<th scope="row" class="overlay-info-label">' + jsu.translateHTML('Duration') + ' :</th>';
        html += '<td>' + jsu.escapeHTML(item.duration) + '</td>';
        html += '</tr>';
    }
    if (this.couldDisplay('views') && item.views_last_month) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Views last month') + ' :</th><td>' + item.views_last_month + '</td></tr>';
    }
    if (this.couldDisplay('views') && item.views) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Views') + ' :</th><td>' + item.views + '</td></tr>';
    }
    if (this.couldDisplay('annotations') && item.comments_last_month) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Annotations last month') + ' :</th><td>' + item.comments_last_month + '</td></tr>';
    }
    if (this.couldDisplay('annotations') && item.comments) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Annotations') + ' :</th><td>' + item.comments + '</td></tr>';
    }
    if (this.couldDisplay('storage') && item.can_edit && item.storage_used !== null && item.storage_used !== undefined) {
        const storageDisplay = this.msapi.getStorageMinimalDisplay(item);
        if (storageDisplay) {
            html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Storage usage') + ' :</th><td>' + storageDisplay + '</td></tr>';
        }
    }
    if (this.couldDisplay('license') && item.license) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('License') + ' :</th><td>' + jsu.escapeHTML(item.license) + '</td></tr>';
    }
    if (this.couldDisplay('speaker') && item.speaker) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Speaker') + ' :</th><td>' + jsu.escapeHTML(item.speaker) + '</td></tr>';
    }
    if (this.couldDisplay('company') && item.company) {
        html += '<tr><th scope="row" class="overlay-info-label">' + jsu.translateHTML('Company') + ' :</th><td>' + jsu.escapeHTML(item.company) + '</td></tr>';
    }
    html += '</table>';
    if (this.couldDisplay('description') && item.short_description) {
        html += '<hr/>';
        html += '<p>' + jsu.escapeHTML($('<span>' + item.short_description + '</span>').text()) + '</p>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div tabindex="0"></div></div>';
    const $info = $(html);
    const $entryLinks = this.getEntryLinks(item, itemType, selectable);
    if ($entryLinks) {
        $('.overlay-info-content', $info).append($entryLinks);
    }
    $('.overlay-info-close', $info).click({ obj: this }, function (event) {
        event.data.obj.boxHideInfo();
    });
    $(document).keydown({ obj: this }, function (event) {
        if (!$('#item_entry_' + item.oid + '_' + tab + '_info').length) {
            return;
        }
        if (event.keyCode == 27) {
            event.stopImmediatePropagation();
            event.data.obj.boxHideInfo();
        }
    });
    return $info;
};
MSBrowser.prototype._setThumbnailInfoBoxHtml = function (itemType, selectable, oid, $entry, item, tab) {
    $('.item-entry-info', $entry).click({ obj: this, $entry: $entry }, function (event) {
        const infoId = '#' + $entry.attr('id') + '_info';
        event.data.obj.previousFocus = this;
        if ($(infoId, event.data.$entry).html() !== '') {
            event.data.obj.boxOpenInfo($entry);
            return;
        }
        if (tab == 'search') {
            const $element = event.data.obj._getThumbnailInfoBoxHtml(item, itemType, selectable, tab);
            $(infoId, event.data.$entry).append($element);
            event.data.obj.boxOpenInfo($entry);
        } else {
            event.data.obj.getInfoForOid(oid, true, function (data) {
                const item = data.info;
                event.data.obj.updateCatalog(data.info);
                const $element = event.data.obj._getThumbnailInfoBoxHtml(item, itemType, selectable, tab);
                $(infoId, event.data.$entry).append($element);
                event.data.obj.boxOpenInfo($entry);
            });
        }
    });
};
MSBrowser.prototype.trapFocus = function (element, event) {
    if (jsu.ignoreUntilFocusChanges) {
        return;
    }
    if (element.contains(event.target)) {
        this.lastOverlayFocus = event.target;
    } else {
        jsu.focusFirstDescendant(element);
        if (this.lastOverlayFocus == document.activeElement) {
            jsu.focusLastDescendant(element);
        }
        this.lastOverlayFocus = document.activeElement;
    }
};
MSBrowser.prototype.boxOpenInfo = function ($entry) {
    this.boxHideInfo();
    const infoId = '#' + $entry.attr('id') + '_info';
    const $infoBox = $(infoId);
    if (!$infoBox.hasClass('moved')) {
        // move box in body if not already done
        $infoBox.addClass('moved').detach().appendTo('body');
    }
    if (!$infoBox.is(':visible')) {
        const block = $('.item-entry-preview', $entry);
        const top = parseInt(block.offset().top, 10) - 1;
        let left = (parseInt(block.offset().left, 10) + block.width());
        let right = 'auto';
        if (($(window).width() / 2.0) - left < 0) {
            left = 'auto';
            right = $(window).width() - parseInt(block.offset().left, 10);
        }
        $infoBox.css('left', left + 'px');
        $infoBox.css('right', right + 'px');
        $infoBox.css('top', top + 'px');
        $('.item-entry-info', $entry).addClass('info-displayed');
        $infoBox.fadeIn('fast');
        this.lastOverlayFocus = document.activeElement;
        $infoBox.focusin(this.trapFocus.bind(this, $('.trap-focus', $infoBox)[0]));
        jsu.focusFirstDescendant($('.trap-focus', $infoBox)[0]);

        if (this.boxClickHandler) {
            $(document).unbind('click', this.boxClickHandler);
        }
        const obj = this;
        this.boxClickHandler = function (event) {
            if (!$(event.target).closest(infoId).length && !$(event.target).closest('.item-entry-info').length && $(infoId).is(':visible')) {
                obj.boxHideInfo();
            }
        };
        $(document).click(this.boxClickHandler);
    }
};
MSBrowser.prototype.boxHideInfo = function () {
    if ($('.overlay-info:visible').length) {
        $('.overlay-info:visible').off('focusin');
        this.lastOverlayFocus = document.activeElement;
        $('.overlay-info:visible').fadeOut('fast');
        $('.item-entry-info.info-displayed').removeClass('info-displayed');
        if (this.previousFocus) {
            this.previousFocus.focus();
        }
    }
};
MSBrowser.prototype.displayCategories = function () {
    const obj = this;
    if (this.siteSettingsCategories.length > 0) {
        let html = ' <button type="button" id="open_hidden_categories" class="button">' + jsu.translate('Categories') + ' <i class="fa fa-angle-down" aria-hidden="true"></i></button>';
        html += ' <div id="hidden_categories" class="hidden-visibility">';
        html += ' <label for="filter_no_categories"><input id="filter_no_categories" type="checkbox"/><span>' + jsu.translateHTML('Unspecified') + '</span></label><br />';
        for (let i = 0; i < this.siteSettingsCategories.length; i++) {
            const slug = jsu.escapeAttribute(this.siteSettingsCategories[i][0]);
            const label = jsu.escapeHTML(this.siteSettingsCategories[i][1]);
            const check = this.filterCategories.indexOf(slug) < 0 ? '' : ' checked="checked"';
            html += ' <label for="' + slug + '"><input class="checkbox" id="' + jsu.escapeAttribute(slug) + '" type="checkbox" value="' + jsu.escapeAttribute(slug) + '"' + check + '/><span>' + jsu.escapeHTML(label) + '</span></label>';
        }
        html += ' </div>';
        $('.ms-browser-filters', this.$topMenu).append(html);
        $('#open_hidden_categories', this.$topMenu).click(function () {
            if ($('#hidden_categories').hasClass('hidden-visibility')) {
                $('.fa', this).removeClass('fa-angle-down').addClass('fa-angle-up');
                $('#hidden_categories').removeClass('hidden-visibility');
            } else {
                $('#hidden_categories').addClass('hidden-visibility');
                $('.fa', this).removeClass('fa-angle-up').addClass('fa-angle-down');
            }
        });
        $('#hidden_categories .checkbox', this.$topMenu).click(function () {
            const checked = this.checked;
            obj.filterNoCategories = false;
            $('#filter_no_categories', obj.$topMenu).prop('checked', false);
            if (checked) {
                obj.filterCategories.push(this.value);
            } else {
                obj.filterCategories.splice(obj.filterCategories.indexOf(this.value), 1);
            }
            obj.channels.refreshDisplay(true);
            obj.latest.refreshDisplay(true);
            obj.search.refreshDisplay(true);
        });
        $('#filter_no_categories', this.$topMenu).click(function () {
            const checked = this.checked;
            if (checked) {
                obj.filterCategories = [];
                $('#hidden_categories .checkbox', obj.$topMenu).prop('checked', false);
                obj.filterNoCategories = true;
                obj.channels.refreshDisplay(true);
                obj.latest.refreshDisplay(true);
                obj.search.refreshDisplay(true);
            } else {
                obj.filterNoCategories = false;
                obj.channels.refreshDisplay(true);
                obj.latest.refreshDisplay(true);
                obj.search.refreshDisplay(true);
            }
        });
    }
};
MSBrowser.prototype.removeOidFromTab = function (tabObj, oid) {
    $('.item-entry-' + oid, tabObj.$content).remove();
    if (tabObj.lastResponse) {
        const sections = ['items', 'channels', 'live_streams', 'videos', 'photos_groups'];
        for (let j = 0; j < sections.length; j++) {
            let index = -1;
            if (tabObj.lastResponse[sections[j]]) {
                for (let i = 0; i < tabObj.lastResponse[sections[j]].length; i++) {
                    if (tabObj.lastResponse[sections[j]][i].oid == oid) {
                        index = i;
                        break;
                    }
                }
            }
            if (index != -1) {
                tabObj.lastResponse[sections[j]].splice(index, 1);
                break;
            }
        }
    }
};

MSBrowser.prototype.openStatistics = function (oid) {
    if (!this.overlayStats) {
        this.overlayStats = new OverlayDisplayManager();
    }
    this.overlayStats.show({
        title: jsu.translate('See statistics on this channel'),
        iframe: '/statistics/iframe/' + oid + '/?period=last_year'
    });
};
