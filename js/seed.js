(function () {
    'use strict';

    const getConfig = () => {
        try {
            return JSON.parse(window.localStorage.getItem('ytFreezeConfig') || '{"enabled":true,"limit":12}');
        } catch (e) {
            return { enabled: true, limit: 12 };
        }
    };

    let isHomePage = window.location.pathname === '/';
    
    window.addEventListener('yt-navigate-start', (e) => {
        if (e.detail?.url) {
            const url = new URL(e.detail.url, window.location.origin);
            isHomePage = url.pathname === '/';
        }
    });
    
    window.addEventListener('yt-navigate-finish', () => {
        isHomePage = window.location.pathname === '/';
    });

    const processVideoList = (contentsArray, isAppend = false) => {
        if (!Array.isArray(contentsArray)) return contentsArray;
        const config = getConfig();
        
        if (!config.enabled) return contentsArray; // Toggle now correctly bypassed
        if (config.limit === 0) return []; // Deep work mode
        
        if (isAppend) {
            // Count infinite scroll blocks for stats
            if (contentsArray.length > 0) {
                window.dispatchEvent(new CustomEvent('YTF_INCREMENT_STATS', { detail: { blockedCount: contentsArray.length } }));
            }
            return [];
        }

        let vault = null;
        try { vault = JSON.parse(window.localStorage.getItem('ytFrozenVault')); } catch (e) {}

        if (!vault || vault.length !== config.limit) {
            let justVideos = contentsArray.filter(item => item.richItemRenderer);
            
            // Log the initial overflow for stats
            let cutCount = justVideos.length - config.limit;
            if (cutCount > 0) {
                window.dispatchEvent(new CustomEvent('YTF_INCREMENT_STATS', { detail: { blockedCount: cutCount } }));
            }

            vault = justVideos.slice(0, config.limit);
            window.localStorage.setItem('ytFrozenVault', JSON.stringify(vault));
        }

        return [...vault];
    };

    const mutateJSONPayload = (obj) => {
        if (!obj) return obj;
        try {
            if (obj.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents) {
                let grid = obj.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer;
                grid.contents = processVideoList(grid.contents, false);
            }
            if (obj.onResponseReceivedActions && Array.isArray(obj.onResponseReceivedActions)) {
                obj.onResponseReceivedActions.forEach(action => {
                    if (action.reloadContinuationItemsCommand?.continuationItems) {
                        action.reloadContinuationItemsCommand.continuationItems = processVideoList(action.reloadContinuationItemsCommand.continuationItems, false);
                    }
                    if (action.appendContinuationItemsAction?.continuationItems) {
                        action.appendContinuationItemsAction.continuationItems = processVideoList(action.appendContinuationItemsAction.continuationItems, true);
                    }
                });
            }
        } catch (e) {}
        return obj;
    };

    let _ytInitialData = window.ytInitialData;
    Object.defineProperty(window, 'ytInitialData', {
        set: function (newValue) {
            if (isHomePage) newValue = mutateJSONPayload(newValue);
            _ytInitialData = newValue;
        },
        get: function () { return _ytInitialData; },
        configurable: true, enumerable: true
    });

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
        const response = await originalFetch.apply(this, args);

        if (!url.includes('/youtubei/v1/browse') || !isHomePage) return response;

        try {
            const clone = response.clone();
            const text = await clone.text();
            let json = JSON.parse(text);

            if (JSON.stringify(json).includes('richItemRenderer')) {
                json = mutateJSONPayload(json);
            }

            const modifiedResponse = new Response(JSON.stringify(json), {
                status: response.status, statusText: response.statusText, headers: response.headers
            });
            Object.defineProperty(modifiedResponse, 'url', { value: response.url });
            return modifiedResponse;
        } catch (err) { return response; }
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._isYTBrowse = typeof url === 'string' && url.includes('/youtubei/v1/browse');
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._isYTBrowse && isHomePage) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 4) {
                    try {
                        let json = JSON.parse(this.responseText);
                        if (JSON.stringify(json).includes('richItemRenderer')) {
                            json = mutateJSONPayload(json);
                            const modifiedText = JSON.stringify(json);
                            Object.defineProperty(this, 'responseText', { get: () => modifiedText, configurable: true });
                            Object.defineProperty(this, 'response', { get: () => modifiedText, configurable: true });
                        }
                    } catch (e) {}
                }
            }, false);
        }
        return originalXHRSend.apply(this, arguments);
    };
})();