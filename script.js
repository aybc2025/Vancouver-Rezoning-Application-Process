/**
 * Vancouver Rezoning Guide - Interactive JavaScript
 * Handles tabs, timeline, decision tree, glossary, and search
 */

// ========================================
// State Management
// ========================================
const state = {
    activeTab: 'resident',
    expandedPanels: [],
    decisionTreeStep: 1,
    glossaryOpen: false
};

// ========================================
// DOM Ready
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeTimeline();
    initializeDecisionTree();
    initializeGlossary();
    initializeSearch();
    initializeAccessibility();
});

// ========================================
// Tab Navigation
// ========================================
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabPanels = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
        
        // Keyboard navigation
        tab.addEventListener('keydown', function(e) {
            handleTabKeyboard(e, tabs);
        });
    });
}

function switchTab(tabId) {
    // Update state
    state.activeTab = tabId;
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });
    
    // Update panels
    document.querySelectorAll('.tab-content').forEach(panel => {
        const isActive = panel.id === `${tabId}-panel`;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
    });
    
    // Collapse all expanded panels when switching tabs
    collapseAllPanels();
    
    // Optional: Customize timeline based on tab
    highlightRelevantSteps(tabId);
}

function handleTabKeyboard(e, tabs) {
    const currentIndex = Array.from(tabs).indexOf(e.target);
    let newIndex;
    
    switch(e.key) {
        case 'ArrowLeft':
            newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tabs.length - 1;
            tabs[newIndex].focus();
            tabs[newIndex].click();
            e.preventDefault();
            break;
        case 'ArrowRight':
            newIndex = currentIndex + 1;
            if (newIndex >= tabs.length) newIndex = 0;
            tabs[newIndex].focus();
            tabs[newIndex].click();
            e.preventDefault();
            break;
        case 'Home':
            tabs[0].focus();
            tabs[0].click();
            e.preventDefault();
            break;
        case 'End':
            tabs[tabs.length - 1].focus();
            tabs[tabs.length - 1].click();
            e.preventDefault();
            break;
    }
}

function highlightRelevantSteps(tabId) {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
        // Reset highlights
        item.style.opacity = '1';
    });
    
    if (tabId === 'resident') {
        // Highlight steps with public participation
        timelineItems.forEach(item => {
            if (!item.classList.contains('has-influence')) {
                item.style.opacity = '0.7';
            }
        });
    } else if (tabId === 'developer') {
        // All steps are relevant for developers
        timelineItems.forEach(item => {
            item.style.opacity = '1';
        });
    }
}

// ========================================
// Timeline & Detail Panels
// ========================================
function initializeTimeline() {
    const expandButtons = document.querySelectorAll('.btn-expand');
    
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const panelId = this.getAttribute('aria-controls');
            toggleDetailPanel(panelId, this);
        });
    });
    
    // Smooth scroll to expanded panels
    const timelineSection = document.querySelector('.timeline-section');
    if (timelineSection) {
        timelineSection.addEventListener('scroll', handleTimelineScroll);
    }
}

function toggleDetailPanel(panelId, button) {
    const panel = document.getElementById(panelId);
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        // Collapse
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        state.expandedPanels = state.expandedPanels.filter(id => id !== panelId);
    } else {
        // Expand
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        state.expandedPanels.push(panelId);
        
        // Smooth scroll to detail panel
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function collapseAllPanels() {
    state.expandedPanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        const button = document.querySelector(`[aria-controls="${panelId}"]`);
        
        if (panel) panel.hidden = true;
        if (button) button.setAttribute('aria-expanded', 'false');
    });
    
    state.expandedPanels = [];
}

function handleTimelineScroll() {
    // Could add visual indicators for which step is in view
    // Implemented later if needed
}

// ========================================
// Decision Tree Modal
// ========================================
function initializeDecisionTree() {
    const openButton = document.getElementById('openDecisionTree');
    const modal = document.getElementById('decisionTreeModal');
    const closeButton = modal.querySelector('.modal-close');
    const decisionButtons = modal.querySelectorAll('.btn-decision');
    
    // Open modal
    openButton.addEventListener('click', function() {
        openDecisionTreeModal();
    });
    
    // Close modal
    closeButton.addEventListener('click', function() {
        closeDecisionTree();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDecisionTree();
        }
    });
    
    // Keyboard navigation
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDecisionTree();
        }
    });
    
    // Decision button handlers
    decisionButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleDecisionTreeChoice(this);
        });
    });
}

function openDecisionTreeModal() {
    const modal = document.getElementById('decisionTreeModal');
    modal.hidden = false;
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Reset to step 1
    state.decisionTreeStep = 1;
    showDecisionStep(1);
    
    // Focus trap
    const firstFocusable = modal.querySelector('button');
    if (firstFocusable) firstFocusable.focus();
}

function closeDecisionTree() {
    const modal = document.getElementById('decisionTreeModal');
    modal.hidden = true;
    document.body.style.overflow = ''; // Restore scroll
    
    // Return focus to trigger button
    document.getElementById('openDecisionTree').focus();
}

// Make closeDecisionTree available globally for onclick handlers
window.closeDecisionTree = closeDecisionTree;

function handleDecisionTreeChoice(button) {
    const answer = button.dataset.answer;
    const nextStep = button.dataset.next;
    const result = button.dataset.result;
    
    if (nextStep) {
        // Go to next question
        showDecisionStep(parseInt(nextStep));
    } else if (result) {
        // Show result
        showDecisionResult(result);
    }
}

function showDecisionStep(stepNumber) {
    state.decisionTreeStep = stepNumber;
    
    // Hide all steps and results
    document.querySelectorAll('.decision-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelectorAll('.decision-result').forEach(result => {
        result.classList.remove('active');
    });
    
    // Show current step
    const currentStep = document.querySelector(`.decision-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

function showDecisionResult(resultType) {
    // Hide all steps
    document.querySelectorAll('.decision-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Hide all results
    document.querySelectorAll('.decision-result').forEach(result => {
        result.classList.remove('active');
    });
    
    // Show selected result
    const resultElement = document.querySelector(`.decision-result[data-result="${resultType}"]`);
    if (resultElement) {
        resultElement.classList.add('active');
    }
}

function goBackDecision() {
    if (state.decisionTreeStep > 1) {
        showDecisionStep(state.decisionTreeStep - 1);
    }
}

// Make goBackDecision available globally for onclick handlers
window.goBackDecision = goBackDecision;

// ========================================
// Glossary
// ========================================
function initializeGlossary() {
    const toggleButton = document.getElementById('glossaryToggle');
    const glossary = document.getElementById('glossary');
    const closeButton = glossary.querySelector('.glossary-close');
    const searchInput = document.getElementById('glossarySearch');
    
    // Toggle glossary
    toggleButton.addEventListener('click', function() {
        toggleGlossary();
    });
    
    // Close glossary
    closeButton.addEventListener('click', function() {
        toggleGlossary();
    });
    
    // Search glossary
    searchInput.addEventListener('input', function() {
        filterGlossary(this.value);
    });
    
    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !glossary.hidden) {
            toggleGlossary();
        }
    });
}

function toggleGlossary() {
    const glossary = document.getElementById('glossary');
    const toggleButton = document.getElementById('glossaryToggle');
    
    state.glossaryOpen = !state.glossaryOpen;
    glossary.hidden = !state.glossaryOpen;
    
    // Update button state
    toggleButton.setAttribute('aria-expanded', state.glossaryOpen);
    
    if (state.glossaryOpen) {
        // Focus search input when opening
        setTimeout(() => {
            document.getElementById('glossarySearch').focus();
        }, 100);
    }
}

function filterGlossary(searchTerm) {
    const items = document.querySelectorAll('.glossary-item');
    const term = searchTerm.toLowerCase().trim();
    
    items.forEach(item => {
        const searchableText = item.dataset.term || item.textContent.toLowerCase();
        const matches = searchableText.includes(term);
        item.hidden = term !== '' && !matches;
    });
}

// ========================================
// Search Functionality
// ========================================
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchBtn');
    
    // Search on button click
    searchButton.addEventListener('click', function() {
        performSearch(searchInput.value);
    });
    
    // Search on Enter key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });
}

function performSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        alert('Please enter a search term');
        return;
    }
    
    // Search through timeline cards and detail panels
    const timelineCards = document.querySelectorAll('.timeline-card');
    const detailPanels = document.querySelectorAll('.detail-panel');
    let matches = [];
    
    // Search timeline
    timelineCards.forEach((card, index) => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            matches.push({
                type: 'timeline',
                element: card.closest('.timeline-item'),
                title: card.querySelector('h4').textContent
            });
        }
    });
    
    // Search detail panels
    detailPanels.forEach(panel => {
        const text = panel.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            const title = panel.querySelector('h3').textContent;
            matches.push({
                type: 'detail',
                element: panel,
                title: title
            });
        }
    });
    
    // Display results
    if (matches.length > 0) {
        highlightSearchResults(matches);
        
        // Scroll to first match
        matches[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Show notification
        showNotification(`Found ${matches.length} result(s) for "${searchTerm}"`);
    } else {
        showNotification(`No results found for "${searchTerm}"`, 'warning');
    }
}

function highlightSearchResults(matches) {
    // Clear previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
    });
    
    // Add highlights to matches
    matches.forEach(match => {
        match.element.classList.add('search-highlight');
        
        // Expand detail panel if it's a detail match
        if (match.type === 'detail') {
            const panelId = match.element.id;
            const button = document.querySelector(`[aria-controls="${panelId}"]`);
            if (button && button.getAttribute('aria-expanded') === 'false') {
                button.click();
            }
        }
    });
    
    // Remove highlights after 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
    }, 5000);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    
    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        backgroundColor: type === 'warning' ? '#ffc107' : '#0089C7',
        color: type === 'warning' ? '#1a1a1a' : '#ffffff',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: '1001',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '300px'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .search-highlight {
        animation: pulse 1s ease-in-out 3;
        outline: 3px solid #F7A823 !important;
        outline-offset: 5px;
    }
    
    @keyframes pulse {
        0%, 100% { outline-color: #F7A823; }
        50% { outline-color: #d98f0a; }
    }
`;
document.head.appendChild(style);

// ========================================
// Accessibility Features
// ========================================
function initializeAccessibility() {
    // Skip to main content link
    addSkipLink();
    
    // Keyboard shortcuts info
    document.addEventListener('keydown', handleGlobalKeyboard);
    
    // Announce page changes for screen readers
    announceRouteChanges();
}

function addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#timeline-title';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    
    Object.assign(skipLink.style, {
        position: 'absolute',
        top: '-40px',
        left: '0',
        backgroundColor: '#0089C7',
        color: '#ffffff',
        padding: '8px',
        textDecoration: 'none',
        zIndex: '1000'
    });
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '0';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

function handleGlobalKeyboard(e) {
    // Ctrl/Cmd + K: Open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl/Cmd + G: Open glossary
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGlossary();
    }
    
    // Ctrl/Cmd + /: Show keyboard shortcuts (could implement help modal)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        showKeyboardShortcuts();
    }
}

function showKeyboardShortcuts() {
    const shortcuts = `
        Keyboard Shortcuts:
        • Ctrl/Cmd + K: Focus search
        • Ctrl/Cmd + G: Toggle glossary
        • Escape: Close modals/panels
        • Arrow keys: Navigate tabs
        • Tab: Navigate interactive elements
    `;
    
    alert(shortcuts);
}

function announceRouteChanges() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    // Store reference globally
    window.liveRegion = liveRegion;
}

function announce(message) {
    if (window.liveRegion) {
        window.liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            window.liveRegion.textContent = '';
        }, 1000);
    }
}

// ========================================
// Utility Functions
// ========================================

// Smooth scroll to element
function scrollToElement(element, offset = 80) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Get URL parameters (for future deep linking)
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Save state to localStorage (for persistence between sessions)
function saveState() {
    try {
        localStorage.setItem('rezoningGuideState', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save state to localStorage:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('rezoningGuideState');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        }
    } catch (e) {
        console.warn('Could not load state from localStorage:', e);
    }
}

// ========================================
// Analytics Placeholder
// ========================================
function trackEvent(category, action, label) {
    // Placeholder for analytics tracking
    // Implement with Google Analytics, Plausible, etc.
    console.log('Event:', category, action, label);
}

// Track tab changes
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
    trackEvent('Navigation', 'Tab Switch', tabId);
    originalSwitchTab(tabId);
};

// ========================================
// Export functions for testing (optional)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchTab,
        toggleDetailPanel,
        filterGlossary,
        performSearch
    };
}

// ========================================
// Initialize on load
// ========================================
console.log('Vancouver Rezoning Guide initialized successfully');
