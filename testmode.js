/* LCM 4x4 SHOP TEST MODE: only when the link has ?lcmshop=1. Adds the new shop grid above the old one. */
(function () {
  if (!/^\/shop(\/|$)/.test(location.pathname) || !/[?&]lcmshop=1/.test(location.search)) return;
  var ROOT = { '': ['', 'vehicle,brand'], accessories: ['Accessories', 'vehicle,brand'], body: ['Body', 'vehicle,brand'], chassis: ['Chassis', 'vehicle,brand'],
    'axles-suspension': ['Axles & Suspension', 'vehicle,axle,brand'], 'brake-clutch': ['Brakes & Clutches', 'vehicle,axle,brand'],
    electrical: ['Electrical', 'voltage,brand'], equipment: ['Equipment', 'brand'] };
  var key = location.pathname.replace(/^\/shop\/?/, '').replace(/\/$/, ''), cfg = ROOT[key];
  if (!cfg) return;
  function place() {
    if (document.querySelector('[data-lcm-shop]')) return true;
    var blk = document.querySelector('.sqs-block-summary-v2, .summary-block-wrapper');
    if (!blk) return false;
    var host = blk.closest('.page-section') || blk.parentNode;
    var d = document.createElement('div');
    d.setAttribute('data-lcm-shop', ''); d.setAttribute('data-root', cfg[0]); d.setAttribute('data-filters', cfg[1]);
    d.className = 'lcm-shop-host';
    host.parentNode.insertBefore(d, host.nextSibling);
    host.classList.add('lcm-shop-replaced');
    return true;
  }
  if (!place()) document.addEventListener('DOMContentLoaded', place);
})();
