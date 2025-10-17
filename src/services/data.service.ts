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
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else if (inQuotes) {
        current += char;
      }
    }

    // Add last field
    if (current || inQuotes) {
      fields.push(current.trim());
    }

    return fields.length >= 5 ? fields : null;
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

  // Sort releases by date in descending order (most recent first)
  const sortedReleases = releases.sort((a, b) => {
    // Parse dates correctly: "2025/10/16" format
    const [yearA, monthA, dayA] = a.date.split('/').map(Number);
    const [yearB, monthB, dayB] = b.date.split('/').map(Number);

    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);

    return dateB.getTime() - dateA.getTime();
  });

  return sortedReleases[0];
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

export async function debugReleases(): Promise<void> {
  const releases = await getReleaseData();

  console.log('\n===== DEBUG: PRIMEROS 5 RELEASES =====');
  releases.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. ${r.date} | ${r.feature} | ${r.description.substring(0, 60)}...`);
  });

  console.log('\n===== DEBUG: ÚLTIMO RELEASE =====');
  const latest = await getLatestRelease();
  if (latest) {
    console.log(`Fecha: ${latest.date}`);
    console.log(`Feature: ${latest.feature}`);
    console.log(`Descripción: ${latest.description}`);
  }

  console.log('\n===== DEBUG: BÚSQUEDA "Cost Explorer" =====');
  const costExplorer = releases.filter(r =>
    r.description.toLowerCase().includes('cost explorer')
  );
  console.log(`Encontrados: ${costExplorer.length}`);
  costExplorer.forEach(r => {
    console.log(`- ${r.date}: ${r.description}`);
  });
}