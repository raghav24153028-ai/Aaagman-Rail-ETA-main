/**
 * Aagman Rail ETA - Backend API Client
 * Connects frontend to Spring Boot REST endpoints on /api
 */

const BASE_URL = '';

/**
 * Helper to handle fetch responses and parse errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.error || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    const error = new Error(errorDetail || `HTTP error ${response.status}`);
    error.status = response.status;
    error.isNotFound = response.status === 404;
    throw error;
  }
  return response.json();
}

/**
 * Fetch all registered trains
 * @returns {Promise<Array<{id: number, trainNo: string, name: string, routeCode: string, active: boolean}>>}
 */
export async function getAllTrains() {
  const res = await fetch(`${BASE_URL}/api/trains`);
  return handleResponse(res);
}

/**
 * Fetch metadata for a specific train
 * @param {string} trainNo 
 */
export async function getTrainDetails(trainNo) {
  const res = await fetch(`${BASE_URL}/api/trains/${encodeURIComponent(trainNo)}`);
  return handleResponse(res);
}

/**
 * Fetch all currently active/simulating live trains
 * @returns {Promise<Record<string, {trainNo: string, latitude: number, longitude: number, speedKmh: number, lastUpdated: string, currentStation: string, nextStation: string, distanceToNextStationKm: number, distanceToDestinationKm: number, status: string, delayType: string}>>}
 */
export async function getAllLiveTrains() {
  const res = await fetch(`${BASE_URL}/api/live`);
  return handleResponse(res);
}

/**
 * Fetch live GPS state for a specific train
 * @param {string} trainNo 
 */
export async function getLiveTrainState(trainNo) {
  const res = await fetch(`${BASE_URL}/api/live/${encodeURIComponent(trainNo)}`);
  return handleResponse(res);
}

/**
 * Fetch dynamic ETA calculation for a specific train
 * @param {string} trainNo 
 * @returns {Promise<{trainNo: string, currentStation: string, nextStation: string, distanceToNextStationKm: number, distanceToDestinationKm: number, speedKmh: number, etaToNextStationMinutes: number, etaToDestinationMinutes: number, delayMinutes: number}>}
 */
export async function getTrainEta(trainNo) {
  const res = await fetch(`${BASE_URL}/api/eta/${encodeURIComponent(trainNo)}`);
  return handleResponse(res);
}

/**
 * Fetch the ordered list of stations for a route
 * @param {string} routeCode 
 * @returns {Promise<Array<{sequenceNumber: number, stationCode: string, stationName: string, arrivalTime?: string, departureTime?: string, day?: number}>>}
 */
export async function getRouteStations(routeCode) {
  const res = await fetch(`${BASE_URL}/api/routes/${encodeURIComponent(routeCode)}/stations`);
  return handleResponse(res);
}

/**
 * Fetch historical average delay for a train at a specific station
 * @param {string} trainNo 
 * @param {string} stationCode 
 * @returns {Promise<{trainNo: string, stationCode: string, historicalAverageDelayMinutes: number}>}
 */
export async function getHistoricalDelay(trainNo, stationCode) {
  const res = await fetch(`${BASE_URL}/api/historical-delay/${encodeURIComponent(trainNo)}/${encodeURIComponent(stationCode)}`);
  return handleResponse(res);
}
