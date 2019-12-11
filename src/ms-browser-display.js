/*******************************************
* MediaServer - MediaServer browser        *
* MSBrowser class extension                *
* Copyright: UbiCast, all rights reserved  *
* Author: Stephane Diemer                  *
*******************************************/
/* globals MSBrowser, utils */

MSBrowser.prototype.build_widget = function () {
    // build widget structure
    this.last_overlay_focus = document.activeElement;
    this.previous_focus = null;
    var channels_label, search_label, latest_label;
    if (this.filter_speaker == 'self') {
        channels_label = utils.translate('My channel');
        latest_label = utils.translate('My media');
        search_label = utils.translate('Search in my media');
    } else {
        channels_label = utils.translate('Channels');
        latest_label = utils.translate('Latest content');
        search_label = utils.translate('Search');
    }
    var html = '<div class="ms-browser ms-browser-container'+(this.use_overlay ? ' in-overlay' : '')+(this.tree_manager ? ' has-tree' : '')+(this.display_types_icons ? ' show-types-icons' : '')+(this.hide_header ? ' no-header' : '')+'">';
    html += '<div class="ms-browser-header">';
    html +=     '<div class="ms-browser-menu">';
    if (!this.use_overlay) {
        html += '<a id="ms_browser_channels_tab" class="ms-browser-tab button '+this.btn_class+'" href="'+this.url_channels+'" title="'+channels_label+'" aria-label="'+channels_label+'"><i class="fa fa-folder-open" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+channels_label+'</span></a>';
        html += '<a id="ms_browser_latest_tab" class="ms-browser-tab button '+this.btn_class+'" href="'+this.url_latest+'" title="'+latest_label+'" aria-label="'+latest_label+'"><i class="fa fa-clock-o" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+latest_label+'</span></a>';
        html += '<a id="ms_browser_search_tab" class="ms-browser-tab button '+this.btn_class+'" href="'+this.url_search+'" title="'+search_label+'" aria-label="'+search_label+'"><i class="fa fa-search" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+search_label+'</span></a>';
    } else {
        html += '<button type="button" id="ms_browser_channels_tab" class="ms-browser-tab button '+this.btn_class+'" title="'+channels_label+'" aria-label="'+channels_label+'"><i class="fa fa-folder-open" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+channels_label+'</span></button>';
        html += '<button type="button" id="ms_browser_latest_tab" class="ms-browser-tab button '+this.btn_class+'" title="'+latest_label+'" aria-label="'+latest_label+'"><i class="fa fa-clock-o" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+latest_label+'</span></button>';
        html += '<button type="button" id="ms_browser_search_tab" class="ms-browser-tab button '+this.btn_class+'" title="'+search_label+'" aria-label="'+search_label+'"><i class="fa fa-search" aria-hidden="true"></i> <span class="hidden-below-800" aria-hidden="true">'+search_label+'</span></button>';
    }
    html +=     '</div>';
    html +=     '<h2 class="ms-browser-title"></h2>';
    html += '</div>';
    html += '<div class="ms-browser-bar">';
    html += '</div>';
    html += '<div class="ms-browser-main ms-items">';
    html +=     '<div class="ms-browser-clear"></div>';
    html +=     '<div class="ms-browser-loading"><div><i class="fa fa-spinner fa-spin" aria-hidden="true"></i> '+utils.translate('Loading...')+'</div></div>';
    html +=     '<div class="ms-browser-message"><div></div></div>';
    html += '</div>';
    html += '</div>';
    this.$widget = $(html);
    var $bar_buttons, $top_buttons;
    if (!this.use_overlay && $('nav .buttons-left').length > 0) {
        $top_buttons = $('nav .buttons-left');
        $top_buttons.addClass('ms-browser');
        if (this.hide_header)
            $top_buttons.addClass('no-header');
        $top_buttons.append(this.get_top_menu_jq());
        $bar_buttons = $('#commands_place');
        $bar_buttons.addClass('ms-browser');
        if (this.hide_header)
            $bar_buttons.addClass('no-header');
        $bar_buttons.addClass('ms-browser-dropdown-right');
    } else {
        $top_buttons = $('.ms-browser-header', this.$widget);
        $top_buttons.addClass('ms-browser-dropdown-right');
        $top_buttons.prepend(this.get_top_menu_jq());
        $bar_buttons = $('.ms-browser-bar', this.$widget);
        $bar_buttons.addClass('ms-browser-dropdown-right');
    }
    $bar_buttons.append(this.latest.get_menu_jq());
    $bar_buttons.append(this.channels.get_menu_jq());
    $bar_buttons.append(this.search.get_menu_jq());
    this.$main = $('.ms-browser-main', this.$widget);
    this.$main.append(this.latest.get_content_jq());
    this.$main.append(this.channels.get_content_jq());
    this.$main.append(this.search.get_content_jq());
    this.$main.append('<div class="ms-browser-clear"></div>');
    this.$menu = $('.ms-browser-menu', this.$widget);

    // get initial media or channel info
    if (this.place)
        $(this.place).html(this.$widget);

    // events
    $('#ms_browser_channels_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.change_tab('channels'); return false;
    });
    $('#ms_browser_latest_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.change_tab('latest'); return false;
    });
    $('#ms_browser_search_tab', this.$menu).click({ obj: this }, function (event) {
        event.data.obj.change_tab('search'); return false;
    });
};
MSBrowser.prototype.get_top_menu_jq = function () {
    var sorting_values = [
        { 'default': utils.translate('Use channel default sorting') },
        { 'creation_date-desc': utils.translate('Creation date, descending') },
        { 'creation_date-asc': utils.translate('Creation date, ascending') },
        { 'add_date-desc': utils.translate('Add date, descending') },
        { 'add_date-asc': utils.translate('Add date, ascending') },
        { 'title-desc': utils.translate('Title, descending') },
        { 'title-asc': utils.translate('Title, ascending') },
        { 'comments-desc': utils.translate('Number of annotations, descending') },
        { 'comments-asc': utils.translate('Number of annotations, ascending') },
        { 'views-desc': utils.translate('Number of views, descending') },
        { 'views-asc': utils.translate('Number of views, ascending') }
    ];
    var html = '<div class="ms-browser-top-buttons">';
    html += '<div class="ms-browser-dropdown" id="ms_browser_display_dropdown">';
    html += '<button aria-controls="ms_browser_display_dropdow_menu" aria-expanded="false" type="button" title="' + utils.translate('Display') + '" class="button ms-browser-dropdown-button '+this.btn_class+'"><i class="fa fa-tv" aria-hidden="true"></i> <span class="hidden-below-1280">'+utils.translate('Display')+' </span><i class="fa fa-angle-down" aria-hidden="true"></i></button>';

    html += '<div class="ms-browser-dropdown-menu" id="ms_browser_display_dropdow_menu">';
    // display mode
    html += '<div><h4>'+utils.translate('Display mode:')+'</h4>';
    html += '<button type="button" class="button '+(!this.display_as_thumbnails ? 'active' : '')+'" id="ms_browser_display_as_list">'+utils.translate('list')+'</button>';
    html += '<button type="button" class="button '+(this.display_as_thumbnails ? 'active' : '')+'" id="ms_browser_display_as_thumbnails">'+utils.translate('thumbnails')+'</button><br/>';
    html += '<input id="ms_browser_display_types_icons" type="checkbox" '+(this.display_types_icons ? 'checked="checked"' : '')+'>';
    html += ' <label for="ms_browser_display_types_icons">'+utils.translate('display items type icons')+'</label></div>';
    // channel sorting
    html += '<div class="ms-browser-channel-order"><h4><label for="ms_browser_order_channel">'+utils.translate('Sort by:')+'</label></h4>';
    html += ' <select id="ms_browser_order_channel">';
    for (var index in sorting_values)
        for (var key in sorting_values[index])
        html +=     '<option value="'+key+'">'+sorting_values[index][key]+'</option>';
    html += '</select></div>';
    // filters
    var opt_html = '<option value="">'+utils.translate('unspecified')+'</option>';
    opt_html += '<option value="yes">'+utils.translate('yes')+'</option>';
    opt_html += '<option value="no">'+utils.translate('no')+'</option>';
    html += '<div class="ms-browser-filters"><h4>'+utils.translate('Filters:')+'</h4>';
    html += ' <form id="ms_browser_filters_form">';
    html += ' <label for="ms_browser_filter_editable">'+utils.translate('Editable:')+'</label>';
    html += ' <select id="ms_browser_filter_editable">'+opt_html+'</select>';
    if (this.displayable_content.length > 1 || this.displayable_content != 'c') {
        html += ' <br/>';
        html += ' <label for="ms_browser_filter_validated">'+utils.translate('Published:')+'</label>';
        html += ' <select id="ms_browser_filter_validated">'+opt_html+'</select>';
        if (this.filter_speaker != 'self') {
            html += ' <br/>';
            html += ' <label for="ms_browser_filter_speaker">'+utils.translate('Speaker:')+'</label>';
            html += ' <input type="text" id="ms_browser_filter_speaker" value=""/>';
            html += ' <button type="submit" class="button">'+utils.translate('Ok')+'</button>';
        }
    }
    html += ' </form>';
    html += '</div>';
    // TODO: pagination
    // html += '<div><h4>'+utils.translate('Number of elements per page:')+'</h4>';
    // html += '    <input type="number" class="center" id="elements_per_page" value="30"/>';
    // html += '<button type="button">'+utils.translate('Ok')+'</button></div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    this.$top_menu = $(html);
    // events
    var $dropdown = $('#ms_browser_display_dropdown', this.$top_menu);
    this.setup_dropdown($dropdown);
    $('#ms_browser_display_as_list', $dropdown).click({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.set_display_as_list();
        event.data.obj.close_dropdown(event.data.$dropdown);
    });
    $('#ms_browser_display_as_thumbnails', $dropdown).click({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.set_display_as_thumbnails();
        event.data.obj.close_dropdown(event.data.$dropdown);
    });
    $('#ms_browser_display_types_icons', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.set_display_types_icons(this.checked);
        event.data.obj.close_dropdown(event.data.$dropdown);
    });
    $('#ms_browser_order_channel', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.channels.set_order($(this).val());
        event.data.obj.close_dropdown(event.data.$dropdown);
    });
    $('#ms_browser_filters_form select', $dropdown).change({ obj: this, $dropdown: $dropdown }, function (event) {
        $('#ms_browser_filters_form', event.data.$dropdown).submit();
    });
    $('#ms_browser_filters_form', $dropdown).submit({ obj: this, $dropdown: $dropdown }, function (event) {
        event.data.obj.on_filters_submit($(this));
        event.data.obj.close_dropdown(event.data.$dropdown);
        return false;
    });
    return this.$top_menu;
};
MSBrowser.prototype.set_title = function (text, html) {
    if (!html)
        html = text;

    if (!this.use_overlay && $('#global .main-title h1').length > 0) {
        $('#global .main-title h1').html(html);
        $('#global .main-title h1').attr('tabindex', '-1');
        $('#global .main-title h1').focus();
    } else {
        $('.ms-browser-title', this.$widget).html(html);
    }

    if (!this.use_overlay && document.title) {
        if (!this.document_tilte_suffix) {
            var index = document.title.indexOf(' - ');
            if (index != -1)
                this.document_tilte_suffix = document.title.substring(index);
            else
                this.document_tilte_suffix = ' - MediaServer';
        }
        document.title = text + this.document_tilte_suffix;
    }
};

MSBrowser.prototype.setup_dropdown = function ($dropdown) {
    $('.ms-browser-dropdown-button', $dropdown).click({ $dropdown: $dropdown }, function (event) {
        var $btn = $('.ms-browser-dropdown-button', event.data.$dropdown);
        var $menu = $('.ms-browser-dropdown-menu', event.data.$dropdown);
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
        var $btn = $('.ms-browser-dropdown-button', event.data.$dropdown);
        var $menu = $('.ms-browser-dropdown-menu', event.data.$dropdown);
        if (!$menu.is(event.target) && $menu.has(event.target).length === 0 &&
            !$btn.is(event.target) && $btn.has(event.target).length === 0) {
            $btn.removeClass('active');
            $btn.attr('aria-expanded', false);
            $menu.removeClass('active');
        }
    });
};
MSBrowser.prototype.close_dropdown = function ($dropdown) {
    var $btn = $('.ms-browser-dropdown-button', $dropdown);
    var $menu = $('.ms-browser-dropdown-menu', $dropdown);
    if ($btn.hasClass('active')) {
        $btn.removeClass('active');
        $btn.attr('aria-expanded', false);
        $menu.removeClass('active');
    }
};

MSBrowser.prototype.on_filters_submit = function ($form) {
    var inputs = [
        { type: 'choice', id: 'ms_browser_filter_editable', name: 'filter_editable' },
        { type: 'choice', id: 'ms_browser_filter_validated', name: 'filter_validated' }
    ];
    if (this.filter_speaker != 'self')
        inputs.push({ type: 'text', id: 'ms_browser_filter_speaker', name: 'filter_speaker' });
    var changed = false;
    for (var i = 0; i < inputs.length; i++) {
        var $input = $('#' + inputs[i].id, $form);
        if ($input.length > 0) {
            var value = $input.val();
            if (inputs[i].type == 'choice') {
                switch (value) {
                    case 'yes': value = true; break;
                    case 'no': value = false; break;
                    default: value = null; break;
                }
            }
            if (this[inputs[i].name] !== value) {
                this[inputs[i].name] = value;
                changed = true;
            }
        }
    }
    if (changed) {
        this.channels.refresh_display(true);
        this.latest.refresh_display(true);
        this.search.refresh_display(true);
    }
};
MSBrowser.prototype.set_display_as_list = function () {
    if ($('#ms_browser_display_as_list', this.$top_menu).hasClass('active'))
        return;
    this.display_as_thumbnails = false;
    $('#ms_browser_display_as_thumbnails', this.$top_menu).removeClass('active');
    $('#ms_browser_display_as_list', this.$top_menu).addClass('active');
    if (!this.use_overlay)
        $('#global').addClass('max-width-1200');
    utils.set_cookie('catalog-display_mode', 'list');
    this.channels.refresh_display();
    this.latest.refresh_display();
    this.search.refresh_display();
};
MSBrowser.prototype.set_display_as_thumbnails = function () {
    if ($('#ms_browser_display_as_thumbnails', this.$top_menu).hasClass('active'))
        return;
    this.display_as_thumbnails = true;
    $('#ms_browser_display_as_list', this.$top_menu).removeClass('active');
    $('#ms_browser_display_as_thumbnails', this.$top_menu).addClass('active');
    if (!this.use_overlay)
        $('#global').removeClass('max-width-1200');
    utils.set_cookie('catalog-display_mode', 'thumbnail');
    this.channels.refresh_display();
    this.latest.refresh_display();
    this.search.refresh_display();
};
MSBrowser.prototype.set_display_types_icons = function (checked) {
    this.display_types_icons = checked;
    if (checked)
        this.$widget.addClass('show-types-icons');
    else
        this.$widget.removeClass('show-types-icons');
    utils.set_cookie('catalog-display_types_icons', checked ? 'yes' : 'no');
};
MSBrowser.prototype.get_active_tab = function () {
    var $active = $('.ms-browser-tab.active', this.$menu);
    var name = $active.length > 0 ? $active.attr('id').replace(/_tab/g, '').replace(/ms_browser_/g, '') : null;
    if (!name && !this.pick_mode) {
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
MSBrowser.prototype.change_tab = function (tab, no_pushstate) {
    var previous = this.get_active_tab();
    if (previous == tab)
        return;

    if (previous && this[previous]) {
        $('.ms-browser').removeClass(previous);
        $('#ms_browser_'+previous+'_tab', this.$menu).removeClass('active');
        this[previous].$menu.css('display', 'none');
        this[previous].$content.css('display', 'none');
    }
    $('.ms-browser').addClass(tab);
    $('#ms_browser_'+tab+'_tab', this.$menu).addClass('active');
    if (this[tab]) {
        this[tab].$menu.css('display', '');
        this[tab].$content.css('display', '');
        this[tab].on_show();
    }
    // special case
    if (tab == 'channels')
        $('.ms-browser-channel-order', this.$top_menu).css('display', '');
    else
        $('.ms-browser-channel-order', this.$top_menu).css('display', 'none');

    if (!this.use_overlay && !no_pushstate) {
        var url;
        if (tab == 'search')
            url = this.url_search;
        else if (tab == 'latest')
            url = this.url_latest;
        else
            url = this.url_channels + window.location.hash;
        window.history.pushState({'ms_tab': tab}, tab, url);
    }
};

MSBrowser.prototype.display_loading = function () {
    if (isNaN(this.loading_count))
        this.loading_count = 1;
    else
        this.loading_count ++;
    if (this.loading_timeout)
        return;
    var obj = this;
    this.loading_timeout = setTimeout(function () {
        $('.ms-browser-loading', obj.$widget).css('display', 'block');
        obj.loading_timeout = null;
    }, 500);
};
MSBrowser.prototype.hide_loading = function () {
    if (this.loading_count)
        this.loading_count --;
    if (isNaN(this.loading_count) || this.loading_count > 0)
        return;
    if (this.loading_timeout) {
        clearTimeout(this.loading_timeout);
        this.loading_timeout = null;
    }
    $('.ms-browser-loading', this.$widget).css('display', '');
};

MSBrowser.prototype.display_content = function ($container, data, cat_oid, tab) {
    var i, selectable, $section;
    var markup = (this.pick_mode ? 'h3' : 'h2');
    var section_html = '<ul class="ms-browser-section"></ul>';
    if (data.channels && data.channels.length > 0) {
        // sub channels
        selectable = this.selectable_content.indexOf('c') != -1;
        $section = $(section_html);
        if (cat_oid && cat_oid != '0') {
            $section.append('<' + markup + '>'+utils.translate('Sub channels')+'</' + markup + '>');
        } else if (tab == 'search') {
            $section.append('<' + markup + '>'+utils.translate('Channels')+'</' + markup + '>');
        }

        for (i = 0; i < data.channels.length; i++) {
            if (data.channels[i].parent_oid === undefined && cat_oid)
                data.channels[i].parent_oid = cat_oid;

            $section.append(this.get_content_entry('channel', data.channels[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.live_streams && data.live_streams.length > 0) {
        // live streams
        selectable = this.selectable_content.indexOf('l') != -1;
        $section = $(section_html);
        $section.append('<' + markup + '>'+utils.translate('Live streams')+'</' + markup + '>');

        for (i = 0; i < data.live_streams.length; i++) {
            $section.append(this.get_content_entry('live', data.live_streams[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.videos && data.videos.length > 0) {
        // videos
        selectable = this.selectable_content.indexOf('v') != -1;
        $section = $(section_html);
        $section.append('<' + markup + '>'+utils.translate('Videos')+'</' + markup + '>');
        for (i = 0; i < data.videos.length; i++) {
            $section.append(this.get_content_entry('video', data.videos[i], selectable, tab));
        }
        $container.append($section);
    }
    if (data.photos_groups && data.photos_groups.length > 0) {
        // photos groups
        selectable = this.selectable_content.indexOf('p') != -1;
        $section = $(section_html);
        $section.append('<' + markup + '>'+utils.translate('Photos groups')+'</' + markup + '>');
        for (i = 0; i < data.photos_groups.length; i++) {
            $section.append(this.get_content_entry('photos', data.photos_groups[i], selectable, tab));
        }
        $container.append($section);
    }
};
MSBrowser.prototype.get_content_entry = function (item_type, item, gselectable, tab) {
    this.update_catalog(item);
    var oid = item.oid;
    var selectable = gselectable && (!this.parent_selection_oid || item.selectable);
    var clickable = this.pick_mode && (selectable || item_type == 'channel');
    var $entry = null;
    $entry = $('<li class="item-entry item-type-'+item_type+' item-entry-'+oid+'"></li>');
    $entry.attr('id', 'item_entry_'+oid+'_'+tab);
    $entry.addClass(this.display_as_thumbnails ? 'thumbnail' : 'list');
    if (this.current_selection && this.current_selection.oid == oid) {
        $entry.addClass('selected');
        $entry.attr('title', item.title + ' ' + utils.translate('selected'));
    }
    if (selectable)
        $entry.addClass('selectable');
    if (clickable)
        $entry.addClass('clickable');
    if (item.extra_class)
        $entry.addClass(item.extra_class);
    var html = this._get_entry_block_html(item, item_type, clickable, tab);
    if (this.display_as_thumbnails && !this.pick_mode) {
        html += '<div class="item-entry-buttons">';
        html +=   '<button type="button" class="item-entry-info" title="'+utils.translate('Open information panel')+'"><i class="fa fa-info" aria-hidden="true"></i></button>';
        if (item.can_edit) {
            html += '<a title="'+utils.translate('Edit')+'" href="'+this.get_button_link(item, 'edit')+'"'+this.links_target+'><i class="fa fa-pencil" aria-hidden="true"></i></a>';
        }
        html +=   '<div class="overlay-info ms-items" id="item_entry_'+oid+'_'+tab+'_info" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="item_entry_'+item.oid+'_'+tab+'_info_title" aria-modal="true"></div>';
        html += '</div>';
    }
    var $entry_block = $(html);
    this._set_on_click_entry_block($entry_block, oid, item_type, item, selectable);
    $entry.append($entry_block);
    if (this.display_as_thumbnails) {
        this._set_thumbnail_info_box_html(item_type, selectable, oid, $entry, item, tab);
    } else {
        var $entry_links = this.get_entry_links(item, item_type, selectable);
        if ($entry_links)
            $entry.append($entry_links);
    }
    $('.item-entry-link', $entry).focus(function () {
        $('.item-entry').removeClass('focus');
        $(this).parent().addClass('focus');
    });
    return $entry;
};
MSBrowser.prototype._get_entry_block_html = function (item, item_type, clickable, tab) {
    var markup = 'span';
    var href = '';
    var button_style = ' tabindex="0" role="button"';
    if (!this.use_overlay && item.slug && (!this.pick_mode || item_type == 'channel')) {
        markup = 'a';
        button_style = '';
        href = ' href="'+this.get_button_link(item, 'view')+'"';
        if (item_type != 'channel') {
            href += this.links_target;
        }
    }

    var html = '<' + markup + href + button_style + ' class="item-entry-link"' + (clickable && item_type != 'channel' ? ' title="' + utils.translate('Click to select this media') + '"' : '') + '>';

    /********************** Image preview ****************/
    var image_preview = '<span class="item-entry-preview">';
    image_preview += '<span class="item-entry-preview-aligner"></span>';
    if (item.thumb) {
        image_preview += '<img src="' + item.thumb + '" alt=""' + (item.language ? ' lang="' + item.language + '"' : '') + '/>';
    }
    if (!this.pick_mode && item_type != 'channel') {
        image_preview += '<b class="item-entry-preview-play"><i class="fa fa-play fa-4x" aria-hidden="true"></i></b>';
    }
    image_preview += '</span>';
    html += image_preview;

    /********************** Content ********************/
    var content = '<span class="item-entry-content">';

    /********************** Top bar ****************/
    var top_bar = '<span class="item-entry-top-bar">';
    // type icon
    if (item_type == 'channel') {
        top_bar += '<span class="item-entry-layout layout-channel" title="' +
                    utils.translate('This item is a channel') + '"></span>';
    } else {
        if (item_type == 'photos') {
            top_bar += '<span class="item-entry-layout layout-pgroup" title="' +
                        utils.translate('This item is a photos group') + '"></span>';
        } else {
            top_bar += '<span class="item-entry-layout ';
            if (item.layout)
                top_bar += 'layout-' + item.layout;
            else
                top_bar += 'layout-video';
            top_bar += '" title="';
            var title_text = utils.translate(item_type == 'live' ? 'This item is a live stream' : 'This item is a video');
            if (item.layout) {
                if (item.layout == 'composition') {
                    title_text += ' (' + utils.translate('dynamic RichMedia') + ')';
                } else if (item.layout == 'webinar') {
                    title_text += ' (' + utils.translate('classic RichMedia') + ')';
                } else {
                    title_text += ' (' + item.layout.replace(/_/, ' ') + ')';
                }
            }
            top_bar += title_text;
            top_bar += '"><span class="sr-only">' + title_text + '</span></span>';
        }
    }
    // element top_bar
    if (item.can_edit) {
        if (item_type == 'channel') {
            if (item.unlisted)
                top_bar += '<span class="item-entry-unlisted" title="' +
                            utils.translate('This channel is unlisted') + '"><span class="sr-only">' +
                            utils.translate('This channel is unlisted') + '</span></span>';
        } else {
            if (!item.validated)
                top_bar += '<span class="item-entry-notpublished" title="' +
                            utils.translate('This media is not published') + '"><span class="sr-only">' +
                            utils.translate('This media is not published') + '</span></span>';
            else if (item.unlisted)
                top_bar += '<span class="item-entry-unlisted" title="' +
                            utils.translate('This media is published and unlisted') + '"><span class="sr-only">' +
                            utils.translate('This media is published and unlisted') + '</span></span>';
            else
                top_bar += '<span class="item-entry-published" title="' +
                            utils.translate('This media is published') + '"><span class="sr-only">' +
                            utils.translate('This media is published') + '</span></span>';
            if (item_type == 'video' && !item.ready)
                top_bar += '<span class="item-entry-notready" title="' +
                            utils.translate('This video is not ready') + '"><span class="sr-only">' +
                            utils.translate('This video is not ready') + '</span></span>';
        }
    }
    // duration
    if (item.duration)
        top_bar += '<span class="item-entry-duration">' + item.duration + '</span>';
    // title
    if (!this.display_as_thumbnails)
        top_bar += '<span class="item-entry-title"' + (item.language ? ' lang="' + item.language + '"' : '') + '>' + utils.escape_html(item.title) + '</span>';
    top_bar += '</span>';
    content += top_bar;

    /********************** Bottom bar ****************/
    var bottom_bar = '<span class="item-entry-bottom-bar">';
    if (this.display_as_thumbnails) {
        bottom_bar += '<span class="item-entry-title"' + (item.language ? ' lang="' + item.language + '"' : '') + '>' + utils.escape_html(item.title) + '</span>';
    } else {
        if (item.creation)
            bottom_bar += '<span class="item-entry-date">' + utils.translate('Created on') + ' ' +
                        utils.get_date_display(item.creation) + '</span>';
        if (item.short_description)
            bottom_bar += '<span class="item-entry-description">' + $('<span>' + item.short_description + '</span>').text() + '</span>';
        if (item.views) {
            bottom_bar += '<span class="item-entry-views">' + item.views + ' ' + utils.translate('views');
            if (item.views_last_month)
                bottom_bar += ', ' + item.views_last_month + ' ' + utils.translate('this month');
            bottom_bar += '</span>';
        }
        if (tab == 'latest') {
            bottom_bar += '<span class="item-entry-type">' + utils.translate('Type:') + ' ' +
                            utils.translate(item_type) + '</span>';
            if (item.add_date)
                bottom_bar += '<span class="item-entry-date">' + utils.translate('Added on') + ' ' +
                                utils.get_date_display(item.add_date) + '</span>';
            if (item.parent_title)
                bottom_bar += '<span class="item-entry-parent">' + utils.translate('Parent channel:') + ' ' +
                                item.parent_title + '</span>';
        }
    }
    bottom_bar += '</span>';
    content += bottom_bar;
    content += '</span>';

    html += content;
    html += '</' + markup + '>';

    /********************** Search data **********************/
    if (!this.display_as_thumbnails && !this.pick_mode && tab == 'search' && (item.annotations || item.photos)) {
        html += '<span class="item-entry-extra">';
        var i;
        if (item.annotations) {
            html += '<span>' + utils.translate('Matching annotations:') + '</span><ul>';
            for (i=0; i < item.annotations.length; i++) {
                var annotation = item.annotations[i];
                html += '<li><a href="' + this.get_button_link(item, 'view') + '#start=' + annotation.time + '&autoplay"'+this.links_target+'>';
                if (annotation.title)
                    html += annotation.title;
                html += ' (' + annotation.time_display + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        if (item.photos) {
            html += '<span>' + utils.translate('Matching photos:') + '</span><ul>';
            for (i=0; i < item.photos.length; i++) {
                var photo = item.photos[i];
                html += '<li><a href="' + this.get_button_link(item, 'view') + '#' + photo.index + '"'+this.links_target+'>';
                if (photo.title)
                    html += photo.title;
                html += ' (#' + photo.index + ') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        html += '</span>';
    }
    return html;
};
MSBrowser.prototype._set_on_click_entry_block = function ($entry_block, oid, item_type, item, selectable) {
    if (this.pick_mode) {
        if (item_type == 'channel' || item_type == 'parent') {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.channels.display_channel(event.data.oid);
                event.data.obj.change_tab('channels');
                utils.focus_first_descendant($('#ms_browser_channels .ms-browser-channels-place')[0]);
            });
        } else if (selectable) {
            $entry_block.click({ obj: this, oid: oid }, function (event) {
                event.data.obj.pick(event.data.oid);
            });
        }
        $entry_block.keydown(function (event) {
            if (event.which == '13') { // enter
                event.preventDefault();
                event.stopPropagation();
                $(this).trigger('click');
            }
        });
    }
    else if (item.can_delete) {
        $('.item-entry-pick-delete-media', $entry_block).click({ obj: this, oid: oid }, function (event) {
            event.data.obj.pick(event.data.oid, 'delete');
        });
    }
};

MSBrowser.prototype.get_entry_links = function (item, item_type, selectable) {
    var html = '';
    if (this.pick_mode) {
        if (selectable) {
            var selected = this.current_selection && this.current_selection.oid == item.oid;
            var icon = selected ? 'fa-check-circle' : 'fa-check';
            var label;
            if (item_type == 'channel' || item_type == 'current') {
                if (selected)
                    label = utils.translate('This channel is selected');
                else
                    label = utils.translate('Select this channel');
            } else {
                if (selected)
                    label = utils.translate('This media is selected');
                else
                    label = utils.translate('Select this media');
            }
            html += '<button type="button" class="'+this.btn_class+' button main item-entry-pick"><i class="fa '+icon+'" aria-hidden="true"></i> <span class="hidden-below-800">'+utils.translate(label)+'</span></button>';
        }
    } else {
        if (item_type == 'current') {
            if (item.can_edit) {
                html += '<a title="' + utils.translate('Edit') + '" class="'+this.btn_class+' button default item-entry-pick item-entry-pick-edit-media" href="'+this.get_button_link(item, 'edit')+'"'+this.links_target+'><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden-below-800">'+utils.translate('Edit')+'</span></a>';
                if (item.can_delete)
                    html += '<button title="' + utils.translate('Delete') + '" type="button" class="'+this.btn_class+' button danger item-entry-pick-delete-media"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-800">'+utils.translate('Delete')+'</span></button>';
            }
            if (item.can_add_channel || item.can_add_video) {
                if (item.can_add_channel) {
                    var add_channel_icon = '<i class="fa fa-folder" aria-hidden="true"></i>' +
                    ' <i class="fa fa-plus color-green" aria-hidden="true"></i>';
                    html += '<a title="' + utils.translate('Add a sub channel') + '"' +
                            ' class="' + this.btn_class + ' button item-entry-pick item-entry-pick-add-channel" href="' +
                            this.get_button_link(item, 'add_channel') + '"' + this.links_target + '>' + add_channel_icon +
                            ' <span class="hidden-below-800">' +
                            utils.translate('Add a sub channel')+'</span></a>';
                }
                if (item.oid != '0' && item.can_add_video) {
                    var add_video_icon = '<i class="fa fa-film" aria-hidden="true"></i>' +
                    ' <i class="fa fa-plus color-green" aria-hidden="true"></i>';
                    html += '<a title="' + utils.translate('Add a video') + '"' +
                            ' class="'+this.btn_class+' button item-entry-pick item-entry-pick-add-video" href="' +
                            this.get_button_link(item, 'add_video') + '"' + this.links_target + '>' + add_video_icon +
                            ' <span class="hidden-below-800">' +
                            utils.translate('Add a video')+'</span></a>';
                }
            }
        } else {
            if (item_type != 'channel' && this.lti_mode) {
                html += '<button type="button" class="'+this.btn_class+' button default item-entry-copy" data-link="'+this.get_button_link(item, 'lti', true)+'"><i class="fa fa-chain" aria-hidden="true"></i> <span class="hidden-below-440">'+utils.translate('Copy LTI link')+'</span></button>';
            }
            if ((item_type != 'channel' && this.lti_mode) || item.can_edit || item.can_delete) {
                html += '<a class="'+this.btn_class+' button default item-entry-pick-view-media" href="'+this.get_button_link(item, 'view')+'"'+this.links_target+'><i class="fa fa-eye" aria-hidden="true"></i> <span class="hidden-below-440">'+utils.translate('See')+'</span></a>';
            }
            if (item.can_edit) {
                html += '<a class="'+this.btn_class+' button item-entry-pick-edit-media default" href="'+this.get_button_link(item, 'edit')+'"'+this.links_target+'><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden-below-440">'+utils.translate('Edit') +'</span></a>';
            }
            if (item.can_delete)
                html += '<button type="button" class="'+this.btn_class+' button item-entry-pick-delete-media danger"><i class="fa fa-trash" aria-hidden="true"></i> <span class="hidden-below-440">'+utils.translate('Delete')+'</span></button>';
        }
    }
    if (!html)
        return null;
    html = '<span class="item-entry-links"><span class="item-entry-links-container">'+html+'</span></span>';
    var $entry_links = $(html);
    // events
    if (item_type == 'channel' || item_type == 'parent') {
        $('.item-entry-display', $entry_links).click({ obj: this, item: item }, function (event) {
            if (event.data.obj.pick_mode)
                event.data.obj.channels.display_channel(event.data.item.oid);
        });
    }
    if (selectable) {
        $('.item-entry-pick', $entry_links).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid);
        });
    }
    if (!this.pick_mode && item.can_delete) {
        $('.item-entry-pick-delete-media', $entry_links).click({ obj: this, item: item }, function (event) {
            event.data.obj.pick(event.data.item.oid, 'delete');
        });
    }
    var $copy_btn = $('.item-entry-copy', $entry_links);
    if ($copy_btn.length > 0) {
        $('.item-entry-copy', $entry_links).click(function() {
            var $btn = $(this);
            var to_copy = $btn.attr('data-link');
            // invisible inputs cannot be copied
            var $temp_input = $('<input type="text" style="position: absolute; left: -10000px; top: 0;"/>').val(to_copy);
            $('body').append($temp_input);
            $temp_input.select();
            var successful, msg;
            try {
                successful = document.execCommand('copy');
                msg = successful ? 'copied' : 'cannot copy';
            } catch (err) {
                successful = false;
                msg = 'failed to copy';
                console.log('Failed to copy to clipboard: ' + err);
            }
            msg = '<i class="fa ' + (successful ? 'fa-check' : 'fa-warning') + '" aria-hidden="true"></i> ' + utils.translate(msg);
            $btn.append('<span class="copy-msg">' + msg + '</span>');
            $btn.addClass('copied');
            setTimeout(function () {
                $btn.removeClass('copied');
                $('.copy-msg', $btn).remove();
            }, 1000);
            $temp_input.remove();
        });
    }

    return $entry_links;
};
MSBrowser.prototype.get_button_link = function (item, action, absolute) {
    var url = '';
    var hash = '';
    var type = '';
    if (item && item.oid) {
        type = item.oid[0];
    }
    if (!action && (!type || type === '' || type === '0') && (!item || item.oid == '0')) {
        url = '/channels/';
        hash = '#';
    } else if (action == 'view') {
        if (!item.slug && item.oid != '0') {
            // FIXME: the following call is asynchronous and won't work
            this.get_info_for_oid(item.oid, false, function (data) {
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
            if (url && this.iframe_mode)
                url += 'iframe/';
        }
    } else if (action == 'lti') {
        url = '/lti/'+item.oid+'/';
    } else if (action == 'edit') {
        if (this.iframe_mode)
            url = '/edit/iframe/'+item.oid+'/';
        else
            url = '/edit/'+item.oid+'/';
    } else if (action == 'add_channel') {
        url = '/add-content/channel/?in='+(item && item.oid != '0' ? item.oid : 'root');
    } else if (action == 'add_video') {
        url = '/add-content/';
        hash = '#add_media_by_upload';
        if (item && item.oid != '0')
            url += '?in='+item.oid;
    } else {
        console.error('Unrecognized action specified in MSBrowser.prototype.get_button_link call:', item, action, absolute);
        return '';
    }

    if (absolute) {
        url = window.location.protocol + '//' + window.location.host + url;
    }

    if (this.links_url_params && action != 'lti') {
        url += (url.indexOf('?') < 0 ? '?' : '&') + this.links_url_params;
    }
    return url + hash;
};
MSBrowser.prototype._get_thumbnail_info_box_html = function (item, item_type, selectable, tab) {
    var html = '<div><div tabindex="0"></div>';
    html += '<div class="trap-focus">';
    html += '<div class="overlay-info-title" id="item_entry_'+item.oid+'_'+tab+'_info_title" >';
    html +=     '<button type="button" class="overlay-info-close button default '+this.btn_class+'" title="'+utils.translate('Hide this window')+'" aria-label="'+utils.translate('Hide this window')+'"><i class="fa fa-close" aria-hidden="true"></i></button>';
    html +=     '<h1><a href="'+this.get_button_link(item, 'view')+'"'+this.links_target+'>'+item.title+'</a></h1>';
    html += '</div>';
    html += '<div class="overlay-info-content">';
    if (!this.pick_mode && tab == 'search' && (item.annotations || item.photos)) {
        var i;
        if (item.annotations) {
            html += '<div><b>'+utils.translate('Matching annotations:')+'</b></div>';
            html += '<ul>';
            for (i=0; i < item.annotations.length; i++) {
                var annotation = item.annotations[i];
                html += '<li><a href="'+this.get_button_link(item, 'view')+'#start='+annotation.time+'&autoplay"'+this.links_target+'>';
                if (annotation.title)
                    html += annotation.title;
                html += ' ('+annotation.time_display+') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        if (item.photos) {
            html += '<div><b>'+utils.translate('Matching photos:')+'</b></div>';
            html += '<ul>';
            for (i=0; i < item.photos.length; i++) {
                var photo = item.photos[i];
                html += '<li><a href="'+this.get_button_link(item, 'view')+'#'+photo.index+'"'+this.links_target+'>';
                if (photo.title)
                    html += photo.title;
                html += ' (#'+photo.index+') ';
                html += '</a></li>';
            }
            html += '</ul>';
        }
        html += '<hr/>';
    }
    html += '<table class="overlay-info-table">';
    html += '<caption class="sr-only">' + utils.translate('Media information') + '</caption>';
    if (item.creation && item_type == 'video') {
        html += '<tr>';
        html +=     '<th scope="row" class="overlay-info-label">'+utils.translate('Recording date')+' :</th>';
        html +=     '<td>'+utils.get_date_display(item.creation)+'</td>';
        html += '</tr>';
    }
    if (item.add_date) {
        html += '<tr>';
        html +=     '<th scope="row" class="overlay-info-label">'+utils.translate('Publishing date')+' :</th>';
        html +=     '<td>'+utils.get_date_display(item.add_date)+'</td>';
        html += '</tr>';
    }
    if (item.duration) {
        html += '<tr>';
        html +=     '<th scope="row" class="overlay-info-label">'+utils.translate('Duration')+' :</th>';
        html +=     '<td>'+item.duration+'</td>';
        html += '</tr>';
    }
    if (item.views_last_month)
        html +=         '<tr><th scope="row" class="overlay-info-label">'+utils.translate('Views last month')+' :</th><td>'+item.views_last_month+'</td></tr>';
    if (item.views)
        html +=         '<tr><th scope="row" class="overlay-info-label">'+utils.translate('Views')+' :</th><td>'+item.views+'</td></tr>';
    if (item.comments_last_month)
        html +=         '<tr><th scope="row" class="overlay-info-label">'+utils.translate('Annotations last month')+' :</th><td>'+item.comments_last_month+'</td></tr>';
    if (item.comments)
        html +=         '<tr><th scope="row" class="overlay-info-label">'+utils.translate('Annotations')+' :</th><td>'+item.comments+'</td></tr>';
    html += '</table>';
    if (item.short_description) {
        html += '<hr/>';
        html += '<div class="float-container">'+item.short_description+'</div>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div tabindex="0"></div></div>';
    var $info = $(html);
    var $entry_links = this.get_entry_links(item, item_type, selectable);
    if ($entry_links)
        $('.overlay-info-content', $info).append($entry_links);
    $('.overlay-info-close', $info).click({ obj: this }, function (event) {
        event.data.obj.box_hide_info();
    });
    $(document).keydown({ obj: this }, function (event) {
        if (!$('#item_entry_'+item.oid+'_'+tab+'_info').length)
            return;
        if (event.keyCode == 27) {
            event.stopImmediatePropagation();
            event.data.obj.box_hide_info();
        }
    });
    return $info;
};
MSBrowser.prototype._set_thumbnail_info_box_html = function (item_type, selectable, oid, $entry, item, tab) {
    $('.item-entry-info', $entry).click({ obj: this, $entry: $entry }, function (event) {
        var info_id = '#'+$entry.attr('id')+'_info';
        event.data.obj.previous_focus = this;
        if ($(info_id, event.data.$entry).html() !== '') {
            event.data.obj.box_open_info($entry);
            return;
        }
        if (tab == 'search') {
            var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable, tab);
            $(info_id, event.data.$entry).append($element);
            event.data.obj.box_open_info($entry);
        } else {
            event.data.obj.get_info_for_oid(oid, true, function (data) {
                var item = data.info;
                event.data.obj.update_catalog(data.info);
                var $element = event.data.obj._get_thumbnail_info_box_html(item, item_type, selectable, tab);
                $(info_id, event.data.$entry).append($element);
                event.data.obj.box_open_info($entry);
            });
        }
    });
};
MSBrowser.prototype.trap_focus = function (element, event) {
    if (utils.ignore_until_focus_changes) {
      return;
    }
    if (element.contains(event.target)) {
      this.last_overlay_focus = event.target;
    } else {
      utils.focus_first_descendant(element);
      if (this.last_overlay_focus == document.activeElement) {
        utils.focus_last_descendant(element);
      }
      this.last_overlay_focus = document.activeElement;
    }
};
MSBrowser.prototype.box_open_info = function ($entry) {
    this.box_hide_info();
    var info_id = '#'+$entry.attr('id')+'_info';
    var $info_box = $(info_id);
    if (!$info_box.hasClass('moved'))
        // move box in body if not already done
        $info_box.addClass('moved').detach().appendTo('body');
    if (!$info_box.is(':visible')) {
        var block = $('.item-entry-preview', $entry);
        var top = parseInt(block.offset().top, 10) - 1;
        var left = (parseInt(block.offset().left, 10) + block.width());
        var right = 'auto';
        if (($(window).width() / 2.0) - left < 0) {
            left = 'auto';
            right = $(window).width() - parseInt(block.offset().left, 10);
        }
        $info_box.css('left', left + 'px');
        $info_box.css('right', right + 'px');
        $info_box.css('top', top + 'px');
        $('.item-entry-info', $entry).addClass('info-displayed');
        $info_box.fadeIn('fast');
        this.last_overlay_focus = document.activeElement;
        $info_box.focusin(this.trap_focus.bind(this, $('.trap-focus', $info_box)[0]));
        utils.focus_first_descendant($('.trap-focus', $info_box)[0]);

        if (this.box_click_handler)
            $(document).unbind('click', this.box_click_handler);
        var obj = this;
        this.box_click_handler = function (event) {
            if (!$(event.target).closest(info_id).length && !$(event.target).closest('.item-entry-info').length && $(info_id).is(':visible'))
                obj.box_hide_info();
        };
        $(document).click(this.box_click_handler);
    }
};
MSBrowser.prototype.box_hide_info = function () {
    if ($('.overlay-info:visible').length) {
        $('.overlay-info:visible').off('focusin');
        this.last_overlay_focus = document.activeElement;
        $('.overlay-info:visible').fadeOut('fast');
        $('.item-entry-info.info-displayed').removeClass('info-displayed');
        if (this.previous_focus) {
            this.previous_focus.focus();
        }
    }
};
MSBrowser.prototype.display_categories = function () {
    var obj = this;
    if (this.site_settings_categories.length > 0) {
        var html = ' <button type="button" id="open_hidden_categories" class="button">' + utils.translate('Categories') + ' <i class="fa fa-angle-down" aria-hidden="true"></i></button>';
        html += ' <div id="hidden_categories" class="hidden-visibility">';
        html += ' <label for="filter_no_categories"><input id="filter_no_categories" type="checkbox"/><span>' + utils.translate('Unspecified') + '</span></label><br />';
        for (var i = 0; i < this.site_settings_categories.length; i++) {
            var slug = utils.escape_attr(this.site_settings_categories[i][0]);
            var label = utils.escape_html(this.site_settings_categories[i][1]);
            html += ' <label for="' + slug + '"><input class="checkbox" id="' + slug + '" type="checkbox" value="' + slug + '"/><span>' + label + '</span></label>';
        }
        html += ' </div>';
        $('.ms-browser-filters', this.$top_menu).append(html);
        $('#open_hidden_categories', this.$top_menu).click(function () {
            if ($('#hidden_categories').hasClass('hidden-visibility')) {
                $('.fa', this).removeClass('fa-angle-down').addClass('fa-angle-up');
                $('#hidden_categories').removeClass('hidden-visibility');
            } else {
                $('#hidden_categories').addClass('hidden-visibility');
                $('.fa', this).removeClass('fa-angle-up').addClass('fa-angle-down');
            }
        });
        $('#hidden_categories .checkbox', this.$top_menu).click(function () {
            var checked = this.checked;
            obj.filter_no_categories = false;
            $('#filter_no_categories', obj.$top_menu).prop('checked', false);
            if (checked)
                obj.filter_categories.push(this.value);
            else
                obj.filter_categories.splice(obj.filter_categories.indexOf(this.value), 1);
            obj.channels.refresh_display(true);
            obj.latest.refresh_display(true);
            obj.search.refresh_display(true);
        });
        $('#filter_no_categories', this.$top_menu).click(function () {
            var checked = this.checked;
            if (checked) {
                obj.filter_categories = [];
                $('#hidden_categories .checkbox', obj.$top_menu).prop('checked', false);
                obj.filter_no_categories = true;
                obj.channels.refresh_display(true);
                obj.latest.refresh_display(true);
                obj.search.refresh_display(true);
            } else {
                obj.filter_no_categories = false;
                obj.channels.refresh_display(true);
                obj.latest.refresh_display(true);
                obj.search.refresh_display(true);
            }
        });
    }
};
MSBrowser.prototype.remove_oid_from_tab = function (tab_obj, oid) {
    $('.item-entry-'+oid, tab_obj.$content).remove();
    if (tab_obj.last_response) {
        var sections = ['items', 'channels', 'live_streams', 'videos', 'photos_groups'];
        for (var j = 0; j < sections.length; j++) {
            var index = -1;
            if (tab_obj.last_response[sections[j]]) {
                for (var i = 0; i < tab_obj.last_response[sections[j]].length; i++) {
                    if (tab_obj.last_response[sections[j]][i].oid == oid) {
                        index = i;
                        break;
                    }
                }
            }
            if (index != -1) {
                tab_obj.last_response[sections[j]].splice(index, 1);
                break;
            }
        }
    }
};
