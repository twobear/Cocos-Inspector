// Core Application Logic
const config = {
  pollInterval: 1000,
};

let state = {
  nodes: [],
  selectedUuid: null,
  expandedUuids: new Set(),
  searchQuery: '',
  lastUpdate: Date.now()
};

const treeEl = document.getElementById('tree-container');
const propEl = document.getElementById('property-container');
const searchInput = document.getElementById('search-input');
const contextMenu = document.getElementById('context-menu');

const ICONS = {
  Node: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  Sprite: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
  Label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
  Button: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 10h6"></path><path d="M9 14h6"></path></svg>',
  Canvas: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.5 1.5"></path><path d="M7.67 7.67L12 12"></path></svg>',
  Camera: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  RichText: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  Particle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>',
  Layout: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
  Widget: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
  Eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  EyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
};

function getTypeIcon(type) {
  return ICONS[type] || ICONS.Node;
}

function getEyeIcon(active) {
  return active ? ICONS.Eye : ICONS.EyeOff;
}

// --- Bridge Logic ---
async function evalCode(code) {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (result, exception) => {
      if (exception) reject(exception);
      else resolve(result);
    });
  });
}

async function injectBridge() {
  const response = await fetch('../src/bridge/cocos.js');
  const script = await response.text();
  await evalCode(script);
}

// --- Data Fetching ---
async function updateTreeData() {
  try {
    const exists = await evalCode('!!window.__COCOS_INSPECTOR__');
    if (!exists) {
      await injectBridge();
    }
    const nodes = await evalCode('window.__COCOS_INSPECTOR__.getNodeTree()');
    if (nodes) {
      state.nodes = nodes;
      renderTree();
    }
  } catch (e) {
    console.error("Failed to update tree", e);
  }
}

async function updateSelectedNodeDetail() {
  if (!state.selectedUuid) {
    propEl.innerHTML = '<div class="empty-state">Select a node to view properties</div>';
    return;
  }
  try {
    const exists = await evalCode('!!window.__COCOS_INSPECTOR__');
    if (!exists) return;
    
    const detail = await evalCode(`window.__COCOS_INSPECTOR__.getNodeDetail("${state.selectedUuid}")`);
    if (detail) {
      renderProperties(detail);
    }
  } catch (e) {
    console.error("Failed to get node detail", e);
  }
}

// --- Rendering Logic ---
function renderTree() {
  if (state.nodes.length === 0) {
    treeEl.innerHTML = '<div class="empty-state">No Cocos scene detected</div>';
    return;
  }
  syncNodeList(state.nodes, treeEl, 0);
}

function syncNodeList(nodes, container, depth) {
  const fragment = document.createDocumentFragment();
  nodes.forEach(node => {
    const isVisible = !state.searchQuery || node.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || checkHasVisibleChild(node);
    if (!isVisible) return;

    let nodeWrapper = container.querySelector(`[data-uuid="${node.uuid}"]`);
    if (!nodeWrapper) {
      nodeWrapper = document.createElement('div');
      nodeWrapper.className = 'node-wrapper';
      nodeWrapper.setAttribute('data-uuid', node.uuid);
      
      const itemEl = document.createElement('div');
      itemEl.className = 'tree-node';
      nodeWrapper.appendChild(itemEl);
    }

    const itemEl = nodeWrapper.querySelector('.tree-node');
    itemEl.className = `tree-node ${state.selectedUuid === node.uuid ? 'selected' : ''}`;
    
    const isExpanded = state.expandedUuids.has(node.uuid);
    itemEl.innerHTML = `
      <span class="toggle-icon" style="width:16px; display:inline-block; font-family:monospace; text-align:center;">
        ${node.children.length > 0 ? (isExpanded ? '▼' : '▶') : '&nbsp;'}
      </span>
      <span class="node-type-icon">${getTypeIcon(node.type)}</span>
      <span class="tree-node-name ${node.active ? '' : 'hidden'}">${node.name}</span>
      <span class="eye-icon ${node.active ? 'active' : 'inactive'}" title="${node.active ? 'Hide' : 'Show'} Node">${getEyeIcon(node.active)}</span>
    `;
    
    if (isExpanded && node.children.length > 0) {
      let childrenContainer = nodeWrapper.querySelector('.tree-node-children');
      if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-node-children';
        nodeWrapper.appendChild(childrenContainer);
      }
      syncNodeList(node.children, childrenContainer, depth + 1);
    } else {
      const childrenContainer = nodeWrapper.querySelector('.tree-node-children');
      if (childrenContainer) childrenContainer.remove();
    }

    fragment.appendChild(nodeWrapper);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// Event Delegation
treeEl.addEventListener('click', (e) => {
  const itemEl = e.target.closest('.tree-node');
  if (!itemEl) return;
  
  const nodeWrapper = itemEl.parentElement;
  const uuid = nodeWrapper.getAttribute('data-uuid');
  
  if (e.target.classList.contains('toggle-icon')) {
    if (state.expandedUuids.has(uuid)) {
      state.expandedUuids.delete(uuid);
    } else {
      state.expandedUuids.add(uuid);
    }
    renderTree();
  } else if (e.target.closest('.eye-icon')) {
    const node = findNodeInState(uuid, state.nodes);
    if (node) {
      const newActive = !node.active;
      evalCode(`window.__COCOS_INSPECTOR__.updateComponentProperty("${uuid}", "cc.Node", "active", ${newActive})`);
      node.active = newActive; // Optimistic update
      renderTree();
      if (state.selectedUuid === uuid) {
        updateSelectedNodeDetail();
      }
    }
  } else {
    state.selectedUuid = uuid;
    renderTree();
    updateSelectedNodeDetail();
  }
});

treeEl.addEventListener('contextmenu', (e) => {
  const itemEl = e.target.closest('.tree-node');
  if (!itemEl) return;
  e.preventDefault();
  const uuid = itemEl.parentElement.getAttribute('data-uuid');
  const node = findNodeInState(uuid, state.nodes);
  showContextMenu(e.clientX, e.clientY, node);
});

function findNodeInState(uuid, nodes) {
  for (const node of nodes) {
    if (node.uuid === uuid) return node;
    if (node.children) {
      const found = findNodeInState(uuid, node.children);
      if (found) return found;
    }
  }
  return null;
}

function checkHasVisibleChild(node) {
  if (node.name.toLowerCase().includes(state.searchQuery.toLowerCase())) return true;
  return node.children && node.children.some(c => checkHasVisibleChild(c));
}

function renderProperties(detail) {
  if (!detail) return;
  
  const activeEl = document.activeElement;
  const activeProp = activeEl ? activeEl.getAttribute('data-prop') : null;
  const activeComp = activeEl ? activeEl.closest('.comp-container')?.getAttribute('data-comp') : null;

  let html = '';
  detail.components.forEach(comp => {
    html += `
      <div class="comp-container" data-comp="${comp.type}">
        <div class="comp-header">
          <input type="checkbox" ${comp.enabled ? 'checked' : ''} class="comp-toggle">
          <span class="comp-title">${comp.type}</span>
        </div>
        <div class="comp-props">
          ${comp.props.map(prop => renderPropItem(prop, comp.type)).join('')}
        </div>
      </div>
    `;
  });

  propEl.innerHTML = html;

  // Restore focus if possible
  if (activeProp) {
    const el = propEl.querySelector(`[data-prop="${activeProp}"][data-comp="${activeComp}"]`);
    if (el) el.focus();
  }

  // Event Listeners
  propEl.querySelectorAll('.prop-input, .comp-toggle').forEach(el => {
    el.addEventListener('change', async (e) => {
      const prop = e.target.getAttribute('data-prop');
      const compType = e.target.closest('.comp-container').getAttribute('data-comp');
      const uuid = state.selectedUuid;
      let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      
      if (e.target.classList.contains('comp-toggle')) {
        await evalCode(`window.__COCOS_INSPECTOR__.updateComponentProperty("${uuid}", "${compType}", "enabled", ${value})`);
      } else {
        if (e.target.type === 'number') value = parseFloat(value);
        const valStr = typeof value === 'string' ? `"${value}"` : value;
        await evalCode(`window.__COCOS_INSPECTOR__.updateComponentProperty("${uuid}", "${compType}", "${prop}", ${valStr})`);
      }
      
      updateSelectedNodeDetail();
      updateTreeData();
    });
  });
}

function renderPropItem(prop, compType) {
  const label = `<div class="prop-label" title="${prop.name}">${prop.name}</div>`;
  let input = '';

  if (prop.type === 'number' || prop.type === 'string') {
    input = `<input type="${prop.type === 'number' ? 'number' : 'text'}" class="prop-input" value="${prop.value}" data-prop="${prop.name}" data-comp="${compType}">`;
  } else if (prop.type === 'boolean') {
    input = `<input type="checkbox" ${prop.value ? 'checked' : ''} class="prop-input" data-prop="${prop.name}" data-comp="${compType}">`;
  } else if (prop.type === 'vec3' || prop.type === 'vec2' || prop.type === 'size') {
    const keys = prop.type === 'vec3' ? ['x', 'y', 'z'] : (prop.type === 'vec2' ? ['x', 'y'] : ['width', 'height']);
    input = `<div class="prop-multi-input">
      ${keys.map(k => `
        <div class="multi-input-group">
          <span class="multi-input-label">${k}</span>
          <input type="number" class="prop-input" value="${prop.value[k] || 0}" data-prop="${prop.name}.${k}" data-comp="${compType}">
        </div>
      `).join('')}
    </div>`;
  } else if (prop.type === 'color') {
    const hex = prop.value ? `#${((1 << 24) + (prop.value.r << 16) + (prop.value.g << 8) + prop.value.b).toString(16).slice(1)}` : '#ffffff';
    input = `<div class="prop-color-group">
      <input type="color" class="prop-input color-picker" value="${hex}" data-prop="${prop.name}" data-comp="${compType}">
      <span class="color-hex">${hex}</span>
    </div>`;
  } else if (prop.type === 'cc.Node') {
    input = `<div class="prop-node-ref">
      <span class="node-ref-icon">${ICONS.Node}</span>
      <span class="node-ref-name">${prop.value ? prop.value.name : 'null'}</span>
    </div>`;
  }

  return `<div class="prop-row">${label}<div class="prop-value">${input}</div></div>`;
}

// --- Interaction ---
function showContextMenu(x, y, node) {
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.onNode = node;
}

window.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

contextMenu.addEventListener('click', async (e) => {
  const action = e.target.getAttribute('data-action');
  const node = contextMenu.onNode;
  if (!action || !node) return;

  if (action === 'copy-name') {
    navigator.clipboard.writeText(node.name);
  } else if (action === 'copy-path') {
    const path = await evalCode(`window.__COCOS_INSPECTOR__.getNodePath("${node.uuid}")`);
    navigator.clipboard.writeText(path);
  } else if (action === 'log-console') {
    evalCode(`window.__COCOS_INSPECTOR__.logNode("${node.uuid}")`);
  }
});

searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderTree();
});

document.getElementById('refresh-btn').onclick = () => {
  updateTreeData();
};

// --- Initialization ---
async function init() {
  await injectBridge();
  updateTreeData();
  setInterval(() => {
    updateTreeData();
    updateSelectedNodeDetail();
  }, config.pollInterval);
}

init();
