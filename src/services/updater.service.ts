import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { ReleaseNote } from '../types';

const RELEASES_URL = 'https://help.relativity.com/RelativityOne/Content/What_s_New/Release_notes.htm';
const CSV_PATH = path.join(__dirname, '../../data/Releases_History.csv');
const CACHE_PATH = path.join(__dirname, '../../data/releases-cache.json');

export async function checkForNewReleases(): Promise<{ updated: boolean; newCount: number }> {
  console.log('🔄 Checking for new releases...');

  try {
    // 1. Get the latest release from our CSV
    const localLatest = await getLatestLocalRelease();
    console.log(`📋 Latest local release: ${localLatest?.date} - ${localLatest?.feature}`);

    // 2. Scrape the latest release from the website
    const webLatest = await scrapeLatestRelease();
    console.log(`🌐 Latest web release: ${webLatest?.date} - ${webLatest?.feature}`);

    // 3. Compare dates
    if (!webLatest || !localLatest) {
      console.log('⚠️ Could not compare releases');
      return { updated: false, newCount: 0 };
    }

    if (webLatest.date <= localLatest.date) {
      console.log('✅ No new releases found');
      return { updated: false, newCount: 0 };
    }

    // 4. New release found! Add it to CSV
    console.log('🆕 New release found! Adding to database...');
    await appendToCSV(webLatest);
    await clearCache();

    console.log('✅ Database updated successfully');
    return { updated: true, newCount: 1 };

  } catch (error) {
    console.error('❌ Error checking for updates:', error);
    return { updated: false, newCount: 0 };
  }
}

async function getLatestLocalRelease(): Promise<ReleaseNote | null> {
  try {
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return null; // No data (only header)

    // Parse the first data line (after header)
    const firstLine = lines[1];
    const parsed = parseCSVLine(firstLine);
    
    if (parsed) {
      return {
        date: parsed[0] || '',
        version: parsed[0] || '',
        category: parsed[2] || '',
        feature: parsed[3] || '',
        description: parsed[4] || ''
      };
    }

    return null;
  } catch (error) {
    console.error('Error reading local releases:', error);
    return null;
  }
}

async function scrapeLatestRelease(): Promise<ReleaseNote | null> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(RELEASES_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract the first/latest release from the page
    const latestRelease = await page.evaluate(() => {
      // This selector might need adjustment based on the actual page structure
      const rows = document.querySelectorAll('table tr');
      
      if (rows.length < 2) return null;

      // Skip header, get first data row
      const firstDataRow = rows[1];
      const cells = firstDataRow.querySelectorAll('td');
      
      if (cells.length < 5) return null;

      return {
        date: cells[0]?.textContent?.trim() || '',
        version: cells[1]?.textContent?.trim() || cells[0]?.textContent?.trim() || '',
        category: cells[2]?.textContent?.trim() || '',
        feature: cells[3]?.textContent?.trim() || '',
        description: cells[4]?.textContent?.trim() || ''
      };
    });

    return latestRelease;

  } catch (error) {
    console.error('Error scraping website:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function appendToCSV(release: ReleaseNote): Promise<void> {
  // Format as CSV line
  const csvLine = `"${release.date}","${release.version}","${release.category}","${release.feature}","${release.description}"`;
  
  // Read current CSV
  const currentContent = await fs.readFile(CSV_PATH, 'utf-8');
  const lines = currentContent.split('\n');
  
  // Insert new release after header
  const header = lines[0];
  const newContent = [header, csvLine, ...lines.slice(1)].join('\n');
  
  // Write back
  await fs.writeFile(CSV_PATH, newContent, 'utf-8');
}

async function clearCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_PATH);
    console.log('🗑️ Cache cleared');
  } catch (error) {
    // Cache file might not exist, that's okay
  }
}

function parseCSVLine(line: string): string[] | null {
  try {
    const matches = line.match(/"([^"]*)"/g);
    if (!matches) return null;
    return matches.map(m => m.slice(1, -1)); // Remove quotes
  } catch (error) {
    return null;
  }
}

// Auto-update every 6 hours
export function startAutoUpdater() {
  console.log('🤖 Auto-updater started (checks every 6 hours)');
  
  // Check immediately on startup
  setTimeout(() => checkForNewReleases(), 10000); // Wait 10s after startup
  
  // Then check every 6 hours
  setInterval(() => {
    checkForNewReleases();
  }, 6 * 60 * 60 * 1000);
}