/* LCM 4x4 SHOP PLACEMENT: puts the new shop grid on the 8 shop pages, in place of the old product block.
   Add ?lcmshop=0 to a shop link to see the old shop instead (for comparing). */
(function () {
  if (/[?&]lcmshop=0/.test(location.search)) return;
  var ROOT = { '': ['', 'vehicle,brand'], accessories: ['Accessories', 'vehicle,brand'], body: ['Body', 'vehicle,brand'], chassis: ['Chassis', 'vehicle,brand'],
    'axles-suspension': ['Axles & Suspension', 'vehicle,axle,brand'], 'brake-clutch': ['Brakes & Clutches', 'vehicle,axle,brand'],
    electrical: ['Electrical', 'voltage,brand'], equipment: ['Equipment', 'brand'] };
  var m = location.pathname.match(/^\/shop(?:\/([^\/]*))?\/?$/), cfg = m && ROOT[m[1] || ''];
  if (!cfg && window.__lcmBrandPage) cfg = ['', 'vehicle'];   /* brand page: whole shop, fixed to one brand */
  if (!cfg) return;
  function place() {
    if (document.querySelector('[data-lcm-shop]')) return true;
    var blk = document.querySelector('.sqs-block-summary-v2, .summary-block-wrapper');
    if (!blk) return false;
    var host = blk.closest('.page-section') || blk.parentNode;
    var d = document.createElement('div');
    d.setAttribute('data-lcm-shop', ''); d.setAttribute('data-root', cfg[0]); d.setAttribute('data-filters', cfg[1]); if (window.__lcmBrandPage) d.setAttribute('data-brand', window.__lcmBrandPage);
    d.className = 'lcm-shop-host';
    host.parentNode.insertBefore(d, host.nextSibling);
    host.classList.add('lcm-shop-replaced');
    return true;
  }
  if (!place()) document.addEventListener('DOMContentLoaded', place);
})();
