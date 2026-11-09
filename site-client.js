/* Shared small enhancements; all catalog content works without JavaScript. */
(() => {
    'use strict';
    function imageFallback(image) {
        const frame = image.closest('.card-thumb-wrap, .detail-image-container, .detail-hero');
        if (!frame) return;
        image.hidden = true;
        frame.classList.add('image-unavailable');
        if (!frame.querySelector('.image-fallback-icon')) {
            const fallback = document.createElement('span');
            fallback.className = 'image-fallback-icon ph ph-puzzle-piece';
            fallback.setAttribute('aria-hidden', 'true');
            frame.appendChild(fallback);
        }
    }
    document.addEventListener('error', event => {
        if (event.target instanceof HTMLImageElement) imageFallback(event.target);
    }, true);
    document.querySelectorAll('.card-thumb, .detail-image, .detail-hero img').forEach(image => {
        if (image.complete && !image.naturalWidth) imageFallback(image);
    });
})();
