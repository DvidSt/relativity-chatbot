import fs from 'fs/promises';
import path from 'path';
import { ReleaseNote } from '../types';

const CSV_PATH = path.join(__dirname, '../../data/Releases_History.csv');
const CACHE_FILE = path.join(__dirname, '../../data/releases-cache.json');

export async function getReleaseData(): Promise<ReleaseNote[]> {
  try {
    // Check if cache exists and is recent (< 24 hours)
    const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheData);

    const lastUpdated = new Date(cache.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24 && cache.releases && cache.releases.length > 0) {
      console.log(`📋 Using cached release data (${cache.releases.length} releases, ${hoursDiff.toFixed(1)}h old)`);
      return cache.releases;
    }
  } catch (error) {
    console.log('📋 Cache not found or expired, loading from CSV');
  }

  // Load from CSV
  return await loadFromCSV();
}

async function loadFromCSV(): Promise<ReleaseNote[]> {
  try {
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📂 Loading ${lines.length - 1} releases from CSV...`);

    const releases: ReleaseNote[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parsed = parseCSVLine(lines[i]);
      if (parsed && parsed.length >= 5) {
        releases.push({
          date: parsed[0] || '',
          version: parsed[1] || parsed[0] || '', // Use date as version if not available
          category: parsed[2] || '',
          feature: parsed[3] || '',
          description: parsed[4] || ''
        });
      }
    }

    console.log(`✅ Loaded ${releases.length} releases successfully`);

    // Save to cache
    await saveToCache(releases);

    return releases;
  } catch (error) {
    console.error('❌ Error loading CSV:', error);
    throw new Error('Failed to load release data');
  }
}

function parseCSVLine(line: string): string[] | null {
  try {
    // Match quoted fields: "field1","field2","field3"
    const matches = line.match(/"([^"]*)"/g);
    if (!matches) return null;
    
    // Remove quotes from each match
    return matches.map(m => m.slice(1, -1));
  } catch (error) {
    console.error('Error parsing CSV line:', error);
    return null;
  }
}

async function saveToCache(releases: ReleaseNote[]): Promise<void> {
  try {
    const cache = {
      lastUpdated: new Date().toISOString(),
      releaseCount: releases.length,
      releases
    };
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log('💾 Cache saved successfully');
  } catch (error) {
    console.error('⚠️ Failed to save cache:', error);
    // Non-critical error, continue
  }
}

export async function searchReleases(query: string): Promise<ReleaseNote[]> {
  const releases = await getReleaseData();

  const lowercaseQuery = query.toLowerCase();
  return releases.filter(release =>
    release.feature.toLowerCase().includes(lowercaseQuery) ||
    release.description.toLowerCase().includes(lowercaseQuery) ||
    release.category.toLowerCase().includes(lowercaseQuery) ||
    release.version.toLowerCase().includes(lowercaseQuery)
  );
}

export async function getLatestRelease(): Promise<ReleaseNote | null> {
  const releases = await getReleaseData();

  if (releases.length === 0) return null;

  // Return the first one (already sorted by date in CSV)
  return releases[0];
}

export async function getReleasesByYear(year: string): Promise<ReleaseNote[]> {
  const releases = await getReleaseData();
  return releases.filter(r => r.date.includes(year));
}

export async function getReleasesByCategory(category: string): Promise<ReleaseNote[]> {
  const releases = await getReleaseData();
  const lowerCategory = category.toLowerCase();
  return releases.filter(r => 
    r.category.toLowerCase().includes(lowerCategory) ||
    r.feature.toLowerCase().includes(lowerCategory)
  );
}

export async function clearCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_FILE);
    console.log('🗑️ Cache cleared');
  } catch (error) {
    // Cache might not exist
  }
}