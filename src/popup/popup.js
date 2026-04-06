import { getSettings, saveSettings } from '../shared/storage.js';
import { formatBytes } from '../shared/utils.js';

// DOM Elements
const elements = {
  ramBar: document.getElementById('ram-bar'),
  ramPercent: document.getElementById('ram-percent'),
  tabCounts: document.getElementById('tab-counts'),
  memorySaved: document.getElementById('memory-saved'),
  timerSelect: document.getElementById('timer-select'),
  thresholdSelect: document.getElementById('threshold-select'),
  settingsBtn: document.getElementById('settings-btn'),
  statusMsg: document.getElementById('status-msg'),
  tabGroupsSection: document.getElementById('tab-groups-section'),
  tabGroupSelect: document.getElementById('tab-group-select'),
  tabList: document.getElementById('tab-list'),
  refreshTabs: document.getElementById('refresh-tabs'),
  quickSettings: document.getElementById('quick-settings'),
  settingsToggle: document.getElementById('settings-toggle')
};

// --- Utility Functions ---

// Send command to background script
async function sendCommand(command, data = {}) {
  return await chrome.runtime.sendMessage({ command, ...data });
}

// Get hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get status badge HTML for a tab
function getStatusBadge(tab) {
  if (tab.active) {
    return '<span class="badge badge-active">ACTIVE</span>';
  }
  if (tab.discarded) {
    return '<span class="badge badge-sleeping">💤 ZZZ</span>';
  }
  if (tab.isProtected) {
    return `<span class="badge badge-protected" title="${tab.pinned ? 'Pinned' : 'Whitelisted'}">🛡️</span>`;
  }
  if (tab.timeUntilUnload !== null && tab.timeUntilUnload > 0) {
    const mins = Math.ceil(tab.timeUntilUnload / 60000);
    return `<span class="badge badge-timer" title="Time until auto-unload">⏱️ ${mins}m</span>`;
  }
  return '';
}

// Show status message
function showStatus(message) {
  elements.statusMsg.textContent = message;
  setTimeout(() => {
    elements.statusMsg.textContent = '';
    updateStats();
  }, 2000);
}

// --- Core Functions ---

// Load current settings into UI
async function loadSettings() {
  const settings = await getSettings();
  elements.timerSelect.value = settings.unloadDelayMinutes;
  elements.thresholdSelect.value = settings.memoryThresholdPercent;
}

// Update stats display
async function updateStats() {
  // Get memory info
  try {
    const memoryInfo = await chrome.system.memory.getInfo();
    const used = memoryInfo.capacity - memoryInfo.availableCapacity;
    const percent = Math.round((used / memoryInfo.capacity) * 100);

    elements.ramBar.style.width = `${percent}%`;
    elements.ramPercent.textContent = `${percent}%`;

    // Color based on usage
    elements.ramBar.classList.remove('warning', 'danger');
    if (percent >= 90) {
      elements.ramBar.classList.add('danger');
    } else if (percent >= 70) {
      elements.ramBar.classList.add('warning');
    }
  } catch {
    elements.ramPercent.textContent = 'N/A';
  }

  // Get tab counts
  const tabs = await chrome.tabs.query({});
  const discardedCount = tabs.filter(t => t.discarded).length;
  const activeCount = tabs.length - discardedCount;
  elements.tabCounts.textContent = `${activeCount} active | ${discardedCount} saved`;

  // Get saved memory from stats
  const result = await chrome.storage.local.get('stats');
  if (result.stats?.memorySaved) {
    elements.memorySaved.textContent = `~${formatBytes(result.stats.memorySaved)} this session`;
  }
}

// Load tab groups if available
async function loadTabGroups() {
  try {
    const groups = await chrome.tabGroups.query({});
    if (groups.length > 0) {
      elements.tabGroupsSection.classList.remove('hidden');
      elements.tabGroupSelect.innerHTML = '<option value="">Select Tab Group...</option>';
      for (const group of groups) {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.title || `Group ${group.id}`;
        elements.tabGroupSelect.appendChild(option);
      }
    }
  } catch {
    // Tab groups not available
  }
}

// Render tab list with status indicators (HTML only - event delegation handles clicks)
async function renderTabList() {
  const tabs = await sendCommand('get-tabs-with-status');
  if (!tabs) {
    elements.tabList.innerHTML = '<div class="tab-item-empty">Unable to load tabs</div>';
    return;
  }

  elements.tabList.innerHTML = tabs.map(tab => {
    const statusBadge = getStatusBadge(tab);
    const favicon = tab.favIconUrl
      ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="">`
      : '<span class="tab-favicon-placeholder">🌐</span>';

    const title = escapeHtml(tab.title.length > 30 ? tab.title.slice(0, 30) + '...' : tab.title);
    const hostname = getHostname(tab.url);

    return `
      <div class="tab-item ${tab.active ? 'active' : ''} ${tab.discarded ? 'discarded' : ''}"
           data-tab-id="${tab.id}"
           title="${escapeHtml(tab.title)}">
        <div class="tab-info">
          ${favicon}
          <div class="tab-details">
            <span class="tab-title">${title}</span>
            <span class="tab-hostname">${hostname}</span>
          </div>
        </div>
        <div class="tab-status">
          ${statusBadge}
          ${!tab.active && !tab.discarded && !tab.isProtected ? `<button class="tab-unload-btn" data-tab-id="${tab.id}" title="Unload">💤</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Handle favicon load errors (CSP doesn't allow inline onerror)
  elements.tabList.querySelectorAll('.tab-favicon').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
    }, { once: true });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Settings button
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Refresh tabs button
  elements.refreshTabs.addEventListener('click', async () => {
    await Promise.all([renderTabList(), updateStats()]);
  });

  // Quick settings toggle
  elements.settingsToggle.addEventListener('click', () => {
    elements.quickSettings.classList.toggle('collapsed');
  });

  // Tab list event delegation (avoids re-attaching listeners on each render)
  elements.tabList.addEventListener('click', async (e) => {
    const item = e.target.closest('.tab-item');
    if (!item) return;

    if (e.target.classList.contains('tab-unload-btn')) {
      e.stopPropagation();
      const tabId = parseInt(e.target.dataset.tabId);
      await sendCommand('unload-tab', { tabId });
      await Promise.all([renderTabList(), updateStats()]);
    } else {
      const tabId = parseInt(item.dataset.tabId);
      await chrome.tabs.update(tabId, { active: true });
      window.close();
    }
  });

  // Quick action buttons
  document.getElementById('unload-current').addEventListener('click', async () => {
    const result = await sendCommand('unload-current');
    showStatus(result ? 'Tab unloaded' : 'Cannot unload');
    renderTabList(); // Fire and forget - no need to await
  });

  document.getElementById('unload-right').addEventListener('click', async () => {
    const count = await sendCommand('unload-right');
    showStatus(`${count || 0} tabs unloaded`);
    renderTabList();
  });

  document.getElementById('unload-left').addEventListener('click', async () => {
    const count = await sendCommand('unload-left');
    showStatus(`${count || 0} tabs unloaded`);
    renderTabList();
  });

  document.getElementById('unload-others').addEventListener('click', async () => {
    const count = await sendCommand('unload-others');
    showStatus(`${count || 0} tabs unloaded`);
    renderTabList();
  });

  document.getElementById('unload-group')?.addEventListener('click', async () => {
    const groupId = parseInt(elements.tabGroupSelect.value);
    if (groupId) {
      const count = await sendCommand('unload-group', { groupId });
      showStatus(`${count || 0} tabs unloaded`);
      renderTabList();
    }
  });

  // Quick settings
  elements.timerSelect.addEventListener('change', async (e) => {
    const settings = await getSettings();
    settings.unloadDelayMinutes = parseInt(e.target.value);
    await saveSettings(settings);
    showStatus('Timer updated');
  });

  elements.thresholdSelect.addEventListener('change', async (e) => {
    const settings = await getSettings();
    settings.memoryThresholdPercent = parseInt(e.target.value);
    await saveSettings(settings);
    showStatus('Threshold updated');
  });
}

// --- Initialize ---

async function init() {
  // Run independent operations in parallel for faster popup load
  await Promise.all([
    loadSettings(),
    updateStats(),
    loadTabGroups(),
    renderTabList()
  ]);
  setupEventListeners();
}

init();
