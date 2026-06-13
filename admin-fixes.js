(function () {
  if (!document.querySelector('.tabs')) return;

  const style = document.createElement('style');
  style.textContent = `
    .btn,.tab,.top a{transition:background-color .16s,color .16s,border-color .16s,box-shadow .16s,transform .16s}
    .btn:not(:disabled):hover{background:var(--gold);color:var(--brown);box-shadow:0 5px 13px #3b1d0f24;transform:translateY(-1px)}
    .btn.secondary:not(:disabled):hover{background:var(--brown);color:#fff;border-color:var(--brown)}
    .btn.danger:not(:disabled):hover{background:var(--bad);color:#fff;border-color:var(--bad)}
    .tab:hover{background:var(--gold);color:var(--brown);border-color:var(--gold);transform:translateY(-1px)}
    .tab.active:hover{background:var(--brown);color:#fff}.top a:hover{background:#fff;color:var(--brown)}
    .btn:focus-visible,.tab:focus-visible{outline:3px solid #d8bd76;outline-offset:2px}
    .products{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:13px}
    .product-list-header,.product-row{display:grid;grid-template-columns:64px minmax(190px,1fr) 90px 72px 58px 52px;gap:9px;align-items:center}
    .product-list-header{padding:9px 12px;background:#f4f0e8;color:var(--muted);font-size:11px;font-weight:800}
    .product-row{padding:11px 12px;border-top:1px solid #ece7df}
    .product-row input,.product-row textarea{padding:8px;border-radius:7px}
    .product-row textarea{min-height:48px;margin-top:6px;font-size:12px}
    .product-image-cell{display:grid;gap:5px}.product-thumb{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid var(--line)}
    .product-image-cell input{width:48px;text-align:center}.product-name-cell input{font-weight:750}
    .product-publish{text-align:center}.product-publish input{width:20px;height:20px}.product-remove{padding:8px 6px;font-size:11px}
    .completed-list{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:13px}
    .completed-order{border-bottom:1px solid #ece7df}.completed-order:last-child{border-bottom:0}
    .completed-order summary{display:grid;grid-template-columns:minmax(160px,1.3fr) minmax(150px,1fr) 90px 100px 22px;gap:12px;align-items:center;padding:14px 16px;cursor:pointer;list-style:none}
    .completed-order summary::-webkit-details-marker{display:none}.completed-order summary::after{content:"›";font-size:22px;color:var(--muted)}
    .completed-order[open] summary::after{transform:rotate(90deg)}.completed-order-title{font-weight:800;font-size:13px}
    .completed-order-meta{color:var(--muted);font-size:12px}.completed-order-amount{text-align:right;font-weight:800}
    .completed-order-detail{padding:0 16px 16px;border-top:1px solid #f0ece5}
    .pagination{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:14px}.pagination-info{font-size:12px;color:var(--muted)}
    @media(max-width:620px){.product-list-header{display:none}.product-row{grid-template-columns:58px 1fr 1fr}.product-name-cell{grid-column:2/4}}
    @media(max-width:560px){.completed-order summary{grid-template-columns:minmax(0,1fr) auto 22px}.completed-order-meta{display:none}}
  `;
  document.head.appendChild(style);

  let previewTimer;
  function syncPreview() {
    const frame = document.getElementById('shopPreview');
    if (!frame?.contentWindow || typeof productData === 'undefined') return;
    const products = productData.filter(product => product.active !== false).map(product => ({
      ...product,
      name: String(product.name || ''),
      note: String(product.note || ''),
      price: Number(product.price || 0),
      stock: Number(product.stock || 0)
    }));
    try {
      frame.contentWindow.eval(`products=${JSON.stringify(products)};renderProducts()`);
    } catch (error) {
      frame.contentWindow.postMessage({ type: 'coffee-products-preview', products }, location.origin);
    }
  }
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(syncPreview, 120);
  }
  window.syncShopPreview = syncPreview;

  window.renderProducts = function () {
    const list = document.getElementById('productList');
    document.getElementById('productNotice').textContent = productData.length
      ? '編集内容は右側の携帯画面へ自動反映されます。'
      : '商品がありません。「商品を追加」から登録してください。';
    if (!productData.length) {
      list.innerHTML = '';
      schedulePreview();
      return;
    }
    list.innerHTML = `<div class="product-list-header"><span>画像</span><span>商品名・説明</span><span>価格</span><span>在庫</span><span>公開</span><span></span></div>${productData.map((p, i) => `<article class="product-row"><div class="product-image-cell"><img class="product-thumb" src="./img/${encodeURIComponent(String(p.image || '1'))}.jpg" alt=""><input aria-label="画像キー" value="${esc(p.image || '1')}" oninput="productData[${i}].image=this.value"></div><div class="product-name-cell"><input aria-label="商品名" value="${esc(p.name)}" oninput="productData[${i}].name=this.value"><textarea aria-label="説明" oninput="productData[${i}].note=this.value">${esc(p.note || '')}</textarea></div><input aria-label="価格" type="number" min="0" value="${Number(p.price) || 0}" oninput="productData[${i}].price=Number(this.value)"><input aria-label="在庫" type="number" min="0" value="${Number(p.stock) || 0}" oninput="productData[${i}].stock=Number(this.value)"><div class="product-publish"><input aria-label="公開" type="checkbox" ${p.active === false ? '' : 'checked'} onchange="productData[${i}].active=this.checked"></div><button class="btn danger product-remove" onclick="removeProduct(${i})">削除</button></article>`).join('')}`;
    schedulePreview();
  };

  document.getElementById('productList')?.addEventListener('input', schedulePreview);
  document.getElementById('productList')?.addEventListener('change', schedulePreview);
  document.getElementById('shopPreview')?.addEventListener('load', schedulePreview);

  const completedStatuses = ['対応済', '対応済み', '受渡済み', '発送済み', 'キャンセル済み'];
  const originalPhaseForOrder = window.phaseForOrder;
  window.phaseForOrder = order => completedStatuses.includes(order.status)
    ? 'completed'
    : originalPhaseForOrder(order);

  let completedPage = 1;
  const pageSize = 10;
  function completedRow(order, index) {
    return `<details class="completed-order"><summary><div class="completed-order-title">${esc(order.number)}　${esc(order.name || '名前未登録')} 様</div><div class="completed-order-meta">${esc(order.receivedAt)}</div><div class="completed-order-meta">${esc(order.delivery)}</div><div class="completed-order-amount">${yen(order.amount)}</div></summary><div class="completed-order-detail"><div class="order-primary"><strong>注文内容</strong><br>${esc(order.product)}<br><br><strong>支払方法</strong><br>${esc(order.payment)}</div>${order.postal ? `<div class="order-address">〒${esc(order.postal)}<br>${esc(order.address)}</div>` : ''}<div class="status-actions"><button class="btn secondary" onclick="setOrderPhase(${index},'対応中')">対応中に戻す</button></div></div></details>`;
  }
  window.changeCompletedPage = page => {
    completedPage = page;
    renderOrders();
  };
  window.renderOrders = function () {
    const list = document.getElementById('orderList');
    const search = (document.getElementById('orderSearch')?.value || '').trim().toLowerCase();
    const delivery = document.getElementById('orderFilter')?.value || '';
    ['unprocessed', 'inprogress', 'completed'].forEach(phase => {
      const id = { unprocessed: 'orderUnprocessed', inprogress: 'orderInProgress', completed: 'orderCompleted' }[phase];
      document.getElementById(id).textContent = orderData.filter(order => phaseForOrder(order) === phase).length;
    });
    const filtered = orderData.map((order, index) => ({ order, index })).filter(({ order }) => {
      const text = [order.number, order.name, order.product, order.delivery, order.address].join(' ').toLowerCase();
      return phaseForOrder(order) === selectedOrderPhase && (!search || text.includes(search)) && (!delivery || order.delivery === delivery);
    });
    if (!filtered.length) {
      list.innerHTML = '<div class="card empty-state">該当する注文はありません。</div>';
      return;
    }
    if (selectedOrderPhase !== 'completed') {
      list.innerHTML = filtered.map(({ order, index }) => renderOrderCard(order, index)).join('');
      return;
    }
    const pages = Math.ceil(filtered.length / pageSize);
    completedPage = Math.min(completedPage, pages);
    const rows = filtered.slice((completedPage - 1) * pageSize, completedPage * pageSize);
    list.innerHTML = `<div class="completed-list">${rows.map(({ order, index }) => completedRow(order, index)).join('')}</div>${pages > 1 ? `<nav class="pagination"><button class="btn secondary" onclick="changeCompletedPage(${completedPage - 1})" ${completedPage === 1 ? 'disabled' : ''}>前へ</button><span class="pagination-info">${completedPage} / ${pages}ページ</span><button class="btn secondary" onclick="changeCompletedPage(${completedPage + 1})" ${completedPage === pages ? 'disabled' : ''}>次へ</button></nav>` : ''}`;
  };

  setTimeout(() => {
    renderProducts();
    if (typeof renderOrders === 'function' && typeof orderData !== 'undefined' && orderData.length) renderOrders();
  }, 0);
})();