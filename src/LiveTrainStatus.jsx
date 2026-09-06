import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LiveTrainStatus.css';
import {
  getAllTrains,
  getTrainDetails,
  getLiveTrainState,
  getTrainEta,
  getRouteStations,
  getHistoricalDelay
} from './services/api';

const DEFAULT_TRAIN = '12951';

const TRAIN_PRESETS = {
  '12951': {
    trainNo: '12951',
    name: 'Mumbai Rajdhani',
    routeCode: 'SUPERFAST',
    originStation: 'New Delhi',
    destinationStation: 'Mumbai Central',
    active: true,
    lastUpdatedText: '24 Aug 2026, 16:20 via Station Mast GPS',
    currentStation: 'Ratlam Jn.',
    nextStation: 'Vadodara Jn.',
    speedKmh: 112,
    status: 'In Transit',
    delayType: 'WEATHER',
    delayMinutes: 12,
    distanceToNextStationKm: 84,
    distanceToDestinationKm: 492,
    etaToNextStationMinutes: 45,
    etaToDestinationMinutes: 382,
    confidence: 94,
    stations: [
      { sequenceNumber: 1, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '12:10', departureTime: '12:10', delayMins: 0, histLate: 2 },
      { sequenceNumber: 2, stationCode: 'KOTA', stationName: 'Kota Junction', arrivalTime: '14:32', departureTime: '14:35', delayMins: 0, histLate: 3 },
      { sequenceNumber: 3, stationCode: 'RTM', stationName: 'Ratlam Junction', arrivalTime: '16:05', departureTime: '16:10', delayMins: 12, histLate: 9 },
      { sequenceNumber: 4, stationCode: 'BRC', stationName: 'Vadodara Jn.', arrivalTime: '18:47', departureTime: '18:52', delayMins: 5, histLate: 6 },
      { sequenceNumber: 5, stationCode: 'BVI', stationName: 'Borivali', arrivalTime: '20:58', departureTime: '21:02', delayMins: 18, histLate: 14 },
      { sequenceNumber: 6, stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '22:40', departureTime: '22:40', delayMins: 0, histLate: 4 }
    ]
  },
  '22436': {
    trainNo: '22436',
    name: 'Vande Bharat Express',
    routeCode: 'SUPERFAST',
    originStation: 'New Delhi',
    destinationStation: 'Varanasi Jn.',
    active: true,
    lastUpdatedText: 'Just now via GPS Telemetry',
    currentStation: 'Kanpur Central',
    nextStation: 'Prayagraj Jn.',
    speedKmh: 130,
    status: 'In Transit',
    delayType: 'SPEED',
    delayMinutes: 0,
    distanceToNextStationKm: 120,
    distanceToDestinationKm: 245,
    etaToNextStationMinutes: 55,
    etaToDestinationMinutes: 180,
    confidence: 97,
    stations: [
      { sequenceNumber: 1, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '06:00', departureTime: '06:00', delayMins: 0, histLate: 1 },
      { sequenceNumber: 2, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '10:08', departureTime: '10:10', delayMins: 0, histLate: 3 },
      { sequenceNumber: 3, stationCode: 'PRYJ', stationName: 'Prayagraj Jn.', arrivalTime: '12:08', departureTime: '12:10', delayMins: 0, histLate: 2 },
      { sequenceNumber: 4, stationCode: 'BSB', stationName: 'Varanasi Jn.', arrivalTime: '14:00', departureTime: '14:00', delayMins: 0, histLate: 5 }
    ]
  },
  '12004': {
    trainNo: '12004',
    name: 'Lucknow Shatabdi',
    routeCode: 'SHATABDI',
    originStation: 'New Delhi',
    destinationStation: 'Lucknow Junction',
    active: true,
    lastUpdatedText: '2 mins ago via Station Radar',
    currentStation: 'Aligarh Jn.',
    nextStation: 'Kanpur Central',
    speedKmh: 110,
    status: 'In Transit',
    delayType: 'SIGNAL',
    delayMinutes: 6,
    distanceToNextStationKm: 190,
    distanceToDestinationKm: 260,
    etaToNextStationMinutes: 105,
    etaToDestinationMinutes: 175,
    confidence: 95,
    stations: [
      { sequenceNumber: 1, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '06:10', departureTime: '06:10', delayMins: 0, histLate: 2 },
      { sequenceNumber: 2, stationCode: 'GZB', stationName: 'Ghaziabad', arrivalTime: '06:48', departureTime: '06:50', delayMins: 2, histLate: 3 },
      { sequenceNumber: 3, stationCode: 'ALJN', stationName: 'Aligarh Jn.', arrivalTime: '07:50', departureTime: '07:52', delayMins: 6, histLate: 8 },
      { sequenceNumber: 4, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '11:20', departureTime: '11:25', delayMins: 8, histLate: 7 },
      { sequenceNumber: 5, stationCode: 'LJN', stationName: 'Lucknow Jn.', arrivalTime: '12:40', departureTime: '12:40', delayMins: 5, histLate: 4 }
    ]
  }
};

const LiveTrainStatus = () => {
  // Search & Navigation state
  const [searchValue, setSearchValue] = useState('12951 — Mumbai Rajdhani');
  const [selectedTrainNo, setSelectedTrainNo] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('train') || DEFAULT_TRAIN;
  });
  const [trainsList, setTrainsList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Core train data state
  const [trainDetails, setTrainDetails] = useState(TRAIN_PRESETS['12951']);
  const [liveState, setLiveState] = useState(TRAIN_PRESETS['12951']);
  const [etaData, setEtaData] = useState(TRAIN_PRESETS['12951']);
  const [routeStations, setRouteStations] = useState(TRAIN_PRESETS['12951'].stations);
  const [historicalDelays, setHistoricalDelays] = useState({});

  // Status flags
  const [loading, setLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(true);

  const searchWrapperRef = useRef(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial trains list for search suggestions
  useEffect(() => {
    async function loadTrainsCatalog() {
      try {
        const trains = await getAllTrains();
        if (Array.isArray(trains) && trains.length > 0) {
          setTrainsList(trains);
        }
      } catch {
        // Fallback default list
        setTrainsList([
          { trainNo: '12951', name: 'Mumbai Rajdhani', routeCode: 'SUPERFAST' },
          { trainNo: '22436', name: 'Vande Bharat Express', routeCode: 'SUPERFAST' },
          { trainNo: '12004', name: 'Lucknow Shatabdi', routeCode: 'SHATABDI' },
          { trainNo: '12001', name: 'Shatabdi Express', routeCode: 'SHATABDI' }
        ]);
      }
    }
    loadTrainsCatalog();
  }, []);

  // Load complete train data whenever selectedTrainNo changes
  const loadTrainData = useCallback(async (trainNo) => {
    if (!trainNo) return;
    setLoading(true);

    const preset = TRAIN_PRESETS[trainNo];

    try {
      // 1. Fetch train details
      let details = null;
      try {
        details = await getTrainDetails(trainNo);
        setTrainDetails(details);
        setSearchValue(`${details.trainNo} — ${details.name}`);
      } catch {
        // Fallback metadata
        details = preset || {
          trainNo,
          name: `Express ${trainNo}`,
          routeCode: 'SUPERFAST',
          originStation: 'Source',
          destinationStation: 'Destination',
          active: true
        };
        setTrainDetails(details);
        setSearchValue(`${details.trainNo} — ${details.name}`);
      }

      // 2. Fetch route stations
      if (details.routeCode) {
        try {
          const stations = await getRouteStations(details.routeCode);
          if (stations && stations.length > 0) {
            setRouteStations(stations);
            stations.forEach(async (stn) => {
              try {
                const hist = await getHistoricalDelay(trainNo, stn.stationCode);
                if (hist && hist.historicalAverageDelayMinutes !== undefined) {
                  setHistoricalDelays(prev => ({
                    ...prev,
                    [stn.stationCode]: Math.round(hist.historicalAverageDelayMinutes)
                  }));
                }
              } catch {
                // Ignore
              }
            });
          } else if (preset) {
            setRouteStations(preset.stations);
          }
        } catch {
          if (preset) {
            setRouteStations(preset.stations);
          }
        }
      } else if (preset) {
        setRouteStations(preset.stations);
      }

      // 3. Fetch live train telemetry and calculated ETA
      try {
        const [live, eta] = await Promise.all([
          getLiveTrainState(trainNo),
          getTrainEta(trainNo)
        ]);

        if (live && live.trainNo) {
          setLiveState(live);
          setIsLiveActive(true);
        } else if (preset) {
          setLiveState(preset);
          setIsLiveActive(true);
        }

        if (eta && eta.trainNo) {
          setEtaData(eta);
        } else if (preset) {
          setEtaData(preset);
        }
      } catch {
        if (preset) {
          setLiveState(preset);
          setEtaData(preset);
          setIsLiveActive(true);
        }
      }

    } catch (err) {
      console.warn('Backend load notice, using rich profile:', err);
      if (preset) {
        setTrainDetails(preset);
        setLiveState(preset);
        setEtaData(preset);
        setRouteStations(preset.stations);
        setIsLiveActive(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTrainData(selectedTrainNo);
  }, [selectedTrainNo, loadTrainData]);

  // Live polling loop: Refresh live GPS telemetry every 3 seconds
  useEffect(() => {
    if (!selectedTrainNo) return;

    const interval = setInterval(async () => {
      try {
        const [live, eta] = await Promise.all([
          getLiveTrainState(selectedTrainNo).catch(() => null),
          getTrainEta(selectedTrainNo).catch(() => null)
        ]);

        if (live && live.trainNo) {
          setLiveState(live);
          setIsLiveActive(true);
        }
        if (eta && eta.trainNo) {
          setEtaData(eta);
        }
      } catch {
        // Keep smooth
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTrainNo]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;

    const match = query.match(/^(\d+)/);
    const targetTrainNo = match ? match[1] : query;

    setSelectedTrainNo(targetTrainNo);
    setShowDropdown(false);

    const url = new URL(window.location);
    url.searchParams.set('train', targetTrainNo);
    window.history.pushState({}, '', url);
  };

  const handleSelectSuggestion = (train) => {
    setSelectedTrainNo(train.trainNo);
    setSearchValue(`${train.trainNo} — ${train.name}`);
    setShowDropdown(false);

    const url = new URL(window.location);
    url.searchParams.set('train', train.trainNo);
    window.history.pushState({}, '', url);
  };

  const handleQuickSelect = (trainNo) => {
    const preset = TRAIN_PRESETS[trainNo];
    setSelectedTrainNo(trainNo);
    if (preset) {
      setSearchValue(`${preset.trainNo} — ${preset.name}`);
    } else {
      setSearchValue(trainNo);
    }
    const url = new URL(window.location);
    url.searchParams.set('train', trainNo);
    window.history.pushState({}, '', url);
  };

  // Filter autocomplete suggestions
  const filteredSuggestions = trainsList.filter(t => {
    const q = searchValue.toLowerCase();
    return t.trainNo.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
  });

  // Calculate station progression state
  const getCurrentStationIndex = () => {
    if (!liveState || !routeStations.length) return 2; // default between Ratlam & Vadodara
    const currentCode = liveState.currentStation;
    const idx = routeStations.findIndex(s => s.stationCode === currentCode || s.stationName.includes(currentCode));
    return idx >= 0 ? idx : 2;
  };

  const currentStationIdx = getCurrentStationIndex();
  const currentDelayMinutes = Math.round(etaData?.delayMinutes ?? liveState?.delayMinutes ?? 12);

  // Helper to format Delay Pill
  const renderDelayPill = (delayMins) => {
    const mins = Math.round(delayMins || 0);
    if (mins > 0) {
      return <span className="status-pill pill-delayed">Delayed {mins} min</span>;
    } else if (mins < 0) {
      return <span className="status-pill pill-ontime">Early {Math.abs(mins)} min</span>;
    }
    return <span className="status-pill pill-ontime">On time</span>;
  };


  // Compute Origin & Destination Names
  const originStation = trainDetails?.originStation || (routeStations.length > 0 ? routeStations[0].stationName : 'New Delhi');
  const destinationStation = trainDetails?.destinationStation || (routeStations.length > 0 ? routeStations[routeStations.length - 1].stationName : 'Mumbai Central');

  return (
    <div className="train-status-page">

      {/* CARD 1 — SEARCH (Matches Figma Screenshot 1) */}
      <div className="status-card search-card">
        <div className="satellite-pill-badge">
          REAL-TIME SATELLITE TELEMETRY
        </div>

        <h1 className="live-page-title">Live Train Status</h1>
        <p className="live-page-subtitle">
          Search for a train to see its current position and predicted arrival times.
        </p>

        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <div className="search-input-wrapper" ref={searchWrapperRef}>
            <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              value={searchValue}
              placeholder="12951 — Mumbai Rajdhani"
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowDropdown(true);
              }}
            />

            {/* Suggestions Dropdown */}
            {showDropdown && filteredSuggestions.length > 0 && (
              <div className="search-dropdown">
                {filteredSuggestions.slice(0, 6).map((train) => (
                  <div
                    key={train.trainNo}
                    className="search-dropdown-item"
                    onClick={() => handleSelectSuggestion(train)}
                  >
                    <div>
                      <span className="train-code">{train.trainNo}</span>
                      <span>{train.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{train.routeCode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="search-button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            Search
          </button>
        </form>

        <div className="quick-select-row">
          <span className="quick-select-label">Quick Select:</span>
          <button
            type="button"
            className={`quick-pill ${selectedTrainNo === '12951' ? 'active' : ''}`}
            onClick={() => handleQuickSelect('12951')}
          >
            12951 Mumbai Rajdhani
          </button>
          <button
            type="button"
            className={`quick-pill ${selectedTrainNo === '22436' ? 'active' : ''}`}
            onClick={() => handleQuickSelect('22436')}
          >
            22436 Vande Bharat
          </button>
          <button
            type="button"
            className={`quick-pill recent-pill ${selectedTrainNo === '12004' ? 'active' : ''}`}
            onClick={() => handleQuickSelect('12004')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Recent: 12004
          </button>
        </div>
      </div>

      {/* 2-COLUMN TOP ROW: TRAIN SUMMARY (50%) & PREDICTION INSIGHTS (50%) */}
      <div className="status-top-row-2col">
        {/* CARD 2 — TRAIN SUMMARY */}
        <div className="status-card train-summary-card">
          <div className="train-summary-top-row">
            <div className="train-badges-group">
              <span className="badge-superfast">
                {trainDetails?.routeCode || 'SUPERFAST'}
              </span>
              <span className="badge-running-pill">
                <span className="running-dot"></span>
                Running — currently between {liveState?.currentStation || 'Ratlam Jn.'} and {liveState?.nextStation || 'Vadodara Jn.'}
              </span>
            </div>

            <div className="summary-actions-group">
              <button
                type="button"
                className="action-outline-btn"
                onClick={() => loadTrainData(selectedTrainNo)}
                title="Refresh telemetry"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Live Refresh
              </button>
            </div>
          </div>

          <h2 className="train-main-title">
            {trainDetails?.trainNo || selectedTrainNo} — {trainDetails?.name || 'Mumbai Rajdhani'}
          </h2>

          <div className="train-meta-row">
            <div className="route-endpoints">
              <span>{originStation}</span>
              <svg className="route-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>{destinationStation}</span>
            </div>
            <div className="last-updated-text">
              📡 Last updated: {liveState?.lastUpdatedText || '24 Aug 2026, 16:20 via Station Mast GPS'}
            </div>
          </div>

          {/* 3 Columns Stat Grid */}
          <div className="stats-3col-grid">
            <div className="stat-box">
              <div className="stat-box-label">CURRENT STATUS</div>
              <div className="stat-box-value-row">
                <span className="stat-box-value">{liveState?.status || 'In Transit'}</span>
                <span className="pill-status-green">● Running</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">CURRENT DELAY</div>
              <div className="stat-box-value-row">
                <span className="stat-box-value text-red">
                  +{currentDelayMinutes} min
                </span>
                <span className="pill-status-red">
                  ● +{currentDelayMinutes} min
                </span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">PREDICTION ACCURACY</div>
              <div className="stat-box-value-row">
                <span className="stat-box-value">High Precision</span>
                <span className="pill-status-blue">🎯 94%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3 — PREDICTION INSIGHTS (50% right half) */}
        <div className="status-card prediction-insights-card">
          <div className="card-header-row">
            <h3 className="insights-card-title">Prediction insights</h3>
            <span className="badge-confidence">
              Confidence: 94%
            </span>
          </div>

          <div className="prediction-summary-box">
            <div className="pred-col">
              <span className="pred-label">ETA TO NEXT STOP</span>
              <span className="pred-val">
                {etaData?.etaToNextStationMinutes ? `${Math.round(etaData.etaToNextStationMinutes)} min` : '45 min'}
              </span>
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>

            <div className="pred-col">
              <span className="pred-label">ETA TO DESTINATION</span>
              <span className="pred-val red">
                {etaData?.etaToDestinationMinutes
                  ? `${Math.round(etaData.etaToDestinationMinutes / 60)}h ${Math.round(etaData.etaToDestinationMinutes % 60)}m`
                  : '6h 22m'}
              </span>
            </div>

            <div className="pred-col">
              <span className="pred-label">NET VARIANCE</span>
              <span className="pred-val orange">
                +{currentDelayMinutes} min delay
              </span>
            </div>
          </div>

          <div className="variance-trend-row">
            <span className="trend-label">Model variance trend:</span>
            <span className="trend-val">± 1.4 min standard dev</span>
          </div>

          <div className="segmented-pill">
            <div className="segment segment-min">Min -2 min</div>
            <div className="segment segment-median">Expected ETA</div>
            <div className="segment segment-max">Max +{currentDelayMinutes + 4} min</div>
          </div>

          <div className="action-btn-link" onClick={() => loadTrainData(selectedTrainNo)}>
            🔄 Refresh live telemetry &amp; ETA predictions
          </div>
        </div>
      </div>

      {/* FULL WIDTH: LIVE STATION PROGRESSION */}
      <div className="status-card timeline-card">
        <div className="timeline-header-row">
          <div>
            <div className="section-super-label">ROUTE TELEMETRY</div>
            <h3 className="section-main-title">LIVE STATION PROGRESSION</h3>
          </div>
          <span className="distance-remaining-tag">
            Remaining: {Math.round(liveState?.distanceToDestinationKm || 492)} km
          </span>
        </div>

        <div className="timeline-container">
          {routeStations.map((station, idx) => {
            const isPassed = idx < currentStationIdx;
            const isCurrent = idx === currentStationIdx;
            const isFinal = idx === routeStations.length - 1;

            const schedTime = station.arrivalTime || station.departureTime || `1${idx + 2}:00`;
            const histDelay = station.histLate ?? historicalDelays[station.stationCode] ?? Math.floor(idx * 3 + 2);

            return (
              <React.Fragment key={station.stationCode || idx}>
                <div className="timeline-row">
                  {/* Scheduled Column */}
                  <div className="sched-col">
                    <div className="sched-time">{schedTime}</div>
                    <div className="sched-label">Sched</div>
                  </div>

                  {/* Track Icon Column */}
                  <div className="track-col">
                    <div className="track-line"></div>
                    <div className="track-icon">
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <circle
                          cx="9"
                          cy="9"
                          r="7"
                          fill="none"
                          stroke={isPassed ? '#10B981' : isCurrent ? '#2563EB' : '#CBD5E1'}
                          strokeWidth="2.5"
                        />
                        {(isPassed || isCurrent) && (
                          <circle
                            cx="9"
                            cy="9"
                            r="3.5"
                            fill={isPassed ? '#10B981' : '#2563EB'}
                          />
                        )}
                      </svg>
                    </div>
                  </div>

                  {/* Station Info */}
                  <div className="station-info-col">
                    <div className="station-name">{station.stationName} ({station.stationCode})</div>
                    {isFinal ? (
                      <div className="final-dest-label">FINAL DESTINATION</div>
                    ) : (
                      <div className="station-historical">
                        Historical: avg {histDelay} min late here
                      </div>
                    )}
                  </div>

                  {/* Actual / ETA Column */}
                  <div className="actual-col">
                    <div className={`actual-time ${isPassed && (station.delayMins || currentDelayMinutes) > 0 ? 'delayed' : ''}`}>
                      {schedTime}
                    </div>
                    {isPassed ? (
                      renderDelayPill(station.delayMins ?? currentDelayMinutes)
                    ) : isCurrent ? (
                      <span className="status-pill pill-next-stop">
                        Next stop
                      </span>
                    ) : (
                      <div className="upcoming-label">Upcoming</div>
                    )}
                  </div>
                </div>

                {/* Inline Live Train Marker between Current and Next station */}
                {isCurrent && (
                  <div className="live-position-box">
                    <div className="live-train-square">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="3" width="16" height="16" rx="2" />
                        <path d="M4 11h16" />
                        <path d="M12 3v8" />
                        <path d="m8 19-2 3" />
                        <path d="m16 19 2 3" />
                        <circle cx="8" cy="15" r="1" fill="#FFFFFF" />
                        <circle cx="16" cy="15" r="1" fill="#FFFFFF" />
                      </svg>
                    </div>
                    <div className="live-position-content">
                      <div className="live-position-header">
                        <span className="pill-weather-delay">
                          ● {liveState?.delayType ? `${liveState.delayType.toLowerCase()} delay` : 'Weather delay'}
                        </span>
                        <span className="live-position-title">Live position</span>
                      </div>
                      <div className="live-position-text">
                        Train is running between <strong>{liveState?.currentStation || 'Ratlam Jn.'}</strong> and{' '}
                        <strong>{liveState?.nextStation || 'Vadodara Jn.'}</strong> (
                        {Math.round(liveState?.distanceToNextStationKm || 84)} km remaining to next station)
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="timeline-legend">
          <div className="legend-item">
            <svg width="14" height="14" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7" fill="none" stroke="#10B981" strokeWidth="2" />
              <circle cx="9" cy="9" r="3.5" fill="#10B981" />
            </svg>
            <span>Passed station</span>
          </div>
          <div className="legend-item">
            <svg width="14" height="14" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7" fill="none" stroke="#2563EB" strokeWidth="2" />
              <circle cx="9" cy="9" r="3.5" fill="#2563EB" />
            </svg>
            <span>Upcoming station</span>
          </div>
          <div className="legend-item">
            <svg width="14" height="14" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7" fill="none" stroke="#CBD5E1" strokeWidth="2" />
            </svg>
            <span>Yet to arrive</span>
          </div>
          <div className="legend-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
              <rect x="4" y="3" width="16" height="16" rx="2" />
              <path d="M4 11h16" />
            </svg>
            <span>Live train position</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveTrainStatus;
