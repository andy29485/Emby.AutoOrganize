﻿define(['loading', 'libraryMenu', 'listViewStyle'], function (loading, libraryMenu) {
    'use strict';

    var query = {

        StartIndex: 0,
        Limit: 100000
    };

    var currentResult;

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function reloadList(page) {

        loading.show();

        ApiClient.getSmartMatchInfos(query).then(function (infos) {

            currentResult = infos;

            populateList(page, infos);

            loading.hide();

        }, function () {

            loading.hide();
        });
    }

    function getHtmlFromMatchStrings(info, i) {

        var matchStringIndex = 0;

        return info.MatchStrings.map(function (m) {

            var matchStringHtml = '';

            matchStringHtml += '<div class="listItem">';

            matchStringHtml += '<div class="listItemBody" style="padding: .1em 1em .4em 5.5em; min-height: 1.5em;">';

            matchStringHtml += "<div class='listItemBodyText secondary'>" + m + "</div>";

            matchStringHtml += '</div>';

            matchStringHtml += '<button type="button" is="emby-button" class="btnDeleteMatchEntry" style="padding: 0;" data-index="' + i + '" data-matchindex="' + matchStringIndex + '" title="' + Globalize.translate('ButtonDelete') + '"><i class="md-icon">delete</i></button>';

            matchStringHtml += '</div>';
            matchStringIndex++;

            return matchStringHtml;

        }).join('');
    }

    function populateList(page, result) {

        var infos = result.Items;

        if (infos.length > 0) {
            infos = infos.sort(function (a, b) {

                a = a.OrganizerType + " " + (a.DisplayName || a.ItemName);
                b = b.OrganizerType + " " + (b.DisplayName || b.ItemName);

                if (a === b) {
                    return 0;
                }

                if (a < b) {
                    return -1;
                }

                return 1;
            });
        }

        var html = "";

        if (infos.length) {
            html += '<div class="paperList">';
        }

        for (var i = 0, length = infos.length; i < length; i++) {

            var info = infos[i];

            html += '<div class="listItem">';

            html += '<div class="listItemIconContainer">';
            html += '<i class="listItemIcon md-icon">folder</i>';
            html += '</div>';

            html += '<div class="listItemBody">';
            html += "<h2 class='listItemBodyText'>" + (info.DisplayName || info.ItemName) + "</h2>";
            html += '</div>';

            html += '</div>';

            html += getHtmlFromMatchStrings(info, i);
        }

        if (infos.length) {
            html += "</div>";
        }

        var matchInfos = page.querySelector('.divMatchInfos');
        matchInfos.innerHTML = html;
    }

    function getTabs() {
        return [
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeLog'),
                name: Globalize.translate('TabActivityLog')
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeTv'),
                name: Globalize.translate('TabTV')
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeSmart'),
                name: Globalize.translate('TabSmartMatches')
            }];
    }

    return function (view, params) {

        var self = this;

        var divInfos = view.querySelector('.divMatchInfos');

        divInfos.addEventListener('click', function (e) {

            var button = parentWithClass(e.target, 'btnDeleteMatchEntry');

            if (button) {

                var index = parseInt(button.getAttribute('data-index'));
                var matchIndex = parseInt(button.getAttribute('data-matchindex'));

                var info = currentResult.Items[index];
                var entries = [
                    {
                        Name: info.ItemName,
                        Value: info.MatchStrings[matchIndex]
                    }];

                ApiClient.deleteSmartMatchEntries(entries).then(function () {

                    reloadList(view);

                }, Dashboard.processErrorResponse);
            }
        });

        view.addEventListener('viewshow', function (e) {

            libraryMenu.setTabs('autoorganize', 2, getTabs);
            loading.show();

            reloadList(view);
        });

        view.addEventListener('viewhide', function (e) {

            currentResult = null;
        });
    };
});