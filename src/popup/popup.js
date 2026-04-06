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
  tabGroupSelect: document.getElementById('tab-group-select')
};

// Initialize popup
async function init() {
  await loadSettings();
  await updateStats();
  await loadTabGroups();
  setupEventListeners();
}

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

// Setup event listeners
function setupEventListeners() {
  // Settings button
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Quick action buttons
  document.getElementById('unload-current').addEventListener('click', async () => {
    const result = await sendCommand('unload-current');
    showStatus(result ? 'Tab unloaded' : 'Cannot unload');
  });

  document.getElementById('unload-right').addEventListener('click', async () => {
    const count = await sendCommand('unload-right');
    showStatus(`${count || 0} tabs unloaded`);
  });

  document.getElementById('unload-left').addEventListener('click', async () => {
    const count = await sendCommand('unload-left');
    showStatus(`${count || 0} tabs unloaded`);
  });

  document.getElementById('unload-others').addEventListener('click', async () => {
    const count = await sendCommand('unload-others');
    showStatus(`${count || 0} tabs unloaded`);
  });

  document.getElementById('unload-group')?.addEventListener('click', async () => {
    const groupId = parseInt(elements.tabGroupSelect.value);
    if (groupId) {
      const count = await sendCommand('unload-group', { groupId });
      showStatus(`${count || 0} tabs unloaded`);
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

// Send command to background script
async function sendCommand(command, data = {}) {
  return await chrome.runtime.sendMessage({ command, ...data });
}

// Show status message
function showStatus(message) {
  elements.statusMsg.textContent = message;
  setTimeout(() => {
    elements.statusMsg.textContent = '';
    updateStats();
  }, 2000);
}

// Initialize
init();
