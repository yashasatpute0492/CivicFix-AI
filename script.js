/**
 * ============================================================================
 * CivicFix AI - Frontend Core Application Logic
 * Prompt War Hackathon
 * 
 * Tech: Vanilla JavaScript (ES6+), LocalStorage, Local Heuristics Engine
 * No external APIs, libraries, or paid services.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & CONSTANTS
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'civicfix_complaints_v1';
  const BANNER_DISMISSED_KEY = 'civicfix_banner_dismissed_v1';

  // Realistic Pre-seeded Demo Complaints (clearly marked isDemo: true)
  const INITIAL_DEMO_COMPLAINTS = [
    {
      id: 'CF-101',
      title: 'Deep crater pothole near Pine Elementary School crosswalk',
      category: 'Roads & Potholes',
      urgency: 'Critical',
      location: 'Intersection of Pine St & 5th Ave, near Elementary School',
      description: 'Massive pothole roughly 2.5 feet wide and 7 inches deep directly in front of the elementary school pedestrian crosswalk. School buses and parents swerve into oncoming traffic lanes during morning drop-off. Severe hazard to cyclists and young pedestrians.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      endorsements: 14,
      isDemo: true,
      photoUrl: null
    },
    {
      id: 'CF-102',
      title: 'Streetlight cluster broken causing total blackout on Elm Ave',
      category: 'Street Lighting',
      urgency: 'High',
      location: '400-550 Elm Avenue corridor',
      description: 'Four consecutive streetlights have failed and are completely dark at night. Multiple residents have reported near-miss accidents and feeling unsafe walking from the bus stop after dark. Wiring inside base panel appears exposed.',
      status: 'In Progress',
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
      endorsements: 8,
      isDemo: true,
      photoUrl: null
    },
    {
      id: 'CF-103',
      title: 'Overflowing commercial dumpster attracting pests in Market Alley',
      category: 'Waste & Sanitation',
      urgency: 'Medium',
      location: 'Rear alley behind 120 Market Square, near Grocery Market',
      description: 'Dumpster lid broken off and trash has spilled across the alleyway. Bags torn open by stray animals and rodents. Strong foul odor penetrating nearby residential apartment windows. Needs sanitation pickup and container replacement.',
      status: 'In Progress',
      createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 1 day ago
      endorsements: 5,
      isDemo: true,
      photoUrl: null
    },
    {
      id: 'CF-104',
      title: 'High-pressure clean water main leak flooding pedestrian sidewalk',
      category: 'Water & Sewage',
      urgency: 'Critical',
      location: '720 Maple Boulevard, near General Hospital',
      description: 'Continuous torrent of clean drinking water gushing from underground pipe joint onto sidewalk and curb. Water is pooling 4 inches deep, eroding soil beneath the curb and impeding hospital clinic visitors and wheelchair access.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      endorsements: 19,
      isDemo: true,
      photoUrl: null
    },
    {
      id: 'CF-105',
      title: 'Heavy tree limb snapped and resting on overhead utility wire',
      category: 'Public Safety',
      urgency: 'Critical',
      location: 'Oak Park perimeter walkway, near 3rd Ave',
      description: 'Large pine limb cracked during high winds and is currently suspended directly across utility cables above the walking path. Noticeable electrical sparks were observed during rain. High risk of falling on pedestrians.',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(), // ~2 days ago
      endorsements: 22,
      isDemo: true,
      photoUrl: null
    },
    {
      id: 'CF-106',
      title: 'Shattered bench seating and broken swing chain in Riverside Park',
      category: 'Parks & Greenery',
      urgency: 'Low',
      location: 'Riverside Community Park, Children Playground Zone',
      description: 'Wooden slats on the eastern park bench have splintered and broken. One toddler swing chain is unhooked. Non-emergency repair needed before weekend family visits.',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
      endorsements: 3,
      isDemo: true,
      photoUrl: null
    }
  ];

  // --------------------------------------------------------------------------
  // 2. MODULAR LOCAL RULES & HEURISTICS ENGINE
  // --------------------------------------------------------------------------
  /**
   * CivicRulesEngine
   * 
   * This class encapsulates all rule-based categorization, priority calculation,
   * and duplicate detection. It is explicitly separated and structured so that
   * in a future version, these heuristic methods can be swapped or combined
   * with real AI LLM endpoints (e.g. OpenAI or Google Gemini API) via an
   * asynchronous adapter without having to touch UI render loops.
   */
  class CivicRulesEngine {
    constructor() {
      // Keyword dictionaries for auto-categorization
      this.categoryKeywords = {
        'Roads & Potholes': [
          'pothole', 'crater', 'asphalt', 'road', 'pavement', 'curb', 'sidewalk',
          'manhole', 'crack', 'tarmac', 'lane', 'street', 'driveway', 'bump', 'crossing'
        ],
        'Street Lighting': [
          'streetlight', 'light', 'lamp', 'dark', 'blackout', 'bulb', 'pole',
          'wiring', 'flicker', 'flickering', 'unlit', 'illumination', 'lantern', 'electrical'
        ],
        'Waste & Sanitation': [
          'garbage', 'trash', 'dumpster', 'litter', 'waste', 'debris', 'odor',
          'smell', 'rodents', 'rats', 'overflow', 'overflowing', 'refuse', 'spill', 'bin'
        ],
        'Water & Sewage': [
          'water', 'pipe', 'leak', 'leaking', 'burst', 'flood', 'flooding',
          'sewage', 'drain', 'drainage', 'gutter', 'sewer', 'hydrant', 'gusher', 'pressure'
        ],
        'Public Safety': [
          'danger', 'hazard', 'hazard', 'safety', 'accident', 'injury', 'collapse',
          'spark', 'sparks', 'fire', 'wire', 'exposed', 'tree', 'branch', 'sinkhole', 'falling'
        ],
        'Parks & Greenery': [
          'park', 'playground', 'bench', 'swing', 'lawn', 'grass', 'overgrown',
          'garden', 'recreation', 'fountain', 'trail', 'bark'
        ]
      };

      // Critical safety terms that boost priority score
      this.safetyHazardKeywords = [
        'danger', 'hazard', 'critical', 'injury', 'accident', 'collapse',
        'spark', 'sparks', 'fire', 'sinkhole', 'burst', 'exposed wire', 'torrent',
        'falling', 'deep crater', 'swerving', 'traffic hazard', 'emergency', 'toxic'
      ];

      // Sensitive public zones that demand faster municipal response
      this.sensitiveZones = [
        'school', 'elementary', 'kindergarten', 'hospital', 'clinic', 'pedestrian',
        'crosswalk', 'elderly', 'nursing home', 'transit', 'subway', 'bus stop',
        'playground', 'highway', 'arterial', 'library', 'daycare'
      ];

      // Vulnerability context modifiers
      this.contextVulnerabilityKeywords = [
        'dark', 'night', 'unlit', 'flooding', 'blackout', 'sewer', 'blocked',
        'impassable', 'wheelchair', 'handicap'
      ];

      // Common English Stop-words for duplicate detection
      this.stopwords = new Set([
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
        'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
        'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'did',
        'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
        'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
        'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
        'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
        'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
        'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
        'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
        'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
        'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with',
        'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'near', 'corner', 'street'
      ]);
    }

    /**
     * Predicts the most likely category based on title and description keywords.
     * @param {string} text - Combined title and description text.
     * @returns {Object} { category: string, confidence: number, matches: string[] }
     */
    predictCategory(text) {
      if (!text || text.trim().length === 0) {
        return { category: null, confidence: 0, matches: [] };
      }

      const lowerText = text.toLowerCase();
      let bestCategory = null;
      let highestCount = 0;
      let bestMatches = [];

      for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        const matched = keywords.filter(kw => lowerText.includes(kw));
        if (matched.length > highestCount) {
          highestCount = matched.length;
          bestCategory = category;
          bestMatches = matched;
        }
      }

      if (highestCount === 0) {
        return { category: 'Other', confidence: 0.1, matches: [] };
      }

      // Estimate confidence based on keyword density
      const confidence = Math.min(0.95, 0.45 + (highestCount * 0.15));
      return {
        category: bestCategory,
        confidence: Math.round(confidence * 100),
        matches: bestMatches
      };
    }

    /**
     * Calculates transparent priority score (0 to 100) and factors list.
     * @param {Object} data - { title, description, location, urgency, endorsements }
     * @returns {Object} { score: number, tier: string, breakdown: Array }
     */
    calculatePriority(data) {
      const breakdown = [];
      let score = 0;

      // 1. Citizen Urgency Base Rating
      const urgencyBaseMap = {
        'Low': 15,
        'Medium': 25,
        'High': 40,
        'Critical': 50
      };
      const urgency = data.urgency || 'Medium';
      const basePoints = urgencyBaseMap[urgency] || 25;
      score += basePoints;
      breakdown.push({
        label: `Citizen Stated Urgency (${urgency})`,
        points: `+${basePoints} pts`,
        rule: 'Direct reporter severity rating'
      });

      const combinedText = `${data.title || ''} ${data.description || ''}`.toLowerCase();
      const locationText = (data.location || '').toLowerCase();

      // 2. Safety & Hazard Keywords Rule
      const matchedHazards = this.safetyHazardKeywords.filter(kw => combinedText.includes(kw));
      if (matchedHazards.length > 0) {
        const hazardPts = Math.min(25, matchedHazards.length * 8 + 5);
        score += hazardPts;
        breakdown.push({
          label: `Safety Hazard Terms (${matchedHazards.slice(0, 3).join(', ')})`,
          points: `+${hazardPts} pts`,
          rule: 'Keywords identifying acute public safety risk'
        });
      }

      // 3. Proximity to Sensitive Public Zones Rule
      const matchedZones = this.sensitiveZones.filter(zone => 
        locationText.includes(zone) || combinedText.includes(zone)
      );
      if (matchedZones.length > 0) {
        const zonePts = Math.min(20, matchedZones.length * 10);
        score += zonePts;
        breakdown.push({
          label: `Sensitive Zone (${matchedZones.slice(0, 2).join(', ')})`,
          points: `+${zonePts} pts`,
          rule: 'Proximity to schools, hospitals, transit, or vulnerable populations'
        });
      }

      // 4. Contextual Vulnerability Modifiers (e.g. night/dark/flooding)
      const matchedContext = this.contextVulnerabilityKeywords.filter(kw => combinedText.includes(kw));
      if (matchedContext.length > 0) {
        const contextPts = Math.min(10, matchedContext.length * 5);
        score += contextPts;
        breakdown.push({
          label: `Environmental Factor (${matchedContext.slice(0, 2).join(', ')})`,
          points: `+${contextPts} pts`,
          rule: 'Conditions amplifying danger (darkness, electrical, standing water)'
        });
      }

      // 5. Community Endorsements / Crowd Consensus
      const endorsements = data.endorsements || 0;
      if (endorsements > 0) {
        // Up to +20 points for multiple citizen confirmations
        const endorsePts = Math.min(20, endorsements * 4);
        score += endorsePts;
        breakdown.push({
          label: `Community Endorsements (${endorsements} upvotes)`,
          points: `+${endorsePts} pts`,
          rule: 'Crowdsourced verification from local residents'
        });
      }

      // Normalize score between 0 and 100
      const finalScore = Math.min(100, Math.max(0, score));

      // Determine Tier
      let tier = 'Low';
      if (finalScore >= 75) {
        tier = 'Critical';
      } else if (finalScore >= 50) {
        tier = 'High';
      } else if (finalScore >= 25) {
        tier = 'Medium';
      }

      return {
        score: finalScore,
        tier: tier,
        breakdown: breakdown
      };
    }

    /**
     * Checks if a new draft complaint is a duplicate of any existing complaint.
     * Uses token overlap (Jaccard) + Location term matching.
     * @param {Object} draft - { title, description, location, excludeId }
     * @param {Array} existingComplaints - List of all stored complaints
     * @returns {Object} { isDuplicate: boolean, similarity: number, match: Object|null }
     */
    findDuplicate(draft, existingComplaints) {
      if (!draft.title || draft.title.length < 5 || !existingComplaints || existingComplaints.length === 0) {
        return { isDuplicate: false, similarity: 0, match: null };
      }

      const draftTokens = this.tokenizeText(`${draft.title} ${draft.description || ''}`);
      const draftLocTokens = this.tokenizeText(draft.location || '');

      let bestMatch = null;
      let highestSimilarity = 0;

      for (const item of existingComplaints) {
        // Skip comparing against itself if editing or same ID
        if (draft.excludeId && item.id === draft.excludeId) continue;
        if (item.status === 'Resolved') continue; // Resolved issues less likely to be active duplicates

        const itemTokens = this.tokenizeText(`${item.title} ${item.description}`);
        const itemLocTokens = this.tokenizeText(item.location);

        // 1. Text token Jaccard similarity
        const textSim = this.calculateJaccardSimilarity(draftTokens, itemTokens);

        // 2. Location token similarity
        const locSim = this.calculateJaccardSimilarity(draftLocTokens, itemLocTokens);

        // Composite similarity: 60% text content, 40% location match
        let compositeSim = (textSim * 0.6) + (locSim * 0.4);

        // If categories match and location is very similar, boost
        if (draft.category && draft.category === item.category && locSim > 0.3) {
          compositeSim += 0.15;
        }

        if (compositeSim > highestSimilarity) {
          highestSimilarity = compositeSim;
          bestMatch = item;
        }
      }

      const similarityPct = Math.round(highestSimilarity * 100);

      // Warning threshold set at 40% composite match
      return {
        isDuplicate: similarityPct >= 40,
        similarity: similarityPct,
        match: similarityPct >= 40 ? bestMatch : null
      };
    }

    /**
     * Tokenizes a text string into normalized, non-stopword tokens.
     */
    tokenizeText(text) {
      if (!text) return new Set();
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopwords.has(w));
      return new Set(words);
    }

    /**
     * Computes Jaccard index between two sets of tokens.
     */
    calculateJaccardSimilarity(setA, setB) {
      if (!setA.size || !setB.size) return 0;
      let intersectionCount = 0;
      for (const token of setA) {
        if (setB.has(token)) {
          intersectionCount++;
        }
      }
      const unionCount = setA.size + setB.size - intersectionCount;
      return unionCount === 0 ? 0 : (intersectionCount / unionCount);
    }
  }

  // --------------------------------------------------------------------------
  // 3. STORAGE & DATA MANAGEMENT REPOSITORY
  // --------------------------------------------------------------------------
  class StorageManager {
    static getComplaints() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          // Initialize demo complaints on first run
          this.saveComplaints(INITIAL_DEMO_COMPLAINTS);
          return INITIAL_DEMO_COMPLAINTS;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : INITIAL_DEMO_COMPLAINTS;
      } catch (err) {
        console.error('Failed to load complaints from localStorage:', err);
        return INITIAL_DEMO_COMPLAINTS;
      }
    }

    static saveComplaints(complaints) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      } catch (err) {
        console.error('Failed to save complaints to localStorage:', err);
      }
    }

    static addComplaint(newComplaint) {
      const list = this.getComplaints();
      list.unshift(newComplaint);
      this.saveComplaints(list);
      return list;
    }

    static updateComplaint(id, updates) {
      const list = this.getComplaints();
      const index = list.findIndex(c => c.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.saveComplaints(list);
        return list[index];
      }
      return null;
    }

    static deleteComplaint(id) {
      let list = this.getComplaints();
      list = list.filter(c => c.id !== id);
      this.saveComplaints(list);
      return list;
    }

    static resetDemoData() {
      this.saveComplaints(INITIAL_DEMO_COMPLAINTS);
      return INITIAL_DEMO_COMPLAINTS;
    }

    static clearAll() {
      this.saveComplaints([]);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 4. DOM UTILITIES & SANITIZATION (XSS DEFENSE)
  // --------------------------------------------------------------------------
  /**
   * Safe HTML string escaping to prevent XSS when rendering user text.
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Relative time formatting (e.g. "2 hours ago", "Yesterday", "Oct 23, 2026")
   */
  function formatRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Returns category emoji icon
   */
  function getCategoryIcon(category) {
    const iconMap = {
      'Roads & Potholes': '🛣️',
      'Street Lighting': '💡',
      'Waste & Sanitation': '🗑️',
      'Water & Sewage': '🚰',
      'Public Safety': '⚠️',
      'Parks & Greenery': '🌳',
      'Other': '📌'
    };
    return iconMap[category] || '📌';
  }

  // --------------------------------------------------------------------------
  // 5. TOAST NOTIFICATION SYSTEM
  // --------------------------------------------------------------------------
  function showToast(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icons = {
      success: '✅',
      warning: '⚠️',
      danger: '🛑',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span>
      <div class="toast-content">
        <div class="toast-title">${escapeHTML(title)}</div>
        <div class="toast-msg">${escapeHTML(message)}</div>
      </div>
      <button type="button" class="toast-close" aria-label="Close notification">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  // --------------------------------------------------------------------------
  // 6. MAIN APPLICATION CONTROLLER
  // --------------------------------------------------------------------------
  class CivicFixApp {
    constructor() {
      this.engine = new CivicRulesEngine();
      this.complaints = StorageManager.getComplaints();
      this.currentActiveModalComplaintId = null;
      this.currentDraftPhotoBase64 = null;
      this.activeDuplicateMatch = null;

      // Filter State for Issue Tracker
      this.filters = {
        search: '',
        category: 'ALL',
        status: 'ALL',
        priority: 'ALL',
        sort: 'priority-desc'
      };

      this.initDOMElements();
      this.bindEvents();
      this.checkBannerPreference();
      this.renderAllViews();
    }

    /**
     * Cache all primary DOM handles
     */
    initDOMElements() {
      // Navigation
      this.mobileNavToggle = document.getElementById('mobileNavToggle');
      this.primaryNav = document.getElementById('primaryNav');
      this.navLinks = document.querySelectorAll('.nav-link');
      this.viewPanels = document.querySelectorAll('.view-panel');
      this.navIssueCountBadge = document.getElementById('navIssueCountBadge');
      this.quickReportBtn = document.getElementById('quickReportBtn');
      this.brandLogoLink = document.getElementById('brandLogoLink');
      this.dismissBannerBtn = document.getElementById('dismissBannerBtn');
      this.demoBanner = document.querySelector('.demo-banner');

      // Dashboard View Elements
      this.statTotalCount = document.getElementById('statTotalCount');
      this.statPendingCount = document.getElementById('statPendingCount');
      this.statInProgressCount = document.getElementById('statInProgressCount');
      this.statResolvedCount = document.getElementById('statResolvedCount');
      this.statResolutionRate = document.getElementById('statResolutionRate');
      this.categoryBarsContainer = document.getElementById('categoryBarsContainer');
      this.dashboardRecentList = document.getElementById('dashboardRecentList');
      this.resetDemoDataBtn = document.getElementById('resetDemoDataBtn');
      this.viewAllComplaintsLink = document.getElementById('viewAllComplaintsLink');
      this.countCritical = document.getElementById('countCritical');
      this.countHigh = document.getElementById('countHigh');
      this.countMedium = document.getElementById('countMedium');
      this.countLow = document.getElementById('countLow');

      // Form Elements
      this.complaintForm = document.getElementById('complaintForm');
      this.inputTitle = document.getElementById('complaintTitle');
      this.inputLocation = document.getElementById('complaintLocation');
      this.selectCategory = document.getElementById('complaintCategory');
      this.selectUrgency = document.getElementById('complaintUrgency');
      this.inputDescription = document.getElementById('complaintDescription');
      this.descCharCount = document.getElementById('descCharCount');
      this.fileInput = document.getElementById('complaintPhoto');
      this.uploadDropzone = document.getElementById('uploadDropzone');
      this.photoPreviewWrap = document.getElementById('photoPreviewWrap');
      this.photoPreviewImg = document.getElementById('photoPreviewImg');
      this.removePhotoBtn = document.getElementById('removePhotoBtn');
      this.clearFormBtn = document.getElementById('clearFormBtn');
      this.fillSampleFormBtn = document.getElementById('fillSampleFormBtn');
      this.suggestedCategoryBadge = document.getElementById('suggestedCategoryBadge');
      this.suggestedCategoryName = document.getElementById('suggestedCategoryName');
      this.applySuggestionBtn = document.getElementById('applySuggestionBtn');

      // Live Heuristic Assistant
      this.livePriorityBadge = document.getElementById('livePriorityBadge');
      this.liveScoreTrack = document.getElementById('liveScoreTrack');
      this.liveScoreFill = document.getElementById('liveScoreFill');
      this.liveScoreValue = document.getElementById('liveScoreValue');
      this.liveScoreTier = document.getElementById('liveScoreTier');
      this.liveBreakdownList = document.getElementById('liveBreakdownList');

      // Live Duplicate Warning Box
      this.duplicateWarningCard = document.getElementById('duplicateWarningCard');
      this.duplicateSimilarityBadge = document.getElementById('duplicateSimilarityBadge');
      this.duplicatePreviewBox = document.getElementById('duplicatePreviewBox');
      this.endorseDuplicateBtn = document.getElementById('endorseDuplicateBtn');
      this.ignoreDuplicateBtn = document.getElementById('ignoreDuplicateBtn');

      // Tracker / Filter Elements
      this.searchComplaintsInput = document.getElementById('searchComplaintsInput');
      this.clearSearchBtn = document.getElementById('clearSearchBtn');
      this.sortComplaintsSelect = document.getElementById('sortComplaintsSelect');
      this.categoryFilterSelect = document.getElementById('categoryFilterSelect');
      this.statusFilterSelect = document.getElementById('statusFilterSelect');
      this.priorityFilterSelect = document.getElementById('priorityFilterSelect');
      this.resetFiltersBtn = document.getElementById('resetFiltersBtn');
      this.resultsCountText = document.getElementById('resultsCountText');
      this.activeFilterChipsContainer = document.getElementById('activeFilterChipsContainer');
      this.complaintsListContainer = document.getElementById('complaintsListContainer');
      this.complaintsEmptyState = document.getElementById('complaintsEmptyState');
      this.emptyResetFilterBtn = document.getElementById('emptyResetFilterBtn');
      this.emptyCreateReportBtn = document.getElementById('emptyCreateReportBtn');
      this.newReportFromTrackerBtn = document.getElementById('newReportFromTrackerBtn');

      // Modal Elements
      this.modal = document.getElementById('complaintDetailModal');
      if (this.modal) {
        this.modal.hidden = true;
        this.modal.style.display = 'none';
      }
      this.closeModalBtn = document.getElementById('closeModalBtn');
      this.modalDoneBtn = document.getElementById('modalDoneBtn');
      this.modalComplaintTitle = document.getElementById('modalComplaintTitle');
      this.modalComplaintId = document.getElementById('modalComplaintId');
      this.modalCategoryBadge = document.getElementById('modalCategoryBadge');
      this.modalDemoTag = document.getElementById('modalDemoTag');
      this.modalStatusBadge = document.getElementById('modalStatusBadge');
      this.modalPriorityBadge = document.getElementById('modalPriorityBadge');
      this.modalScorePill = document.getElementById('modalScorePill');
      this.modalUrgencyText = document.getElementById('modalUrgencyText');
      this.modalLocationText = document.getElementById('modalLocationText');
      this.modalDateText = document.getElementById('modalDateText');
      this.modalEndorseCount = document.getElementById('modalEndorseCount');
      this.modalDescriptionText = document.getElementById('modalDescriptionText');
      this.modalPhotoSection = document.getElementById('modalPhotoSection');
      this.modalPhotoImage = document.getElementById('modalPhotoImage');
      this.modalRuleScoreVal = document.getElementById('modalRuleScoreVal');
      this.modalRuleFactorsList = document.getElementById('modalRuleFactorsList');
      this.modalEndorseBtn = document.getElementById('modalEndorseBtn');
      this.modalEndorseBtnCount = document.getElementById('modalEndorseBtnCount');
      this.modalDeleteBtn = document.getElementById('modalDeleteBtn');

      // Footer Management
      this.exportDataBtn = document.getElementById('exportDataBtn');
      this.footerResetBtn = document.getElementById('footerResetBtn');
      this.clearAllStorageBtn = document.getElementById('clearAllStorageBtn');
    }

    /**
     * Bind UI event listeners
     */
    bindEvents() {
      // Mobile navigation toggle
      this.mobileNavToggle.addEventListener('click', () => {
        const isOpen = this.primaryNav.classList.toggle('open');
        this.mobileNavToggle.setAttribute('aria-expanded', isOpen);
      });

      // Tab switcher clicks
      this.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetViewId = link.getAttribute('data-target');
          this.switchView(targetViewId);
          if (this.primaryNav.classList.contains('open')) {
            this.primaryNav.classList.remove('open');
            this.mobileNavToggle.setAttribute('aria-expanded', 'false');
          }
        });
      });

      // Quick Report buttons
      this.quickReportBtn.addEventListener('click', () => this.switchView('report-view'));
      this.newReportFromTrackerBtn.addEventListener('click', () => this.switchView('report-view'));
      this.emptyCreateReportBtn.addEventListener('click', () => this.switchView('report-view'));
      this.viewAllComplaintsLink.addEventListener('click', () => this.switchView('tracker-view'));
      this.brandLogoLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('dashboard-view');
      });

      // Demo Banner dismiss
      if (this.dismissBannerBtn) {
        this.dismissBannerBtn.addEventListener('click', () => {
          if (this.demoBanner) this.demoBanner.style.display = 'none';
          try {
            sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
          } catch {}
        });
      }

      // Location Quick Chips
      document.querySelectorAll('.chip-btn').forEach(chip => {
        chip.addEventListener('click', () => {
          const appendVal = chip.getAttribute('data-append');
          if (appendVal) {
            const current = this.inputLocation.value.trim();
            this.inputLocation.value = current ? `${current}, ${appendVal}` : appendVal;
            this.inputLocation.focus();
            this.onFormInputsChanged();
          }
        });
      });

      // Form Real-Time Analysis Inputs (Debounced)
      let debounceTimer = null;
      const triggerAnalysis = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.onFormInputsChanged(), 180);
      };

      this.inputTitle.addEventListener('input', triggerAnalysis);
      this.inputLocation.addEventListener('input', triggerAnalysis);
      this.inputDescription.addEventListener('input', () => {
        this.descCharCount.textContent = `${this.inputDescription.value.length} / 800`;
        triggerAnalysis();
      });
      this.selectUrgency.addEventListener('change', triggerAnalysis);
      this.selectCategory.addEventListener('change', triggerAnalysis);

      // Category Suggestion Apply Button
      this.applySuggestionBtn.addEventListener('click', () => {
        const suggested = this.suggestedCategoryName.textContent;
        if (suggested && suggested !== '-') {
          this.selectCategory.value = suggested;
          this.suggestedCategoryBadge.hidden = true;
          this.onFormInputsChanged();
          showToast('Category Applied', `Set category to "${suggested}"`, 'success', 2500);
        }
      });

      // Photo Upload handling
      this.fileInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
      this.removePhotoBtn.addEventListener('click', () => this.clearPhotoPreview());

      // Form Submission
      this.complaintForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
      this.clearFormBtn.addEventListener('click', () => this.resetSubmissionForm());
      this.fillSampleFormBtn.addEventListener('click', () => this.fillSampleComplaintData());

      // Duplicate Action Buttons
      this.endorseDuplicateBtn.addEventListener('click', () => {
        if (this.activeDuplicateMatch) {
          this.endorseComplaint(this.activeDuplicateMatch.id);
          this.resetSubmissionForm();
          this.openDetailsModal(this.activeDuplicateMatch.id);
        }
      });
      this.ignoreDuplicateBtn.addEventListener('click', () => {
        this.duplicateWarningCard.hidden = true;
        showToast('Duplicate Bypassed', 'You may proceed with filing as an independent report.', 'info', 3000);
      });

      // Tracker Filters & Search
      this.searchComplaintsInput.addEventListener('input', () => {
        this.filters.search = this.searchComplaintsInput.value.trim();
        this.clearSearchBtn.hidden = !this.filters.search;
        this.renderTrackerView();
      });

      this.clearSearchBtn.addEventListener('click', () => {
        this.searchComplaintsInput.value = '';
        this.filters.search = '';
        this.clearSearchBtn.hidden = true;
        this.searchComplaintsInput.focus();
        this.renderTrackerView();
      });

      this.categoryFilterSelect.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.renderTrackerView();
      });

      this.statusFilterSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.renderTrackerView();
      });

      this.priorityFilterSelect.addEventListener('change', (e) => {
        this.filters.priority = e.target.value;
        this.renderTrackerView();
      });

      this.sortComplaintsSelect.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.renderTrackerView();
      });

      this.resetFiltersBtn.addEventListener('click', () => this.resetTrackerFilters());
      this.emptyResetFilterBtn.addEventListener('click', () => this.resetTrackerFilters());

      // Modal Events
      this.closeModalBtn.addEventListener('click', () => this.closeDetailsModal());
      this.modalDoneBtn.addEventListener('click', () => this.closeDetailsModal());
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeDetailsModal();
      });

      // Keyboard Esc key listener for modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.hidden) {
          this.closeDetailsModal();
        }
      });

      // Modal Status Simulator Action Buttons
      document.querySelectorAll('.btn-status-change').forEach(btn => {
        btn.addEventListener('click', () => {
          const newStatus = btn.getAttribute('data-new-status');
          if (this.currentActiveModalComplaintId && newStatus) {
            this.updateComplaintStatus(this.currentActiveModalComplaintId, newStatus);
          }
        });
      });

      // Modal Endorse Button
      this.modalEndorseBtn.addEventListener('click', () => {
        if (this.currentActiveModalComplaintId) {
          this.endorseComplaint(this.currentActiveModalComplaintId);
        }
      });

      // Modal Delete Button
      this.modalDeleteBtn.addEventListener('click', () => {
        if (this.currentActiveModalComplaintId) {
          if (confirm('Are you sure you want to delete this complaint record?')) {
            this.deleteComplaint(this.currentActiveModalComplaintId);
            this.closeDetailsModal();
          }
        }
      });

      // Reset Demo Data Buttons
      this.resetDemoDataBtn.addEventListener('click', () => this.handleResetDemoData());
      this.footerResetBtn.addEventListener('click', () => this.handleResetDemoData());
      this.clearAllStorageBtn.addEventListener('click', () => this.handleClearAllStorage());
      this.exportDataBtn.addEventListener('click', () => this.exportComplaintsToJSON());

      // Handle Browser Hash Routing
      window.addEventListener('hashchange', () => this.handleHashRoute());
      if (window.location.hash) {
        this.handleHashRoute();
      }
    }

    /**
     * Checks if user previously dismissed demo announcement banner in this session
     */
    checkBannerPreference() {
      try {
        if (sessionStorage.getItem(BANNER_DISMISSED_KEY) === 'true' && this.demoBanner) {
          this.demoBanner.style.display = 'none';
        }
      } catch {}
    }

    /**
     * Hash route synchronization (#dashboard, #report, #tracker, #transparency)
     */
    handleHashRoute() {
      const hash = window.location.hash.replace('#', '');
      const map = {
        'dashboard': 'dashboard-view',
        'report': 'report-view',
        'tracker': 'tracker-view',
        'transparency': 'transparency-view'
      };
      if (map[hash]) {
        this.switchView(map[hash], false);
      }
    }

    /**
     * Switch view tabs and focus appropriately
     */
    switchView(viewId, updateHash = true) {
      this.viewPanels.forEach(panel => {
        if (panel.id === viewId) {
          panel.hidden = false;
          panel.classList.add('active');
        } else {
          panel.hidden = true;
          panel.classList.remove('active');
        }
      });

      this.navLinks.forEach(link => {
        const isMatch = link.getAttribute('data-target') === viewId;
        link.classList.toggle('active', isMatch);
        link.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      if (updateHash) {
        const hash = viewId.replace('-view', '');
        history.replaceState(null, null, `#${hash}`);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If switching to tracker or dashboard, re-render
      if (viewId === 'dashboard-view') {
        this.renderDashboardView();
      } else if (viewId === 'tracker-view') {
        this.renderTrackerView();
      }
    }

    /**
     * Render all view sections
     */
    renderAllViews() {
      this.updateGlobalBadge();
      this.renderDashboardView();
      this.renderTrackerView();
    }

    /**
     * Update the active issues badge in header navigation
     */
    updateGlobalBadge() {
      const activeCount = this.complaints.filter(c => c.status !== 'Resolved').length;
      this.navIssueCountBadge.textContent = activeCount;
      this.navIssueCountBadge.title = `${activeCount} unresolved issues in database`;
    }

    // ------------------------------------------------------------------------
    // DASHBOARD RENDERING
    // ------------------------------------------------------------------------
    renderDashboardView() {
      const total = this.complaints.length;
      const pending = this.complaints.filter(c => c.status === 'Pending').length;
      const inProgress = this.complaints.filter(c => c.status === 'In Progress').length;
      const resolved = this.complaints.filter(c => c.status === 'Resolved').length;

      // Update stat counters
      this.statTotalCount.textContent = total;
      this.statPendingCount.textContent = pending;
      this.statInProgressCount.textContent = inProgress;
      this.statResolvedCount.textContent = resolved;

      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      this.statResolutionRate.textContent = `${rate}% resolution rate`;

      // Priority counts (calculated dynamically via rule engine)
      const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      this.complaints.forEach(item => {
        const evalResult = this.engine.calculatePriority(item);
        if (priorityCounts[evalResult.tier] !== undefined) {
          priorityCounts[evalResult.tier]++;
        }
      });

      this.countCritical.textContent = priorityCounts.Critical;
      this.countHigh.textContent = priorityCounts.High;
      this.countMedium.textContent = priorityCounts.Medium;
      this.countLow.textContent = priorityCounts.Low;

      // Category distribution bars
      this.renderCategoryBars();

      // Recent Urgent Issues
      this.renderRecentIssuesList();
    }

    renderCategoryBars() {
      const categoryCounts = {};
      const categories = [
        'Roads & Potholes',
        'Street Lighting',
        'Waste & Sanitation',
        'Water & Sewage',
        'Public Safety',
        'Parks & Greenery',
        'Other'
      ];

      categories.forEach(cat => categoryCounts[cat] = 0);
      this.complaints.forEach(item => {
        const cat = item.category || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const total = this.complaints.length;
      this.categoryBarsContainer.innerHTML = '';

      categories.forEach(cat => {
        const count = categoryCounts[cat] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const icon = getCategoryIcon(cat);

        const itemEl = document.createElement('div');
        itemEl.className = 'cat-bar-item';
        itemEl.innerHTML = `
          <div class="cat-bar-header">
            <span>${icon} ${escapeHTML(cat)}</span>
            <span><strong>${count}</strong> (${pct}%)</span>
          </div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        this.categoryBarsContainer.appendChild(itemEl);
      });
    }

    renderRecentIssuesList() {
      this.dashboardRecentList.innerHTML = '';

      if (this.complaints.length === 0) {
        this.dashboardRecentList.innerHTML = `
          <div class="empty-state-card" style="padding: 24px;">
            <p class="text-muted">No complaints recorded yet. Click "Reset Demo Data" to load realistic examples.</p>
          </div>
        `;
        return;
      }

      // Sort by urgency/priority score and date
      const urgentList = [...this.complaints]
        .map(item => ({ item, priority: this.engine.calculatePriority(item) }))
        .sort((a, b) => b.priority.score - a.priority.score)
        .slice(0, 4);

      urgentList.forEach(({ item, priority }) => {
        const icon = getCategoryIcon(item.category);
        const itemEl = document.createElement('article');
        itemEl.className = 'recent-item';
        itemEl.innerHTML = `
          <div class="recent-item-main">
            <span class="recent-item-icon" aria-hidden="true">${icon}</span>
            <div class="recent-item-text">
              <h3 class="recent-item-title">${escapeHTML(item.title)}</h3>
              <div class="recent-item-meta">
                <span>📍 ${escapeHTML(item.location)}</span>
                <span>•</span>
                <span>${formatRelativeTime(item.createdAt)}</span>
                <span>•</span>
                <span>👍 ${item.endorsements || 0}</span>
              </div>
            </div>
          </div>
          <div class="recent-item-actions">
            <span class="priority-badge priority-${priority.tier.toLowerCase()}">${priority.tier}</span>
            <button type="button" class="btn btn-secondary btn-xs btn-inspect-recent" data-id="${item.id}">Inspect →</button>
          </div>
        `;

        itemEl.querySelector('.btn-inspect-recent').addEventListener('click', () => {
          this.openDetailsModal(item.id);
        });

        this.dashboardRecentList.appendChild(itemEl);
      });
    }

    // ------------------------------------------------------------------------
    // FORM INTERACTION, LIVE RULES ASSISTANT & DUPLICATE CHECK
    // ------------------------------------------------------------------------
    onFormInputsChanged() {
      const title = this.inputTitle.value.trim();
      const location = this.inputLocation.value.trim();
      const description = this.inputDescription.value.trim();
      const urgency = this.selectUrgency.value;
      const currentCategory = this.selectCategory.value;

      const draft = {
        title,
        description,
        location,
        urgency,
        category: currentCategory,
        endorsements: 0
      };

      // 1. Live Priority Scoring Calculation
      const evalResult = this.engine.calculatePriority(draft);
      this.updateLivePriorityUI(evalResult, title.length > 0 || description.length > 0);

      // 2. Smart Category Auto-Detection
      if (title.length >= 4 || description.length >= 10) {
        const pred = this.engine.predictCategory(`${title} ${description}`);
        if (pred.category && pred.confidence > 40 && pred.category !== currentCategory) {
          this.suggestedCategoryName.textContent = pred.category;
          this.suggestedCategoryBadge.hidden = false;
        } else {
          this.suggestedCategoryBadge.hidden = true;
        }
      } else {
        this.suggestedCategoryBadge.hidden = true;
      }

      // 3. Live Duplicate Detection
      if (title.length >= 6) {
        const dupCheck = this.engine.findDuplicate(draft, this.complaints);
        if (dupCheck.isDuplicate && dupCheck.match) {
          this.activeDuplicateMatch = dupCheck.match;
          this.renderDuplicateWarning(dupCheck);
        } else {
          this.activeDuplicateMatch = null;
          this.duplicateWarningCard.hidden = true;
        }
      } else {
        this.activeDuplicateMatch = null;
        this.duplicateWarningCard.hidden = true;
      }
    }

    updateLivePriorityUI(evalResult, hasInput) {
      if (!hasInput) {
        this.livePriorityBadge.textContent = 'Pending Input';
        this.livePriorityBadge.className = 'meter-badge badge-neutral';
        this.liveScoreFill.style.width = '0%';
        this.liveScoreFill.className = 'meter-fill';
        this.liveScoreValue.textContent = '0';
        this.liveScoreTier.textContent = 'Awaiting details';
        this.liveBreakdownList.innerHTML = `
          <li class="breakdown-empty">Begin typing title and description to see live rule evaluations.</li>
        `;
        return;
      }

      const score = evalResult.score;
      const tier = evalResult.tier;

      this.liveScoreValue.textContent = score;
      this.liveScoreFill.style.width = `${score}%`;
      this.liveScoreFill.className = `meter-fill fill-${tier.toLowerCase()}`;

      this.livePriorityBadge.textContent = tier;
      this.livePriorityBadge.className = `meter-badge priority-badge priority-${tier.toLowerCase()}`;
      this.liveScoreTier.textContent = `${tier} Priority Tier (${score}/100)`;

      // Render factors breakdown
      this.liveBreakdownList.innerHTML = '';
      evalResult.breakdown.forEach(factor => {
        const li = document.createElement('li');
        li.className = 'breakdown-item';
        li.innerHTML = `
          <span>${escapeHTML(factor.label)}</span>
          <span class="breakdown-points">${escapeHTML(factor.points)}</span>
        `;
        this.liveBreakdownList.appendChild(li);
      });
    }

    renderDuplicateWarning(dupCheck) {
      const match = dupCheck.match;
      this.duplicateSimilarityBadge.textContent = `${dupCheck.similarity}% Similarity`;
      this.duplicatePreviewBox.innerHTML = `
        <div class="dup-title">${escapeHTML(match.title)}</div>
        <div class="dup-meta">
          <strong>#${match.id}</strong> • 📍 ${escapeHTML(match.location)} • Status: <strong>${escapeHTML(match.status)}</strong> • 👍 ${match.endorsements || 0} endorsements
        </div>
        <div class="dup-desc">"${escapeHTML(match.description.slice(0, 150))}..."</div>
      `;
      this.endorseDuplicateBtn.textContent = `👍 Endorse Existing Report #${match.id} (+1 Vote)`;
      this.duplicateWarningCard.hidden = false;
    }

    handlePhotoUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Please select a valid image file (PNG, JPG, etc.).', 'danger');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('Image Too Large', 'Please select an image smaller than 2MB for browser storage.', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentDraftPhotoBase64 = e.target.result;
        this.photoPreviewImg.src = this.currentDraftPhotoBase64;
        this.uploadDropzone.hidden = true;
        this.photoPreviewWrap.hidden = false;
        showToast('Photo Attached', 'Image stored locally for this report.', 'success', 2000);
      };
      reader.readAsDataURL(file);
    }

    clearPhotoPreview() {
      this.fileInput.value = '';
      this.currentDraftPhotoBase64 = null;
      this.photoPreviewImg.src = '';
      this.uploadDropzone.hidden = false;
      this.photoPreviewWrap.hidden = true;
    }

    handleFormSubmit(event) {
      event.preventDefault();

      // Clear previous error states
      this.clearFormErrors();

      const title = this.inputTitle.value.trim();
      const location = this.inputLocation.value.trim();
      const category = this.selectCategory.value;
      const urgency = this.selectUrgency.value;
      const description = this.inputDescription.value.trim();

      // Validation
      let isValid = true;

      if (title.length < 5) {
        this.showFieldError('title', 'Please provide an issue title of at least 5 characters.');
        isValid = false;
      }

      if (location.length < 4) {
        this.showFieldError('location', 'Please specify a street, landmark, or intersection.');
        isValid = false;
      }

      if (!category) {
        this.showFieldError('category', 'Please select an issue category.');
        isValid = false;
      }

      if (description.length < 15) {
        this.showFieldError('desc', 'Description should be at least 15 characters to enable accurate triage.');
        isValid = false;
      }

      if (!isValid) {
        showToast('Form Validation Error', 'Please correct the highlighted fields before submitting.', 'warning');
        return;
      }

      // Generate Clean Unique ID
      const newId = `CF-${Math.floor(100 + Math.random() * 900)}`;

      const newComplaint = {
        id: newId,
        title,
        location,
        category,
        urgency,
        description,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        endorsements: 1,
        isDemo: false,
        photoUrl: this.currentDraftPhotoBase64 || null
      };

      // Save to localStorage
      this.complaints = StorageManager.addComplaint(newComplaint);

      showToast('Complaint Submitted!', `Issue #${newId} recorded into local database.`, 'success', 4500);

      // Reset form
      this.resetSubmissionForm();

      // Update all views and redirect to Tracker
      this.renderAllViews();
      this.switchView('tracker-view');

      // Scroll to newly created card
      setTimeout(() => {
        const card = document.getElementById(`complaint-card-${newId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.outline = '3px solid #2563eb';
          setTimeout(() => { card.style.outline = ''; }, 2000);
        }
      }, 300);
    }

    showFieldError(fieldPrefix, message) {
      const errEl = document.getElementById(`${fieldPrefix}Error`);
      const inputEl = document.getElementById(
        fieldPrefix === 'desc' ? 'complaintDescription' : `complaint${fieldPrefix.charAt(0).toUpperCase() + fieldPrefix.slice(1)}`
      );

      if (errEl) {
        errEl.textContent = message;
        errEl.hidden = false;
      }
      if (inputEl) {
        inputEl.classList.add('is-invalid');
      }
    }

    clearFormErrors() {
      ['title', 'location', 'category', 'desc'].forEach(f => {
        const errEl = document.getElementById(`${f}Error`);
        const inputEl = document.getElementById(
          f === 'desc' ? 'complaintDescription' : `complaint${f.charAt(0).toUpperCase() + f.slice(1)}`
        );
        if (errEl) errEl.hidden = true;
        if (inputEl) inputEl.classList.remove('is-invalid');
      });
    }

    resetSubmissionForm() {
      this.complaintForm.reset();
      this.descCharCount.textContent = '0 / 800';
      this.clearPhotoPreview();
      this.clearFormErrors();
      this.suggestedCategoryBadge.hidden = true;
      this.duplicateWarningCard.hidden = true;
      this.activeDuplicateMatch = null;
      this.onFormInputsChanged();
    }

    fillSampleComplaintData() {
      this.inputTitle.value = 'Massive collapsed road shoulder creating acute crash hazard near High School';
      this.inputLocation.value = '820 Westover Blvd, directly across from Central High School';
      this.selectCategory.value = 'Roads & Potholes';
      this.selectUrgency.value = 'Critical';
      this.inputDescription.value = 'Heavy rainfall caused a 10-foot stretch of the asphalt road shoulder to collapse into the drainage ditch. Bicycles and motor vehicles swerve into oncoming traffic at night due to lack of illumination. Immediate barricades and repair needed.';
      this.descCharCount.textContent = `${this.inputDescription.value.length} / 800`;
      this.clearFormErrors();
      this.onFormInputsChanged();
      showToast('Sample Data Loaded', 'Sample critical complaint ready for test submission.', 'info', 2500);
    }

    // ------------------------------------------------------------------------
    // TRACKER VIEW RENDERING & FILTERS
    // ------------------------------------------------------------------------
    renderTrackerView() {
      const filtered = this.getFilteredComplaints();

      this.resultsCountText.textContent = `Showing ${filtered.length} of ${this.complaints.length} complaints`;
      this.renderActiveFilterChips();

      this.complaintsListContainer.innerHTML = '';

      if (filtered.length === 0) {
        this.complaintsListContainer.hidden = true;
        this.complaintsEmptyState.hidden = false;
        return;
      }

      this.complaintsListContainer.hidden = false;
      this.complaintsEmptyState.hidden = true;

      filtered.forEach(item => {
        const priorityEval = this.engine.calculatePriority(item);
        const card = this.createComplaintCardElement(item, priorityEval);
        this.complaintsListContainer.appendChild(card);
      });
    }

    getFilteredComplaints() {
      let list = [...this.complaints];

      // 1. Text Search Filter
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        list = list.filter(c => 
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
        );
      }

      // 2. Category Filter
      if (this.filters.category !== 'ALL') {
        list = list.filter(c => c.category === this.filters.category);
      }

      // 3. Status Filter
      if (this.filters.status !== 'ALL') {
        list = list.filter(c => c.status === this.filters.status);
      }

      // 4. Priority Filter
      if (this.filters.priority !== 'ALL') {
        list = list.filter(c => {
          const evalResult = this.engine.calculatePriority(c);
          return evalResult.tier === this.filters.priority;
        });
      }

      // 5. Sorting
      list.sort((a, b) => {
        const evalA = this.engine.calculatePriority(a);
        const evalB = this.engine.calculatePriority(b);

        switch (this.filters.sort) {
          case 'priority-desc':
            return evalB.score - evalA.score;
          case 'date-desc':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'date-asc':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'votes-desc':
            return (b.endorsements || 0) - (a.endorsements || 0);
          default:
            return 0;
        }
      });

      return list;
    }

    createComplaintCardElement(item, priorityEval) {
      const card = document.createElement('article');
      card.className = 'complaint-card';
      card.id = `complaint-card-${item.id}`;

      const icon = getCategoryIcon(item.category);
      const isDemoBadge = item.isDemo ? `<span class="demo-tag" title="Realistic demo record for hackathon evaluation">DEMO DATA</span>` : '';
      const photoIndicator = item.photoUrl ? `<span>📷 Photo attached</span>` : '';

      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-id-wrap">
            <span class="complaint-id">#${escapeHTML(item.id)}</span>
            ${isDemoBadge}
          </div>
          <span class="status-badge status-${item.status.toLowerCase().replace(/\s+/g, '')}">${escapeHTML(item.status)}</span>
        </div>

        <div class="card-main-content">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span class="badge badge-neutral" style="font-size: 0.76rem;">${icon} ${escapeHTML(item.category)}</span>
            <span class="priority-badge priority-${priorityEval.tier.toLowerCase()}">${priorityEval.tier}</span>
          </div>

          <h3 class="complaint-heading">${escapeHTML(item.title)}</h3>
          <p class="complaint-description">${escapeHTML(item.description)}</p>

          <div class="card-meta-list">
            <div class="meta-row">
              <span class="meta-icon" aria-hidden="true">📍</span>
              <span class="meta-val">${escapeHTML(item.location)}</span>
            </div>
            <div class="meta-row" style="justify-content: space-between;">
              <span style="font-size: 0.78rem; color: var(--slate-500);">🕒 ${formatRelativeTime(item.createdAt)}</span>
              <span class="score-badge">Rule Score: ${priorityEval.score}/100</span>
            </div>
          </div>
        </div>

        <div class="card-footer-actions">
          <button type="button" class="endorse-btn btn-endorse-card" data-id="${item.id}" aria-label="Endorse complaint ${item.id}">
            👍 Endorse (<span>${item.endorsements || 0}</span>)
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-view-details" data-id="${item.id}">
            View Details &amp; Triage
          </button>
        </div>
      `;

      // Button listeners
      const endorseBtn = card.querySelector('.btn-endorse-card');
      endorseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.endorseComplaint(item.id);
      });

      const detailsBtn = card.querySelector('.btn-view-details');
      detailsBtn.addEventListener('click', () => {
        this.openDetailsModal(item.id);
      });

      return card;
    }

    renderActiveFilterChips() {
      this.activeFilterChipsContainer.innerHTML = '';

      if (this.filters.search) {
        this.addFilterChip(`Query: "${this.filters.search}"`, () => {
          this.searchComplaintsInput.value = '';
          this.filters.search = '';
          this.clearSearchBtn.hidden = true;
          this.renderTrackerView();
        });
      }

      if (this.filters.category !== 'ALL') {
        this.addFilterChip(`Category: ${this.filters.category}`, () => {
          this.filters.category = 'ALL';
          this.categoryFilterSelect.value = 'ALL';
          this.renderTrackerView();
        });
      }

      if (this.filters.status !== 'ALL') {
        this.addFilterChip(`Status: ${this.filters.status}`, () => {
          this.filters.status = 'ALL';
          this.statusFilterSelect.value = 'ALL';
          this.renderTrackerView();
        });
      }

      if (this.filters.priority !== 'ALL') {
        this.addFilterChip(`Priority: ${this.filters.priority}`, () => {
          this.filters.priority = 'ALL';
          this.priorityFilterSelect.value = 'ALL';
          this.renderTrackerView();
        });
      }
    }

    addFilterChip(text, onRemove) {
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.innerHTML = `${escapeHTML(text)} <button type="button" style="cursor:pointer; margin-left:4px;" aria-label="Remove filter">✕</button>`;
      chip.querySelector('button').addEventListener('click', onRemove);
      this.activeFilterChipsContainer.appendChild(chip);
    }

    resetTrackerFilters() {
      this.filters.search = '';
      this.filters.category = 'ALL';
      this.filters.status = 'ALL';
      this.filters.priority = 'ALL';
      this.filters.sort = 'priority-desc';

      this.searchComplaintsInput.value = '';
      this.clearSearchBtn.hidden = true;
      this.categoryFilterSelect.value = 'ALL';
      this.statusFilterSelect.value = 'ALL';
      this.priorityFilterSelect.value = 'ALL';
      this.sortComplaintsSelect.value = 'priority-desc';

      this.renderTrackerView();
      showToast('Filters Reset', 'All search and category filters cleared.', 'info', 2000);
    }

    // ------------------------------------------------------------------------
    // COMPLAINT DETAILS & TRIAGE MODAL
    // ------------------------------------------------------------------------
    openDetailsModal(complaintId) {
      const item = this.complaints.find(c => c.id === complaintId);
      if (!item) return;

      this.currentActiveModalComplaintId = complaintId;
      const priorityEval = this.engine.calculatePriority(item);
      const icon = getCategoryIcon(item.category);

      this.modalComplaintTitle.textContent = item.title;
      this.modalComplaintId.textContent = `#${item.id}`;
      this.modalCategoryBadge.textContent = `${icon} ${item.category}`;

      // Demo tag
      this.modalDemoTag.hidden = !item.isDemo;

      // Status Badge
      this.modalStatusBadge.textContent = item.status;
      this.modalStatusBadge.className = `status-badge status-${item.status.toLowerCase().replace(/\s+/g, '')}`;

      // Priority Badge
      this.modalPriorityBadge.textContent = priorityEval.tier;
      this.modalPriorityBadge.className = `priority-badge priority-${priorityEval.tier.toLowerCase()}`;

      // Rule Score Pill & Urgency
      this.modalScorePill.textContent = `${priorityEval.score} / 100`;
      this.modalUrgencyText.textContent = item.urgency || 'Medium';

      // Meta cells
      this.modalLocationText.textContent = item.location;
      this.modalDateText.textContent = new Date(item.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      this.modalEndorseCount.textContent = `${item.endorsements || 0} citizen endorsements`;

      // Full Description
      this.modalDescriptionText.textContent = item.description;

      // Attached Photo
      if (item.photoUrl) {
        this.modalPhotoImage.src = item.photoUrl;
        this.modalPhotoSection.hidden = false;
      } else {
        this.modalPhotoSection.hidden = true;
        this.modalPhotoImage.src = '';
      }

      // Local Rules Breakdown
      this.modalRuleScoreVal.textContent = priorityEval.score;
      this.modalRuleFactorsList.innerHTML = '';
      priorityEval.breakdown.forEach(factor => {
        const li = document.createElement('li');
        li.className = 'rule-factor-item';
        li.innerHTML = `
          <span><strong>${escapeHTML(factor.label)}</strong> <small style="color:var(--slate-500); display:block;">${escapeHTML(factor.rule)}</small></span>
          <span class="rule-factor-pts">${escapeHTML(factor.points)}</span>
        `;
        this.modalRuleFactorsList.appendChild(li);
      });

      // Endorse button count
      this.modalEndorseBtnCount.textContent = item.endorsements || 0;

      // Show modal
      this.modal.hidden = false;
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.closeModalBtn.focus();
    }

    closeDetailsModal() {
      this.modal.hidden = true;
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
      this.currentActiveModalComplaintId = null;
    }

    // ------------------------------------------------------------------------
    // ACTIONS: ENDORSE, STATUS TRIAGE, DELETE, RESET
    // ------------------------------------------------------------------------
    endorseComplaint(complaintId) {
      const item = this.complaints.find(c => c.id === complaintId);
      if (!item) return;

      const updatedEndorsements = (item.endorsements || 0) + 1;
      StorageManager.updateComplaint(complaintId, { endorsements: updatedEndorsements });
      this.complaints = StorageManager.getComplaints();

      showToast(
        'Complaint Endorsed! 👍',
        `Issue #${complaintId} upvoted. Priority score adjusted to reflect community impact.`,
        'success',
        3000
      );

      this.renderAllViews();

      // If modal is open for this complaint, update its counters
      if (this.currentActiveModalComplaintId === complaintId) {
        this.openDetailsModal(complaintId);
      }
    }

    updateComplaintStatus(complaintId, newStatus) {
      const updated = StorageManager.updateComplaint(complaintId, { status: newStatus });
      if (updated) {
        this.complaints = StorageManager.getComplaints();
        showToast(
          'Status Updated',
          `Complaint #${complaintId} marked as "${newStatus}".`,
          newStatus === 'Resolved' ? 'success' : 'info',
          3500
        );
        this.renderAllViews();
        this.openDetailsModal(complaintId);
      }
    }

    deleteComplaint(complaintId) {
      this.complaints = StorageManager.deleteComplaint(complaintId);
      showToast('Complaint Deleted', `Issue #${complaintId} has been removed from local storage.`, 'warning', 3000);
      this.renderAllViews();
    }

    handleResetDemoData() {
      if (confirm('Reset database to realistic sample complaints? Any custom complaints you added will be refreshed.')) {
        this.complaints = StorageManager.resetDemoData();
        this.renderAllViews();
        showToast('Demo Data Reloaded', 'Local database restored with 6 verified sample records.', 'success', 3500);
      }
    }

    handleClearAllStorage() {
      if (confirm('Are you sure you want to clear all complaints? LocalStorage will be empty.')) {
        this.complaints = StorageManager.clearAll();
        this.renderAllViews();
        showToast('Storage Cleared', 'All local complaint records removed.', 'info', 3000);
      }
    }

    exportComplaintsToJSON() {
      try {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.complaints, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `civicfix_ai_complaints_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Export Complete', 'Downloaded complaint records in JSON format.', 'success', 3000);
      } catch (err) {
        console.error('Export failed:', err);
        showToast('Export Failed', 'Could not export JSON data.', 'danger');
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. BOOTSTRAP APPLICATION ON DOM READY
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    window.CivicFixAppInstance = new CivicFixApp();
  });

})();
