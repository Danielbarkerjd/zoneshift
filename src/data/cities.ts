import type { City } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function cityLabel(city: { name: string; iata?: string }): string {
  return city.iata ? `${city.name} (${city.iata})` : city.name;
}

export function getCityKey(city: City): string {
  return `${city.name}|${city.iata ?? ''}|${city.state ?? ''}|${city.country}`;
}

// ── Dataset ───────────────────────────────────────────────────────────────────

export const CITIES: City[] = [
  // ── United States: Northeast ─────────────────────────────────────────────
  { name: 'New York', iata: 'JFK', displayName: 'New York (JFK)', state: 'NY', country: 'US', timezone: 'America/New_York', aliases: ['John F Kennedy', 'Kennedy', 'New York City', 'NYC', 'JFK Airport'] },
  { name: 'New York', iata: 'LGA', displayName: 'New York (LGA)', state: 'NY', country: 'US', timezone: 'America/New_York', aliases: ['LaGuardia', 'La Guardia', 'New York City', 'NYC'] },
  { name: 'Newark', iata: 'EWR', displayName: 'Newark (EWR)', state: 'NJ', country: 'US', timezone: 'America/New_York', aliases: ['Newark Liberty', 'New York', 'New Jersey', 'NJ'] },
  { name: 'Boston', iata: 'BOS', state: 'MA', country: 'US', timezone: 'America/New_York', displayName: 'Boston (BOS)', aliases: ['Logan'] },
  { name: 'Philadelphia', iata: 'PHL', state: 'PA', country: 'US', timezone: 'America/New_York', displayName: 'Philadelphia (PHL)', aliases: ['Philly'] },
  { name: 'Pittsburgh', iata: 'PIT', state: 'PA', country: 'US', timezone: 'America/New_York', displayName: 'Pittsburgh (PIT)' },
  { name: 'Baltimore', iata: 'BWI', state: 'MD', country: 'US', timezone: 'America/New_York', displayName: 'Baltimore (BWI)', aliases: ['Thurgood Marshall', 'Washington'] },
  { name: 'Washington Dulles', iata: 'IAD', state: 'VA', country: 'US', timezone: 'America/New_York', displayName: 'Washington Dulles (IAD)', aliases: ['Dulles', 'Washington DC', 'DC', 'IAD'] },
  { name: 'Washington National', iata: 'DCA', state: 'DC', country: 'US', timezone: 'America/New_York', displayName: 'Washington National (DCA)', aliases: ['Reagan', 'Reagan National', 'National Airport', 'Washington DC', 'DC', 'DCA'] },
  { name: 'Buffalo', iata: 'BUF', state: 'NY', country: 'US', timezone: 'America/New_York', displayName: 'Buffalo (BUF)' },
  { name: 'Rochester', iata: 'ROC', state: 'NY', country: 'US', timezone: 'America/New_York', displayName: 'Rochester (ROC)' },
  { name: 'Syracuse', iata: 'SYR', state: 'NY', country: 'US', timezone: 'America/New_York', displayName: 'Syracuse (SYR)' },
  { name: 'Albany', iata: 'ALB', state: 'NY', country: 'US', timezone: 'America/New_York', displayName: 'Albany (ALB)' },
  { name: 'Hartford', iata: 'BDL', state: 'CT', country: 'US', timezone: 'America/New_York', displayName: 'Hartford (BDL)', aliases: ['Bradley'] },
  { name: 'Providence', iata: 'PVD', state: 'RI', country: 'US', timezone: 'America/New_York', displayName: 'Providence (PVD)' },
  { name: 'Manchester', iata: 'MHT', state: 'NH', country: 'US', timezone: 'America/New_York', displayName: 'Manchester (MHT)', aliases: ['New Hampshire', 'NH'] },
  { name: 'Burlington', iata: 'BTV', state: 'VT', country: 'US', timezone: 'America/New_York', displayName: 'Burlington (BTV)' },
  { name: 'Portland', iata: 'PWM', state: 'ME', country: 'US', timezone: 'America/New_York', displayName: 'Portland, ME (PWM)', aliases: ['PWM'] },
  { name: 'Bangor', iata: 'BGR', state: 'ME', country: 'US', timezone: 'America/New_York', displayName: 'Bangor (BGR)' },
  { name: 'Harrisburg', iata: 'MDT', state: 'PA', country: 'US', timezone: 'America/New_York', displayName: 'Harrisburg (MDT)', aliases: ['HIA'] },
  { name: 'Allentown', iata: 'ABE', state: 'PA', country: 'US', timezone: 'America/New_York', displayName: 'Allentown (ABE)', aliases: ['Lehigh Valley'] },

  // ── United States: Southeast ─────────────────────────────────────────────
  { name: 'Miami', iata: 'MIA', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Miami (MIA)', aliases: ['South Florida'] },
  { name: 'Fort Lauderdale', iata: 'FLL', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Fort Lauderdale (FLL)', aliases: ['Hollywood'] },
  { name: 'West Palm Beach', iata: 'PBI', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'West Palm Beach (PBI)', aliases: ['Palm Beach'] },
  { name: 'Orlando', iata: 'MCO', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Orlando (MCO)', aliases: ['Disney'] },
  { name: 'Tampa', iata: 'TPA', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Tampa (TPA)' },
  { name: 'Sarasota', iata: 'SRQ', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Sarasota (SRQ)', aliases: ['Bradenton'] },
  { name: 'Fort Myers', iata: 'RSW', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Fort Myers (RSW)', aliases: ['Southwest Florida', 'Cape Coral'] },
  { name: 'Jacksonville', iata: 'JAX', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Jacksonville (JAX)' },
  { name: 'Gainesville', iata: 'GNV', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Gainesville (GNV)' },
  { name: 'Tallahassee', iata: 'TLH', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Tallahassee (TLH)' },
  { name: 'Pensacola', iata: 'PNS', state: 'FL', country: 'US', timezone: 'America/Chicago', displayName: 'Pensacola (PNS)' },
  { name: 'Panama City', iata: 'ECP', state: 'FL', country: 'US', timezone: 'America/Chicago', displayName: 'Panama City, FL (ECP)', aliases: ['Panama City Beach', 'Northwest Florida'] },
  { name: 'Daytona Beach', iata: 'DAB', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Daytona Beach (DAB)' },
  { name: 'Key West', iata: 'EYW', state: 'FL', country: 'US', timezone: 'America/New_York', displayName: 'Key West (EYW)' },
  { name: 'Atlanta', iata: 'ATL', state: 'GA', country: 'US', timezone: 'America/New_York', displayName: 'Atlanta (ATL)', aliases: ['Hartsfield', 'Hartsfield-Jackson'] },
  { name: 'Savannah', iata: 'SAV', state: 'GA', country: 'US', timezone: 'America/New_York', displayName: 'Savannah (SAV)', aliases: ['Hilton Head'] },
  { name: 'Augusta', iata: 'AGS', state: 'GA', country: 'US', timezone: 'America/New_York', displayName: 'Augusta (AGS)' },
  { name: 'Charlotte', iata: 'CLT', state: 'NC', country: 'US', timezone: 'America/New_York', displayName: 'Charlotte (CLT)', aliases: ['Douglas'] },
  { name: 'Raleigh', iata: 'RDU', state: 'NC', country: 'US', timezone: 'America/New_York', displayName: 'Raleigh (RDU)', aliases: ['Durham', 'Research Triangle', 'Raleigh Durham'] },
  { name: 'Greensboro', iata: 'GSO', state: 'NC', country: 'US', timezone: 'America/New_York', displayName: 'Greensboro (GSO)', aliases: ['Piedmont Triad', 'Winston-Salem'] },
  { name: 'Wilmington', iata: 'ILM', state: 'NC', country: 'US', timezone: 'America/New_York', displayName: 'Wilmington (ILM)' },
  { name: 'Myrtle Beach', iata: 'MYR', state: 'SC', country: 'US', timezone: 'America/New_York', displayName: 'Myrtle Beach (MYR)' },
  { name: 'Charleston', iata: 'CHS', state: 'SC', country: 'US', timezone: 'America/New_York', displayName: 'Charleston (CHS)' },
  { name: 'Columbia', iata: 'CAE', state: 'SC', country: 'US', timezone: 'America/New_York', displayName: 'Columbia (CAE)' },
  { name: 'Nashville', iata: 'BNA', state: 'TN', country: 'US', timezone: 'America/Chicago', displayName: 'Nashville (BNA)', aliases: ['Music City'] },
  { name: 'Memphis', iata: 'MEM', state: 'TN', country: 'US', timezone: 'America/Chicago', displayName: 'Memphis (MEM)' },
  { name: 'Knoxville', iata: 'TYS', state: 'TN', country: 'US', timezone: 'America/New_York', displayName: 'Knoxville (TYS)' },
  { name: 'Chattanooga', iata: 'CHA', state: 'TN', country: 'US', timezone: 'America/New_York', displayName: 'Chattanooga (CHA)' },
  { name: 'Louisville', iata: 'SDF', state: 'KY', country: 'US', timezone: 'America/Kentucky/Louisville', displayName: 'Louisville (SDF)' },
  { name: 'Lexington', iata: 'LEX', state: 'KY', country: 'US', timezone: 'America/New_York', displayName: 'Lexington (LEX)' },
  { name: 'Birmingham', iata: 'BHM', state: 'AL', country: 'US', timezone: 'America/Chicago', displayName: 'Birmingham (BHM)', aliases: ['Alabama'] },
  { name: 'Huntsville', iata: 'HSV', state: 'AL', country: 'US', timezone: 'America/Chicago', displayName: 'Huntsville (HSV)' },
  { name: 'Mobile', iata: 'MOB', state: 'AL', country: 'US', timezone: 'America/Chicago', displayName: 'Mobile (MOB)' },
  { name: 'Montgomery', iata: 'MGM', state: 'AL', country: 'US', timezone: 'America/Chicago', displayName: 'Montgomery (MGM)' },
  { name: 'New Orleans', iata: 'MSY', state: 'LA', country: 'US', timezone: 'America/Chicago', displayName: 'New Orleans (MSY)', aliases: ['NOLA', 'Louis Armstrong'] },
  { name: 'Baton Rouge', iata: 'BTR', state: 'LA', country: 'US', timezone: 'America/Chicago', displayName: 'Baton Rouge (BTR)' },
  { name: 'Shreveport', iata: 'SHV', state: 'LA', country: 'US', timezone: 'America/Chicago', displayName: 'Shreveport (SHV)' },
  { name: 'Lafayette', iata: 'LFT', state: 'LA', country: 'US', timezone: 'America/Chicago', displayName: 'Lafayette (LFT)' },
  { name: 'Jackson', iata: 'JAN', state: 'MS', country: 'US', timezone: 'America/Chicago', displayName: 'Jackson, MS (JAN)' },
  { name: 'Virginia Beach', iata: 'ORF', state: 'VA', country: 'US', timezone: 'America/New_York', displayName: 'Virginia Beach (ORF)', aliases: ['Norfolk', 'Hampton Roads'] },
  { name: 'Richmond', iata: 'RIC', state: 'VA', country: 'US', timezone: 'America/New_York', displayName: 'Richmond (RIC)' },

  // ── United States: Midwest ────────────────────────────────────────────────
  { name: 'Chicago', iata: 'ORD', state: 'IL', country: 'US', timezone: 'America/Chicago', displayName: "Chicago (ORD)", aliases: ["O'Hare", 'O Hare', 'Ohare', "O'Hare International"] },
  { name: 'Chicago', iata: 'MDW', state: 'IL', country: 'US', timezone: 'America/Chicago', displayName: 'Chicago (MDW)', aliases: ['Midway', 'Chicago Midway', 'Southwest Airlines'] },
  { name: 'Milwaukee', iata: 'MKE', state: 'WI', country: 'US', timezone: 'America/Chicago', displayName: 'Milwaukee (MKE)', aliases: ['Mitchell'] },
  { name: 'Madison', iata: 'MSN', state: 'WI', country: 'US', timezone: 'America/Chicago', displayName: 'Madison (MSN)' },
  { name: 'Green Bay', iata: 'GRB', state: 'WI', country: 'US', timezone: 'America/Chicago', displayName: 'Green Bay (GRB)' },
  { name: 'Minneapolis', iata: 'MSP', state: 'MN', country: 'US', timezone: 'America/Chicago', displayName: 'Minneapolis (MSP)', aliases: ['Twin Cities', 'Saint Paul', 'St. Paul'] },
  { name: 'Duluth', iata: 'DLH', state: 'MN', country: 'US', timezone: 'America/Chicago', displayName: 'Duluth (DLH)' },
  { name: 'Detroit', iata: 'DTW', state: 'MI', country: 'US', timezone: 'America/Detroit', displayName: 'Detroit (DTW)', aliases: ['Metropolitan Wayne County'] },
  { name: 'Grand Rapids', iata: 'GRR', state: 'MI', country: 'US', timezone: 'America/Detroit', displayName: 'Grand Rapids (GRR)' },
  { name: 'Cleveland', iata: 'CLE', state: 'OH', country: 'US', timezone: 'America/New_York', displayName: 'Cleveland (CLE)', aliases: ['Hopkins'] },
  { name: 'Columbus', iata: 'CMH', state: 'OH', country: 'US', timezone: 'America/New_York', displayName: 'Columbus, OH (CMH)' },
  { name: 'Cincinnati', iata: 'CVG', state: 'OH', country: 'US', timezone: 'America/New_York', displayName: 'Cincinnati (CVG)' },
  { name: 'Indianapolis', iata: 'IND', state: 'IN', country: 'US', timezone: 'America/Indiana/Indianapolis', displayName: 'Indianapolis (IND)', aliases: ['Indy'] },
  { name: 'Fort Wayne', iata: 'FWA', state: 'IN', country: 'US', timezone: 'America/Indiana/Indianapolis', displayName: 'Fort Wayne (FWA)' },
  { name: 'St. Louis', iata: 'STL', state: 'MO', country: 'US', timezone: 'America/Chicago', displayName: 'St. Louis (STL)', aliases: ['Lambert', 'Saint Louis'] },
  { name: 'Kansas City', iata: 'MCI', state: 'MO', country: 'US', timezone: 'America/Chicago', displayName: 'Kansas City (MCI)', aliases: ['KCI'] },
  { name: 'Springfield', iata: 'SGF', state: 'MO', country: 'US', timezone: 'America/Chicago', displayName: 'Springfield, MO (SGF)' },
  { name: 'Omaha', iata: 'OMA', state: 'NE', country: 'US', timezone: 'America/Chicago', displayName: 'Omaha (OMA)', aliases: ['Eppley'] },
  { name: 'Lincoln', iata: 'LNK', state: 'NE', country: 'US', timezone: 'America/Chicago', displayName: 'Lincoln (LNK)' },
  { name: 'Wichita', iata: 'ICT', state: 'KS', country: 'US', timezone: 'America/Chicago', displayName: 'Wichita (ICT)' },
  { name: 'Tulsa', iata: 'TUL', state: 'OK', country: 'US', timezone: 'America/Chicago', displayName: 'Tulsa (TUL)' },
  { name: 'Oklahoma City', iata: 'OKC', state: 'OK', country: 'US', timezone: 'America/Chicago', displayName: 'Oklahoma City (OKC)', aliases: ['Will Rogers'] },
  { name: 'Fargo', iata: 'FAR', state: 'ND', country: 'US', timezone: 'America/Chicago', displayName: 'Fargo (FAR)' },
  { name: 'Bismarck', iata: 'BIS', state: 'ND', country: 'US', timezone: 'America/Chicago', displayName: 'Bismarck (BIS)' },
  { name: 'Sioux Falls', iata: 'FSD', state: 'SD', country: 'US', timezone: 'America/Chicago', displayName: 'Sioux Falls (FSD)' },
  { name: 'Rapid City', iata: 'RAP', state: 'SD', country: 'US', timezone: 'America/Denver', displayName: 'Rapid City (RAP)' },
  { name: 'Des Moines', iata: 'DSM', state: 'IA', country: 'US', timezone: 'America/Chicago', displayName: 'Des Moines (DSM)' },
  { name: 'Cedar Rapids', iata: 'CID', state: 'IA', country: 'US', timezone: 'America/Chicago', displayName: 'Cedar Rapids (CID)' },

  // ── United States: Southwest ──────────────────────────────────────────────
  { name: 'Dallas', iata: 'DFW', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Dallas (DFW)', aliases: ['Dallas Fort Worth', 'Fort Worth', 'DFW Airport'] },
  { name: 'Dallas', iata: 'DAL', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Dallas (DAL)', aliases: ['Love Field', 'Southwest', 'Dallas Love'] },
  { name: 'Houston', iata: 'IAH', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Houston (IAH)', aliases: ['Bush', 'Intercontinental', 'George Bush'] },
  { name: 'Houston', iata: 'HOU', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Houston (HOU)', aliases: ['Hobby', 'William P Hobby'] },
  { name: 'Austin', iata: 'AUS', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Austin (AUS)', aliases: ['Bergstrom'] },
  { name: 'San Antonio', iata: 'SAT', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'San Antonio (SAT)' },
  { name: 'El Paso', iata: 'ELP', state: 'TX', country: 'US', timezone: 'America/Denver', displayName: 'El Paso (ELP)' },
  { name: 'Lubbock', iata: 'LBB', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Lubbock (LBB)' },
  { name: 'Amarillo', iata: 'AMA', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Amarillo (AMA)' },
  { name: 'Midland', iata: 'MAF', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Midland (MAF)', aliases: ['Odessa', 'Midland-Odessa'] },
  { name: 'McAllen', iata: 'MFE', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'McAllen (MFE)', aliases: ['Rio Grande Valley'] },
  { name: 'Corpus Christi', iata: 'CRP', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Corpus Christi (CRP)' },
  { name: 'Harlingen', iata: 'HRL', state: 'TX', country: 'US', timezone: 'America/Chicago', displayName: 'Harlingen (HRL)', aliases: ['South Texas'] },
  { name: 'Albuquerque', iata: 'ABQ', state: 'NM', country: 'US', timezone: 'America/Denver', displayName: 'Albuquerque (ABQ)', aliases: ['Sunport'] },
  { name: 'Santa Fe', iata: 'SAF', state: 'NM', country: 'US', timezone: 'America/Denver', displayName: 'Santa Fe (SAF)' },
  { name: 'Phoenix', iata: 'PHX', state: 'AZ', country: 'US', timezone: 'America/Phoenix', displayName: 'Phoenix (PHX)', aliases: ['Sky Harbor', 'Tempe', 'Scottsdale', 'Mesa'] },
  { name: 'Tucson', iata: 'TUS', state: 'AZ', country: 'US', timezone: 'America/Phoenix', displayName: 'Tucson (TUS)' },
  { name: 'Flagstaff', iata: 'FLG', state: 'AZ', country: 'US', timezone: 'America/Phoenix', displayName: 'Flagstaff (FLG)' },
  { name: 'Yuma', iata: 'YUM', state: 'AZ', country: 'US', timezone: 'America/Phoenix', displayName: 'Yuma (YUM)' },
  { name: 'Las Vegas', iata: 'LAS', state: 'NV', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Las Vegas (LAS)', aliases: ['Vegas', 'McCarran', 'Harry Reid'] },

  // ── United States: Mountain ───────────────────────────────────────────────
  { name: 'Denver', iata: 'DEN', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Denver (DEN)', aliases: ['DIA', 'Mile High'] },
  { name: 'Colorado Springs', iata: 'COS', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Colorado Springs (COS)' },
  { name: 'Aspen', iata: 'ASE', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Aspen (ASE)' },
  { name: 'Vail', iata: 'EGE', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Vail (EGE)', aliases: ['Eagle', 'Eagle County'] },
  { name: 'Durango', iata: 'DRO', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Durango (DRO)' },
  { name: 'Grand Junction', iata: 'GJT', state: 'CO', country: 'US', timezone: 'America/Denver', displayName: 'Grand Junction (GJT)' },
  { name: 'Salt Lake City', iata: 'SLC', state: 'UT', country: 'US', timezone: 'America/Denver', displayName: 'Salt Lake City (SLC)' },
  { name: 'Boise', iata: 'BOI', state: 'ID', country: 'US', timezone: 'America/Boise', displayName: 'Boise (BOI)' },
  { name: 'Spokane', iata: 'GEG', state: 'WA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Spokane (GEG)' },
  { name: 'Billings', iata: 'BIL', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Billings (BIL)' },
  { name: 'Bozeman', iata: 'BZN', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Bozeman (BZN)', aliases: ['Yellowstone', 'Big Sky'] },
  { name: 'Missoula', iata: 'MSO', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Missoula (MSO)' },
  { name: 'Great Falls', iata: 'GTF', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Great Falls (GTF)' },
  { name: 'Helena', iata: 'HLN', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Helena (HLN)' },
  { name: 'Kalispell', iata: 'FCA', state: 'MT', country: 'US', timezone: 'America/Denver', displayName: 'Kalispell (FCA)', aliases: ['Glacier', 'Whitefish'] },
  { name: 'Casper', iata: 'CPR', state: 'WY', country: 'US', timezone: 'America/Denver', displayName: 'Casper (CPR)' },
  { name: 'Jackson Hole', iata: 'JAC', state: 'WY', country: 'US', timezone: 'America/Denver', displayName: 'Jackson Hole (JAC)', aliases: ['Jackson', 'Wyoming'] },
  { name: 'Idaho Falls', iata: 'IDA', state: 'ID', country: 'US', timezone: 'America/Boise', displayName: 'Idaho Falls (IDA)' },
  { name: 'Sun Valley', iata: 'SUN', state: 'ID', country: 'US', timezone: 'America/Boise', displayName: 'Sun Valley (SUN)', aliases: ['Ketchum', 'Hailey'] },

  // ── United States: West ───────────────────────────────────────────────────
  { name: 'Los Angeles', iata: 'LAX', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Los Angeles (LAX)', aliases: ['LA', 'SoCal', 'Hollywood', 'Southern California'] },
  { name: 'San Francisco', iata: 'SFO', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'San Francisco (SFO)', aliases: ['SF', 'Bay Area'] },
  { name: 'San Diego', iata: 'SAN', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'San Diego (SAN)' },
  { name: 'San Jose', iata: 'SJC', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'San Jose (SJC)', aliases: ['Silicon Valley'] },
  { name: 'Oakland', iata: 'OAK', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Oakland (OAK)', aliases: ['Bay Area'] },
  { name: 'Sacramento', iata: 'SMF', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Sacramento (SMF)' },
  { name: 'Fresno', iata: 'FAT', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Fresno (FAT)' },
  { name: 'Bakersfield', iata: 'BFL', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Bakersfield (BFL)' },
  { name: 'Burbank', iata: 'BUR', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Burbank (BUR)', aliases: ['Hollywood Burbank', 'Bob Hope'] },
  { name: 'Long Beach', iata: 'LGB', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Long Beach (LGB)' },
  { name: 'Santa Ana', iata: 'SNA', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Santa Ana (SNA)', aliases: ['Orange County', 'John Wayne'] },
  { name: 'Ontario', iata: 'ONT', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Ontario, CA (ONT)' },
  { name: 'Palm Springs', iata: 'PSP', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Palm Springs (PSP)', aliases: ['Coachella Valley', 'Palm Desert'] },
  { name: 'Santa Barbara', iata: 'SBA', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Santa Barbara (SBA)' },
  { name: 'Santa Rosa', iata: 'STS', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Santa Rosa (STS)', aliases: ['Sonoma County', 'Wine Country'] },
  { name: 'Monterey', iata: 'MRY', state: 'CA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Monterey (MRY)', aliases: ['Carmel'] },
  { name: 'Reno', iata: 'RNO', state: 'NV', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Reno (RNO)', aliases: ['Tahoe'] },
  { name: 'Portland', iata: 'PDX', state: 'OR', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Portland, OR (PDX)' },
  { name: 'Eugene', iata: 'EUG', state: 'OR', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Eugene (EUG)' },
  { name: 'Medford', iata: 'MFR', state: 'OR', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Medford (MFR)', aliases: ['Ashland', 'Rogue Valley'] },
  { name: 'Seattle', iata: 'SEA', state: 'WA', country: 'US', timezone: 'America/Los_Angeles', displayName: 'Seattle (SEA)', aliases: ['SeaTac', 'Seattle-Tacoma', 'Tacoma'] },
  { name: 'Anchorage', iata: 'ANC', state: 'AK', country: 'US', timezone: 'America/Anchorage', displayName: 'Anchorage (ANC)' },
  { name: 'Fairbanks', iata: 'FAI', state: 'AK', country: 'US', timezone: 'America/Anchorage', displayName: 'Fairbanks (FAI)' },
  { name: 'Juneau', iata: 'JNU', state: 'AK', country: 'US', timezone: 'America/Juneau', displayName: 'Juneau (JNU)' },
  { name: 'Honolulu', iata: 'HNL', state: 'HI', country: 'US', timezone: 'Pacific/Honolulu', displayName: 'Honolulu (HNL)', aliases: ['Oahu', 'Hawaii'] },
  { name: 'Maui', iata: 'OGG', state: 'HI', country: 'US', timezone: 'Pacific/Honolulu', displayName: 'Maui (OGG)', aliases: ['Kahului'] },
  { name: 'Kona', iata: 'KOA', state: 'HI', country: 'US', timezone: 'Pacific/Honolulu', displayName: 'Kona (KOA)', aliases: ['Big Island', 'Hawaii Island'] },
  { name: 'Kauai', iata: 'LIH', state: 'HI', country: 'US', timezone: 'Pacific/Honolulu', displayName: 'Kauai (LIH)', aliases: ['Lihue'] },

  // ── Canada ────────────────────────────────────────────────────────────────
  { name: 'Toronto', iata: 'YYZ', state: 'ON', country: 'CA', timezone: 'America/Toronto', displayName: 'Toronto (YYZ)', aliases: ['Pearson', 'Lester B. Pearson', 'YTZ'] },
  { name: 'Montreal', iata: 'YUL', state: 'QC', country: 'CA', timezone: 'America/Toronto', displayName: 'Montreal (YUL)', aliases: ['Trudeau', 'Montréal'] },
  { name: 'Vancouver', iata: 'YVR', state: 'BC', country: 'CA', timezone: 'America/Vancouver', displayName: 'Vancouver (YVR)' },
  { name: 'Calgary', iata: 'YYC', state: 'AB', country: 'CA', timezone: 'America/Edmonton', displayName: 'Calgary (YYC)' },
  { name: 'Edmonton', iata: 'YEG', state: 'AB', country: 'CA', timezone: 'America/Edmonton', displayName: 'Edmonton (YEG)' },
  { name: 'Ottawa', iata: 'YOW', state: 'ON', country: 'CA', timezone: 'America/Toronto', displayName: 'Ottawa (YOW)' },
  { name: 'Winnipeg', iata: 'YWG', state: 'MB', country: 'CA', timezone: 'America/Winnipeg', displayName: 'Winnipeg (YWG)' },
  { name: 'Quebec City', iata: 'YQB', state: 'QC', country: 'CA', timezone: 'America/Toronto', displayName: 'Quebec City (YQB)', aliases: ['Québec'] },
  { name: 'Halifax', iata: 'YHZ', state: 'NS', country: 'CA', timezone: 'America/Halifax', displayName: 'Halifax (YHZ)' },
  { name: 'Victoria', iata: 'YYJ', state: 'BC', country: 'CA', timezone: 'America/Vancouver', displayName: 'Victoria (YYJ)' },
  { name: 'Kelowna', iata: 'YLW', state: 'BC', country: 'CA', timezone: 'America/Vancouver', displayName: 'Kelowna (YLW)', aliases: ['Okanagan'] },
  { name: 'Saskatoon', iata: 'YXE', state: 'SK', country: 'CA', timezone: 'America/Regina', displayName: 'Saskatoon (YXE)' },
  { name: 'Regina', iata: 'YQR', state: 'SK', country: 'CA', timezone: 'America/Regina', displayName: 'Regina (YQR)' },
  { name: "St. John's", iata: 'YYT', state: 'NL', country: 'CA', timezone: 'America/St_Johns', displayName: "St. John's (YYT)", aliases: ['Saint Johns'] },
  { name: 'Whitehorse', iata: 'YXY', state: 'YT', country: 'CA', timezone: 'America/Whitehorse', displayName: 'Whitehorse (YXY)', aliases: ['Yukon'] },
  { name: 'Yellowknife', iata: 'YZF', state: 'NT', country: 'CA', timezone: 'America/Yellowknife', displayName: 'Yellowknife (YZF)', aliases: ['NWT'] },

  // ── Mexico ────────────────────────────────────────────────────────────────
  { name: 'Mexico City', iata: 'MEX', country: 'MX', timezone: 'America/Mexico_City', displayName: 'Mexico City (MEX)', aliases: ['CDMX', 'Ciudad de Mexico', 'DF'] },
  { name: 'Guadalajara', iata: 'GDL', country: 'MX', timezone: 'America/Mexico_City', displayName: 'Guadalajara (GDL)' },
  { name: 'Monterrey', iata: 'MTY', country: 'MX', timezone: 'America/Monterrey', displayName: 'Monterrey (MTY)' },
  { name: 'Cancun', iata: 'CUN', country: 'MX', timezone: 'America/Cancun', displayName: 'Cancun (CUN)', aliases: ['Cancún', 'Riviera Maya'] },
  { name: 'Tijuana', iata: 'TIJ', country: 'MX', timezone: 'America/Tijuana', displayName: 'Tijuana (TIJ)', aliases: ['TJ'] },
  { name: 'Los Cabos', iata: 'SJD', country: 'MX', timezone: 'America/Mazatlan', displayName: 'Los Cabos (SJD)', aliases: ['Cabo San Lucas', 'San Jose del Cabo', 'Cabo'] },
  { name: 'Puerto Vallarta', iata: 'PVR', country: 'MX', timezone: 'America/Mexico_City', displayName: 'Puerto Vallarta (PVR)' },
  { name: 'Mazatlan', iata: 'MZT', country: 'MX', timezone: 'America/Mazatlan', displayName: 'Mazatlan (MZT)', aliases: ['Mazatlán'] },
  { name: 'Oaxaca', iata: 'OAX', country: 'MX', timezone: 'America/Mexico_City', displayName: 'Oaxaca (OAX)' },
  { name: 'Merida', iata: 'MID', country: 'MX', timezone: 'America/Merida', displayName: 'Merida (MID)', aliases: ['Mérida', 'Yucatan'] },
  { name: 'Acapulco', iata: 'ACA', country: 'MX', timezone: 'America/Mexico_City', displayName: 'Acapulco (ACA)' },

  // ── Central America ───────────────────────────────────────────────────────
  { name: 'Guatemala City', iata: 'GUA', country: 'GT', timezone: 'America/Guatemala', displayName: 'Guatemala City (GUA)' },
  { name: 'San José', iata: 'SJO', country: 'CR', timezone: 'America/Costa_Rica', displayName: 'San José (SJO)', aliases: ['San Jose', 'Costa Rica'] },
  { name: 'Panama City', iata: 'PTY', country: 'PA', timezone: 'America/Panama', displayName: 'Panama City, PA (PTY)', aliases: ['Tocumen'] },
  { name: 'Managua', iata: 'MGA', country: 'NI', timezone: 'America/Managua', displayName: 'Managua (MGA)', aliases: ['Nicaragua'] },
  { name: 'San Salvador', iata: 'SAL', country: 'SV', timezone: 'America/El_Salvador', displayName: 'San Salvador (SAL)', aliases: ['El Salvador'] },

  // ── Caribbean ─────────────────────────────────────────────────────────────
  { name: 'Havana', iata: 'HAV', country: 'CU', timezone: 'America/Havana', displayName: 'Havana (HAV)' },
  { name: 'Montego Bay', iata: 'MBJ', country: 'JM', timezone: 'America/Jamaica', displayName: 'Montego Bay (MBJ)', aliases: ['Jamaica'] },
  { name: 'Kingston', iata: 'KIN', country: 'JM', timezone: 'America/Jamaica', displayName: 'Kingston (KIN)' },
  { name: 'Punta Cana', iata: 'PUJ', country: 'DO', timezone: 'America/Santo_Domingo', displayName: 'Punta Cana (PUJ)', aliases: ['Dominican Republic'] },
  { name: 'Santo Domingo', iata: 'SDQ', country: 'DO', timezone: 'America/Santo_Domingo', displayName: 'Santo Domingo (SDQ)' },
  { name: 'San Juan', iata: 'SJU', country: 'PR', timezone: 'America/Puerto_Rico', displayName: 'San Juan (SJU)', aliases: ['Puerto Rico'] },
  { name: 'Nassau', iata: 'NAS', country: 'BS', timezone: 'America/Nassau', displayName: 'Nassau (NAS)', aliases: ['Bahamas'] },
  { name: 'Bridgetown', iata: 'BGI', country: 'BB', timezone: 'America/Barbados', displayName: 'Bridgetown (BGI)', aliases: ['Barbados'] },
  { name: 'Aruba', iata: 'AUA', country: 'AW', timezone: 'America/Aruba', displayName: 'Aruba (AUA)', aliases: ['Oranjestad'] },
  { name: 'Turks and Caicos', iata: 'PLS', country: 'TC', timezone: 'America/Grand_Turk', displayName: 'Turks & Caicos (PLS)', aliases: ['Providenciales', 'Provo', 'TCI'] },
  { name: 'Saint Martin', iata: 'SXM', country: 'SX', timezone: 'America/Lower_Princes', displayName: 'Sint Maarten (SXM)', aliases: ['St. Maarten', 'St. Martin'] },

  // ── Europe: British Isles ─────────────────────────────────────────────────
  { name: 'London', iata: 'LHR', country: 'GB', timezone: 'Europe/London', displayName: 'London (LHR)', aliases: ['Heathrow', 'London Heathrow'] },
  { name: 'London', iata: 'LGW', country: 'GB', timezone: 'Europe/London', displayName: 'London Gatwick (LGW)', aliases: ['Gatwick', 'London Gatwick'] },
  { name: 'London Stansted', iata: 'STN', country: 'GB', timezone: 'Europe/London', displayName: 'London Stansted (STN)', aliases: ['Stansted', 'London'] },
  { name: 'London Luton', iata: 'LTN', country: 'GB', timezone: 'Europe/London', displayName: 'London Luton (LTN)', aliases: ['Luton', 'London'] },
  { name: 'Edinburgh', iata: 'EDI', country: 'GB', timezone: 'Europe/London', displayName: 'Edinburgh (EDI)', aliases: ['Scotland'] },
  { name: 'Glasgow', iata: 'GLA', country: 'GB', timezone: 'Europe/London', displayName: 'Glasgow (GLA)', aliases: ['Scotland'] },
  { name: 'Manchester', iata: 'MAN', country: 'GB', timezone: 'Europe/London', displayName: 'Manchester, UK (MAN)' },
  { name: 'Birmingham', iata: 'BHX', country: 'GB', timezone: 'Europe/London', displayName: 'Birmingham, UK (BHX)' },
  { name: 'Bristol', iata: 'BRS', country: 'GB', timezone: 'Europe/London', displayName: 'Bristol (BRS)' },
  { name: 'Dublin', iata: 'DUB', country: 'IE', timezone: 'Europe/Dublin', displayName: 'Dublin (DUB)', aliases: ['Ireland'] },
  { name: 'Shannon', iata: 'SNN', country: 'IE', timezone: 'Europe/Dublin', displayName: 'Shannon (SNN)' },
  { name: 'Belfast', iata: 'BFS', country: 'GB', timezone: 'Europe/London', displayName: 'Belfast (BFS)', aliases: ['Northern Ireland'] },

  // ── Europe: Western ───────────────────────────────────────────────────────
  { name: 'Paris', iata: 'CDG', country: 'FR', timezone: 'Europe/Paris', displayName: 'Paris (CDG)', aliases: ['Charles de Gaulle', 'de Gaulle', 'Roissy'] },
  { name: 'Paris', iata: 'ORY', country: 'FR', timezone: 'Europe/Paris', displayName: 'Paris Orly (ORY)', aliases: ['Orly'] },
  { name: 'Lyon', iata: 'LYS', country: 'FR', timezone: 'Europe/Paris', displayName: 'Lyon (LYS)' },
  { name: 'Marseille', iata: 'MRS', country: 'FR', timezone: 'Europe/Paris', displayName: 'Marseille (MRS)' },
  { name: 'Nice', iata: 'NCE', country: 'FR', timezone: 'Europe/Paris', displayName: 'Nice (NCE)', aliases: ["Côte d'Azur", 'French Riviera'] },
  { name: 'Toulouse', iata: 'TLS', country: 'FR', timezone: 'Europe/Paris', displayName: 'Toulouse (TLS)' },
  { name: 'Bordeaux', iata: 'BOD', country: 'FR', timezone: 'Europe/Paris', displayName: 'Bordeaux (BOD)' },
  { name: 'Strasbourg', iata: 'SXB', country: 'FR', timezone: 'Europe/Paris', displayName: 'Strasbourg (SXB)' },
  { name: 'Nantes', iata: 'NTE', country: 'FR', timezone: 'Europe/Paris', displayName: 'Nantes (NTE)' },
  { name: 'Amsterdam', iata: 'AMS', country: 'NL', timezone: 'Europe/Amsterdam', displayName: 'Amsterdam (AMS)', aliases: ['Schiphol', 'Netherlands'] },
  { name: 'Brussels', iata: 'BRU', country: 'BE', timezone: 'Europe/Brussels', displayName: 'Brussels (BRU)', aliases: ['Zaventem', 'Belgium'] },
  { name: 'Zurich', iata: 'ZRH', country: 'CH', timezone: 'Europe/Zurich', displayName: 'Zurich (ZRH)', aliases: ['Switzerland'] },
  { name: 'Geneva', iata: 'GVA', country: 'CH', timezone: 'Europe/Zurich', displayName: 'Geneva (GVA)', aliases: ['Genève'] },
  { name: 'Lisbon', iata: 'LIS', country: 'PT', timezone: 'Europe/Lisbon', displayName: 'Lisbon (LIS)', aliases: ['Lisboa', 'Portugal'] },
  { name: 'Porto', iata: 'OPO', country: 'PT', timezone: 'Europe/Lisbon', displayName: 'Porto (OPO)', aliases: ['Oporto'] },
  { name: 'Madrid', iata: 'MAD', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Madrid (MAD)', aliases: ['Barajas', 'Spain'] },
  { name: 'Barcelona', iata: 'BCN', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Barcelona (BCN)' },
  { name: 'Seville', iata: 'SVQ', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Seville (SVQ)', aliases: ['Sevilla'] },
  { name: 'Valencia', iata: 'VLC', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Valencia (VLC)' },
  { name: 'Malaga', iata: 'AGP', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Malaga (AGP)', aliases: ['Málaga', 'Costa del Sol'] },
  { name: 'Palma', iata: 'PMI', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Palma (PMI)', aliases: ['Mallorca', 'Majorca'] },
  { name: 'Ibiza', iata: 'IBZ', country: 'ES', timezone: 'Europe/Madrid', displayName: 'Ibiza (IBZ)', aliases: ['Eivissa'] },

  // ── Europe: German-speaking ───────────────────────────────────────────────
  { name: 'Frankfurt', iata: 'FRA', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Frankfurt (FRA)', aliases: ['Rhein-Main', 'Germany'] },
  { name: 'Munich', iata: 'MUC', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Munich (MUC)', aliases: ['München', 'Bavaria'] },
  { name: 'Berlin', iata: 'BER', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Berlin (BER)', aliases: ['Brandenburg'] },
  { name: 'Hamburg', iata: 'HAM', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Hamburg (HAM)' },
  { name: 'Dusseldorf', iata: 'DUS', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Dusseldorf (DUS)', aliases: ['Düsseldorf'] },
  { name: 'Cologne', iata: 'CGN', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Cologne (CGN)', aliases: ['Köln', 'Bonn'] },
  { name: 'Stuttgart', iata: 'STR', country: 'DE', timezone: 'Europe/Berlin', displayName: 'Stuttgart (STR)' },
  { name: 'Vienna', iata: 'VIE', country: 'AT', timezone: 'Europe/Vienna', displayName: 'Vienna (VIE)', aliases: ['Wien', 'Austria'] },
  { name: 'Salzburg', iata: 'SZG', country: 'AT', timezone: 'Europe/Vienna', displayName: 'Salzburg (SZG)' },
  { name: 'Innsbruck', iata: 'INN', country: 'AT', timezone: 'Europe/Vienna', displayName: 'Innsbruck (INN)' },

  // ── Europe: Italian Peninsula ─────────────────────────────────────────────
  { name: 'Rome', iata: 'FCO', country: 'IT', timezone: 'Europe/Rome', displayName: 'Rome (FCO)', aliases: ['Fiumicino', 'Roma', 'Italy'] },
  { name: 'Milan', iata: 'MXP', country: 'IT', timezone: 'Europe/Rome', displayName: 'Milan (MXP)', aliases: ['Malpensa', 'Milano', 'LIN', 'BGY', 'Linate'] },
  { name: 'Venice', iata: 'VCE', country: 'IT', timezone: 'Europe/Rome', displayName: 'Venice (VCE)', aliases: ['Marco Polo', 'Venezia'] },
  { name: 'Florence', iata: 'FLR', country: 'IT', timezone: 'Europe/Rome', displayName: 'Florence (FLR)', aliases: ['Firenze'] },
  { name: 'Naples', iata: 'NAP', country: 'IT', timezone: 'Europe/Rome', displayName: 'Naples (NAP)', aliases: ['Napoli'] },
  { name: 'Bologna', iata: 'BLQ', country: 'IT', timezone: 'Europe/Rome', displayName: 'Bologna (BLQ)' },
  { name: 'Palermo', iata: 'PMO', country: 'IT', timezone: 'Europe/Rome', displayName: 'Palermo (PMO)', aliases: ['Sicily'] },

  // ── Europe: Nordic ────────────────────────────────────────────────────────
  { name: 'Stockholm', iata: 'ARN', country: 'SE', timezone: 'Europe/Stockholm', displayName: 'Stockholm (ARN)', aliases: ['Arlanda', 'Sweden'] },
  { name: 'Gothenburg', iata: 'GOT', country: 'SE', timezone: 'Europe/Stockholm', displayName: 'Gothenburg (GOT)', aliases: ['Göteborg'] },
  { name: 'Oslo', iata: 'OSL', country: 'NO', timezone: 'Europe/Oslo', displayName: 'Oslo (OSL)', aliases: ['Gardermoen', 'Norway'] },
  { name: 'Bergen', iata: 'BGO', country: 'NO', timezone: 'Europe/Oslo', displayName: 'Bergen (BGO)' },
  { name: 'Copenhagen', iata: 'CPH', country: 'DK', timezone: 'Europe/Copenhagen', displayName: 'Copenhagen (CPH)', aliases: ['Kastrup', 'Denmark'] },
  { name: 'Helsinki', iata: 'HEL', country: 'FI', timezone: 'Europe/Helsinki', displayName: 'Helsinki (HEL)', aliases: ['Vantaa', 'Finland'] },
  { name: 'Reykjavik', iata: 'KEF', country: 'IS', timezone: 'Atlantic/Reykjavik', displayName: 'Reykjavik (KEF)', aliases: ['Keflavik', 'Iceland'] },

  // ── Europe: Eastern ───────────────────────────────────────────────────────
  { name: 'Warsaw', iata: 'WAW', country: 'PL', timezone: 'Europe/Warsaw', displayName: 'Warsaw (WAW)', aliases: ['Chopin', 'Poland'] },
  { name: 'Krakow', iata: 'KRK', country: 'PL', timezone: 'Europe/Warsaw', displayName: 'Krakow (KRK)', aliases: ['Kraków'] },
  { name: 'Prague', iata: 'PRG', country: 'CZ', timezone: 'Europe/Prague', displayName: 'Prague (PRG)', aliases: ['Praha', 'Czech Republic', 'Czechia'] },
  { name: 'Budapest', iata: 'BUD', country: 'HU', timezone: 'Europe/Budapest', displayName: 'Budapest (BUD)', aliases: ['Hungary'] },
  { name: 'Bucharest', iata: 'OTP', country: 'RO', timezone: 'Europe/Bucharest', displayName: 'Bucharest (OTP)', aliases: ['Romania'] },
  { name: 'Athens', iata: 'ATH', country: 'GR', timezone: 'Europe/Athens', displayName: 'Athens (ATH)', aliases: ['Greece'] },
  { name: 'Sofia', iata: 'SOF', country: 'BG', timezone: 'Europe/Sofia', displayName: 'Sofia (SOF)', aliases: ['Bulgaria'] },
  { name: 'Belgrade', iata: 'BEG', country: 'RS', timezone: 'Europe/Belgrade', displayName: 'Belgrade (BEG)', aliases: ['Serbia'] },
  { name: 'Zagreb', iata: 'ZAG', country: 'HR', timezone: 'Europe/Zagreb', displayName: 'Zagreb (ZAG)', aliases: ['Croatia'] },
  { name: 'Dubrovnik', iata: 'DBV', country: 'HR', timezone: 'Europe/Zagreb', displayName: 'Dubrovnik (DBV)' },
  { name: 'Split', iata: 'SPU', country: 'HR', timezone: 'Europe/Zagreb', displayName: 'Split (SPU)', aliases: ['Dalmatia'] },
  { name: 'Ljubljana', iata: 'LJU', country: 'SI', timezone: 'Europe/Ljubljana', displayName: 'Ljubljana (LJU)', aliases: ['Slovenia'] },
  { name: 'Bratislava', iata: 'BTS', country: 'SK', timezone: 'Europe/Bratislava', displayName: 'Bratislava (BTS)', aliases: ['Slovakia'] },
  { name: 'Riga', iata: 'RIX', country: 'LV', timezone: 'Europe/Riga', displayName: 'Riga (RIX)', aliases: ['Latvia'] },
  { name: 'Vilnius', iata: 'VNO', country: 'LT', timezone: 'Europe/Vilnius', displayName: 'Vilnius (VNO)', aliases: ['Lithuania'] },
  { name: 'Tallinn', iata: 'TLL', country: 'EE', timezone: 'Europe/Tallinn', displayName: 'Tallinn (TLL)', aliases: ['Estonia'] },
  { name: 'Kyiv', iata: 'KBP', country: 'UA', timezone: 'Europe/Kyiv', displayName: 'Kyiv (KBP)', aliases: ['Kiev', 'Ukraine'] },
  { name: 'Sarajevo', iata: 'SJJ', country: 'BA', timezone: 'Europe/Sarajevo', displayName: 'Sarajevo (SJJ)', aliases: ['Bosnia'] },
  { name: 'Istanbul', iata: 'IST', country: 'TR', timezone: 'Europe/Istanbul', displayName: 'Istanbul (IST)', aliases: ['Ataturk', 'SAW', 'Turkey'] },
  { name: 'Ankara', iata: 'ESB', country: 'TR', timezone: 'Europe/Istanbul', displayName: 'Ankara (ESB)' },
  { name: 'Antalya', iata: 'AYT', country: 'TR', timezone: 'Europe/Istanbul', displayName: 'Antalya (AYT)', aliases: ['Turkish Riviera'] },
  { name: 'Moscow', iata: 'SVO', country: 'RU', timezone: 'Europe/Moscow', displayName: 'Moscow (SVO)', aliases: ['Sheremetyevo', 'DME', 'VKO', 'Russia'] },
  { name: 'Saint Petersburg', iata: 'LED', country: 'RU', timezone: 'Europe/Moscow', displayName: 'St. Petersburg (LED)', aliases: ['Pulkovo', 'Saint Petersburg'] },

  // ── Middle East ───────────────────────────────────────────────────────────
  { name: 'Dubai', iata: 'DXB', country: 'AE', timezone: 'Asia/Dubai', displayName: 'Dubai (DXB)', aliases: ['UAE', 'United Arab Emirates'] },
  { name: 'Abu Dhabi', iata: 'AUH', country: 'AE', timezone: 'Asia/Dubai', displayName: 'Abu Dhabi (AUH)' },
  { name: 'Doha', iata: 'DOH', country: 'QA', timezone: 'Asia/Qatar', displayName: 'Doha (DOH)', aliases: ['Hamad', 'Qatar'] },
  { name: 'Riyadh', iata: 'RUH', country: 'SA', timezone: 'Asia/Riyadh', displayName: 'Riyadh (RUH)', aliases: ['Saudi Arabia'] },
  { name: 'Jeddah', iata: 'JED', country: 'SA', timezone: 'Asia/Riyadh', displayName: 'Jeddah (JED)', aliases: ['Mecca', 'Makkah'] },
  { name: 'Dammam', iata: 'DMM', country: 'SA', timezone: 'Asia/Riyadh', displayName: 'Dammam (DMM)', aliases: ['Dhahran', 'Eastern Province'] },
  { name: 'Kuwait City', iata: 'KWI', country: 'KW', timezone: 'Asia/Kuwait', displayName: 'Kuwait City (KWI)', aliases: ['Kuwait'] },
  { name: 'Muscat', iata: 'MCT', country: 'OM', timezone: 'Asia/Muscat', displayName: 'Muscat (MCT)', aliases: ['Oman'] },
  { name: 'Manama', iata: 'BAH', country: 'BH', timezone: 'Asia/Bahrain', displayName: 'Manama (BAH)', aliases: ['Bahrain'] },
  { name: 'Amman', iata: 'AMM', country: 'JO', timezone: 'Asia/Amman', displayName: 'Amman (AMM)', aliases: ['Jordan'] },
  { name: 'Tel Aviv', iata: 'TLV', country: 'IL', timezone: 'Asia/Jerusalem', displayName: 'Tel Aviv (TLV)', aliases: ['Ben Gurion', 'Israel'] },
  { name: 'Beirut', iata: 'BEY', country: 'LB', timezone: 'Asia/Beirut', displayName: 'Beirut (BEY)', aliases: ['Lebanon'] },
  { name: 'Tehran', iata: 'IKA', country: 'IR', timezone: 'Asia/Tehran', displayName: 'Tehran (IKA)', aliases: ['Iran', 'THR'] },
  { name: 'Baghdad', iata: 'BGW', country: 'IQ', timezone: 'Asia/Baghdad', displayName: 'Baghdad (BGW)', aliases: ['Iraq'] },

  // ── Asia: East ────────────────────────────────────────────────────────────
  { name: 'Tokyo', iata: 'NRT', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Tokyo (NRT)', aliases: ['Narita', 'Narita Airport', 'Japan'] },
  { name: 'Tokyo', iata: 'HND', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Tokyo Haneda (HND)', aliases: ['Haneda', 'Haneda Airport'] },
  { name: 'Osaka', iata: 'KIX', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Osaka (KIX)', aliases: ['Kansai', 'ITM'] },
  { name: 'Nagoya', iata: 'NGO', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Nagoya (NGO)', aliases: ['Chubu'] },
  { name: 'Fukuoka', iata: 'FUK', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Fukuoka (FUK)' },
  { name: 'Sapporo', iata: 'CTS', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Sapporo (CTS)', aliases: ['New Chitose', 'Hokkaido'] },
  { name: 'Okinawa', iata: 'OKA', country: 'JP', timezone: 'Asia/Tokyo', displayName: 'Okinawa (OKA)', aliases: ['Naha', 'Ryukyu'] },
  { name: 'Kyoto', country: 'JP', timezone: 'Asia/Tokyo', aliases: ['Kansai', 'Japan'] },
  { name: 'Beijing', iata: 'PEK', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Beijing (PEK)', aliases: ['Capital Airport', 'PKX', 'Daxing', 'Peking', 'China'] },
  { name: 'Shanghai', iata: 'PVG', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Shanghai (PVG)', aliases: ['Pudong', 'SHA', 'Hongqiao'] },
  { name: 'Guangzhou', iata: 'CAN', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Guangzhou (CAN)', aliases: ['Canton', 'Baiyun'] },
  { name: 'Shenzhen', iata: 'SZX', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Shenzhen (SZX)' },
  { name: 'Chengdu', iata: 'CTU', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Chengdu (CTU)', aliases: ['Tianfu'] },
  { name: 'Chongqing', iata: 'CKG', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Chongqing (CKG)' },
  { name: 'Hangzhou', iata: 'HGH', country: 'CN', timezone: 'Asia/Shanghai', displayName: 'Hangzhou (HGH)' },
  { name: 'Xian', iata: 'XIY', country: 'CN', timezone: 'Asia/Shanghai', displayName: "Xi'an (XIY)" },
  { name: 'Hong Kong', iata: 'HKG', country: 'HK', timezone: 'Asia/Hong_Kong', displayName: 'Hong Kong (HKG)' },
  { name: 'Seoul', iata: 'ICN', country: 'KR', timezone: 'Asia/Seoul', displayName: 'Seoul (ICN)', aliases: ['Incheon', 'South Korea', 'GMP'] },
  { name: 'Busan', iata: 'PUS', country: 'KR', timezone: 'Asia/Seoul', displayName: 'Busan (PUS)' },
  { name: 'Jeju', iata: 'CJU', country: 'KR', timezone: 'Asia/Seoul', displayName: 'Jeju (CJU)', aliases: ['Jeju Island'] },
  { name: 'Taipei', iata: 'TPE', country: 'TW', timezone: 'Asia/Taipei', displayName: 'Taipei (TPE)', aliases: ['Taoyuan', 'Taiwan'] },
  { name: 'Ulaanbaatar', iata: 'ULN', country: 'MN', timezone: 'Asia/Ulaanbaatar', displayName: 'Ulaanbaatar (ULN)', aliases: ['Mongolia'] },

  // ── Asia: Southeast ───────────────────────────────────────────────────────
  { name: 'Singapore', iata: 'SIN', country: 'SG', timezone: 'Asia/Singapore', displayName: 'Singapore (SIN)', aliases: ['Changi'] },
  { name: 'Bangkok', iata: 'BKK', country: 'TH', timezone: 'Asia/Bangkok', displayName: 'Bangkok (BKK)', aliases: ['Suvarnabhumi', 'DMK', 'Don Mueang', 'Thailand'] },
  { name: 'Chiang Mai', iata: 'CNX', country: 'TH', timezone: 'Asia/Bangkok', displayName: 'Chiang Mai (CNX)' },
  { name: 'Phuket', iata: 'HKT', country: 'TH', timezone: 'Asia/Bangkok', displayName: 'Phuket (HKT)' },
  { name: 'Kuala Lumpur', iata: 'KUL', country: 'MY', timezone: 'Asia/Kuala_Lumpur', displayName: 'Kuala Lumpur (KUL)', aliases: ['KLIA', 'Malaysia'] },
  { name: 'Jakarta', iata: 'CGK', country: 'ID', timezone: 'Asia/Jakarta', displayName: 'Jakarta (CGK)', aliases: ['Soekarno', 'Indonesia'] },
  { name: 'Bali', iata: 'DPS', country: 'ID', timezone: 'Asia/Makassar', displayName: 'Bali (DPS)', aliases: ['Denpasar', 'Ngurah Rai'] },
  { name: 'Manila', iata: 'MNL', country: 'PH', timezone: 'Asia/Manila', displayName: 'Manila (MNL)', aliases: ['NAIA', 'Philippines'] },
  { name: 'Ho Chi Minh City', iata: 'SGN', country: 'VN', timezone: 'Asia/Ho_Chi_Minh', displayName: 'Ho Chi Minh City (SGN)', aliases: ['Saigon', 'HCMC'] },
  { name: 'Hanoi', iata: 'HAN', country: 'VN', timezone: 'Asia/Ho_Chi_Minh', displayName: 'Hanoi (HAN)', aliases: ['Vietnam'] },
  { name: 'Da Nang', iata: 'DAD', country: 'VN', timezone: 'Asia/Ho_Chi_Minh', displayName: 'Da Nang (DAD)' },
  { name: 'Yangon', iata: 'RGN', country: 'MM', timezone: 'Asia/Yangon', displayName: 'Yangon (RGN)', aliases: ['Rangoon', 'Burma', 'Myanmar'] },
  { name: 'Phnom Penh', iata: 'PNH', country: 'KH', timezone: 'Asia/Phnom_Penh', displayName: 'Phnom Penh (PNH)', aliases: ['Cambodia'] },
  { name: 'Siem Reap', iata: 'REP', country: 'KH', timezone: 'Asia/Phnom_Penh', displayName: 'Siem Reap (REP)', aliases: ['Angkor Wat'] },
  { name: 'Vientiane', iata: 'VTE', country: 'LA', timezone: 'Asia/Vientiane', displayName: 'Vientiane (VTE)', aliases: ['Laos'] },

  // ── Asia: South ───────────────────────────────────────────────────────────
  { name: 'Mumbai', iata: 'BOM', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Mumbai (BOM)', aliases: ['Bombay', 'India'] },
  { name: 'Delhi', iata: 'DEL', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Delhi (DEL)', aliases: ['New Delhi', 'NCR'] },
  { name: 'Bangalore', iata: 'BLR', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Bangalore (BLR)', aliases: ['Bengaluru'] },
  { name: 'Hyderabad', iata: 'HYD', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Hyderabad (HYD)' },
  { name: 'Chennai', iata: 'MAA', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Chennai (MAA)', aliases: ['Madras'] },
  { name: 'Kolkata', iata: 'CCU', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Kolkata (CCU)', aliases: ['Calcutta'] },
  { name: 'Pune', iata: 'PNQ', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Pune (PNQ)' },
  { name: 'Ahmedabad', iata: 'AMD', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Ahmedabad (AMD)', aliases: ['Gujarat'] },
  { name: 'Jaipur', iata: 'JAI', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Jaipur (JAI)', aliases: ['Pink City', 'Rajasthan'] },
  { name: 'Kochi', iata: 'COK', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Kochi (COK)', aliases: ['Cochin', 'Kerala'] },
  { name: 'Goa', iata: 'GOI', country: 'IN', timezone: 'Asia/Kolkata', displayName: 'Goa (GOI)', aliases: ['Dabolim', 'Mopa'] },
  { name: 'Dhaka', iata: 'DAC', country: 'BD', timezone: 'Asia/Dhaka', displayName: 'Dhaka (DAC)', aliases: ['Bangladesh'] },
  { name: 'Kathmandu', iata: 'KTM', country: 'NP', timezone: 'Asia/Kathmandu', displayName: 'Kathmandu (KTM)', aliases: ['Nepal'] },
  { name: 'Colombo', iata: 'CMB', country: 'LK', timezone: 'Asia/Colombo', displayName: 'Colombo (CMB)', aliases: ['Sri Lanka'] },
  { name: 'Karachi', iata: 'KHI', country: 'PK', timezone: 'Asia/Karachi', displayName: 'Karachi (KHI)', aliases: ['Pakistan'] },
  { name: 'Lahore', iata: 'LHE', country: 'PK', timezone: 'Asia/Karachi', displayName: 'Lahore (LHE)' },
  { name: 'Islamabad', iata: 'ISB', country: 'PK', timezone: 'Asia/Karachi', displayName: 'Islamabad (ISB)' },
  { name: 'Kabul', iata: 'KBL', country: 'AF', timezone: 'Asia/Kabul', displayName: 'Kabul (KBL)', aliases: ['Afghanistan'] },
  { name: 'Tashkent', iata: 'TAS', country: 'UZ', timezone: 'Asia/Tashkent', displayName: 'Tashkent (TAS)', aliases: ['Uzbekistan'] },
  { name: 'Almaty', iata: 'ALA', country: 'KZ', timezone: 'Asia/Almaty', displayName: 'Almaty (ALA)', aliases: ['Kazakhstan'] },
  { name: 'Tbilisi', iata: 'TBS', country: 'GE', timezone: 'Asia/Tbilisi', displayName: 'Tbilisi (TBS)', aliases: ['Georgia'] },
  { name: 'Yerevan', iata: 'EVN', country: 'AM', timezone: 'Asia/Yerevan', displayName: 'Yerevan (EVN)', aliases: ['Armenia'] },
  { name: 'Baku', iata: 'GYD', country: 'AZ', timezone: 'Asia/Baku', displayName: 'Baku (GYD)', aliases: ['Azerbaijan'] },

  // ── Oceania ───────────────────────────────────────────────────────────────
  { name: 'Sydney', iata: 'SYD', country: 'AU', timezone: 'Australia/Sydney', displayName: 'Sydney (SYD)', aliases: ['Australia', 'NSW'] },
  { name: 'Melbourne', iata: 'MEL', country: 'AU', timezone: 'Australia/Melbourne', displayName: 'Melbourne (MEL)', aliases: ['Tullamarine'] },
  { name: 'Brisbane', iata: 'BNE', country: 'AU', timezone: 'Australia/Brisbane', displayName: 'Brisbane (BNE)', aliases: ['Queensland'] },
  { name: 'Perth', iata: 'PER', country: 'AU', timezone: 'Australia/Perth', displayName: 'Perth (PER)', aliases: ['Western Australia'] },
  { name: 'Adelaide', iata: 'ADL', country: 'AU', timezone: 'Australia/Adelaide', displayName: 'Adelaide (ADL)' },
  { name: 'Cairns', iata: 'CNS', country: 'AU', timezone: 'Australia/Brisbane', displayName: 'Cairns (CNS)', aliases: ['Great Barrier Reef'] },
  { name: 'Gold Coast', iata: 'OOL', country: 'AU', timezone: 'Australia/Brisbane', displayName: 'Gold Coast (OOL)', aliases: ['Coolangatta', 'Surfers Paradise'] },
  { name: 'Darwin', iata: 'DRW', country: 'AU', timezone: 'Australia/Darwin', displayName: 'Darwin (DRW)' },
  { name: 'Canberra', iata: 'CBR', country: 'AU', timezone: 'Australia/Sydney', displayName: 'Canberra (CBR)' },
  { name: 'Auckland', iata: 'AKL', country: 'NZ', timezone: 'Pacific/Auckland', displayName: 'Auckland (AKL)', aliases: ['New Zealand'] },
  { name: 'Wellington', iata: 'WLG', country: 'NZ', timezone: 'Pacific/Auckland', displayName: 'Wellington (WLG)' },
  { name: 'Christchurch', iata: 'CHC', country: 'NZ', timezone: 'Pacific/Auckland', displayName: 'Christchurch (CHC)' },
  { name: 'Queenstown', iata: 'ZQN', country: 'NZ', timezone: 'Pacific/Auckland', displayName: 'Queenstown (ZQN)' },
  { name: 'Nadi', iata: 'NAN', country: 'FJ', timezone: 'Pacific/Fiji', displayName: 'Nadi (NAN)', aliases: ['Fiji', 'Suva'] },
  { name: 'Guam', iata: 'GUM', country: 'GU', timezone: 'Pacific/Guam', displayName: 'Guam (GUM)' },
  { name: 'Papeete', iata: 'PPT', country: 'PF', timezone: 'Pacific/Tahiti', displayName: 'Papeete (PPT)', aliases: ['Tahiti', 'French Polynesia'] },

  // ── Africa: North ─────────────────────────────────────────────────────────
  { name: 'Cairo', iata: 'CAI', country: 'EG', timezone: 'Africa/Cairo', displayName: 'Cairo (CAI)', aliases: ['Egypt'] },
  { name: 'Casablanca', iata: 'CMN', country: 'MA', timezone: 'Africa/Casablanca', displayName: 'Casablanca (CMN)', aliases: ['Morocco'] },
  { name: 'Marrakech', iata: 'RAK', country: 'MA', timezone: 'Africa/Casablanca', displayName: 'Marrakech (RAK)', aliases: ['Marrakesh'] },
  { name: 'Tunis', iata: 'TUN', country: 'TN', timezone: 'Africa/Tunis', displayName: 'Tunis (TUN)', aliases: ['Tunisia'] },
  { name: 'Algiers', iata: 'ALG', country: 'DZ', timezone: 'Africa/Algiers', displayName: 'Algiers (ALG)', aliases: ['Algeria'] },

  // ── Africa: West & Central ────────────────────────────────────────────────
  { name: 'Lagos', iata: 'LOS', country: 'NG', timezone: 'Africa/Lagos', displayName: 'Lagos (LOS)', aliases: ['Nigeria'] },
  { name: 'Abuja', iata: 'ABV', country: 'NG', timezone: 'Africa/Lagos', displayName: 'Abuja (ABV)' },
  { name: 'Accra', iata: 'ACC', country: 'GH', timezone: 'Africa/Accra', displayName: 'Accra (ACC)', aliases: ['Ghana'] },
  { name: 'Dakar', iata: 'DSS', country: 'SN', timezone: 'Africa/Dakar', displayName: 'Dakar (DSS)', aliases: ['Senegal', 'DKR'] },
  { name: 'Abidjan', iata: 'ABJ', country: 'CI', timezone: 'Africa/Abidjan', displayName: 'Abidjan (ABJ)', aliases: ['Ivory Coast'] },
  { name: 'Douala', iata: 'DLA', country: 'CM', timezone: 'Africa/Douala', displayName: 'Douala (DLA)', aliases: ['Cameroon'] },
  { name: 'Kinshasa', iata: 'FIH', country: 'CD', timezone: 'Africa/Kinshasa', displayName: 'Kinshasa (FIH)', aliases: ['DRC', 'Congo'] },
  { name: 'Luanda', iata: 'LAD', country: 'AO', timezone: 'Africa/Luanda', displayName: 'Luanda (LAD)', aliases: ['Angola'] },

  // ── Africa: East & South ──────────────────────────────────────────────────
  { name: 'Nairobi', iata: 'NBO', country: 'KE', timezone: 'Africa/Nairobi', displayName: 'Nairobi (NBO)', aliases: ['Kenya', 'Jomo Kenyatta'] },
  { name: 'Addis Ababa', iata: 'ADD', country: 'ET', timezone: 'Africa/Addis_Ababa', displayName: 'Addis Ababa (ADD)', aliases: ['Ethiopia'] },
  { name: 'Dar es Salaam', iata: 'DAR', country: 'TZ', timezone: 'Africa/Dar_es_Salaam', displayName: 'Dar es Salaam (DAR)', aliases: ['Tanzania'] },
  { name: 'Kampala', iata: 'EBB', country: 'UG', timezone: 'Africa/Kampala', displayName: 'Kampala (EBB)', aliases: ['Entebbe', 'Uganda'] },
  { name: 'Kigali', iata: 'KGL', country: 'RW', timezone: 'Africa/Kigali', displayName: 'Kigali (KGL)', aliases: ['Rwanda'] },
  { name: 'Johannesburg', iata: 'JNB', country: 'ZA', timezone: 'Africa/Johannesburg', displayName: 'Johannesburg (JNB)', aliases: ['South Africa', 'Joburg', 'OR Tambo'] },
  { name: 'Cape Town', iata: 'CPT', country: 'ZA', timezone: 'Africa/Johannesburg', displayName: 'Cape Town (CPT)' },
  { name: 'Durban', iata: 'DUR', country: 'ZA', timezone: 'Africa/Johannesburg', displayName: 'Durban (DUR)', aliases: ['King Shaka'] },

  // ── South America ─────────────────────────────────────────────────────────
  { name: 'São Paulo', iata: 'GRU', country: 'BR', timezone: 'America/Sao_Paulo', displayName: 'São Paulo (GRU)', aliases: ['Guarulhos', 'CGH', 'Sao Paulo', 'Brazil'] },
  { name: 'Rio de Janeiro', iata: 'GIG', country: 'BR', timezone: 'America/Sao_Paulo', displayName: 'Rio de Janeiro (GIG)', aliases: ['Galeao', 'SDU', 'Rio'] },
  { name: 'Brasilia', iata: 'BSB', country: 'BR', timezone: 'America/Sao_Paulo', displayName: 'Brasilia (BSB)', aliases: ['Brasília'] },
  { name: 'Belo Horizonte', iata: 'CNF', country: 'BR', timezone: 'America/Sao_Paulo', displayName: 'Belo Horizonte (CNF)', aliases: ['BH', 'Confins'] },
  { name: 'Salvador', iata: 'SSA', country: 'BR', timezone: 'America/Bahia', displayName: 'Salvador (SSA)', aliases: ['Bahia'] },
  { name: 'Recife', iata: 'REC', country: 'BR', timezone: 'America/Recife', displayName: 'Recife (REC)' },
  { name: 'Fortaleza', iata: 'FOR', country: 'BR', timezone: 'America/Fortaleza', displayName: 'Fortaleza (FOR)' },
  { name: 'Buenos Aires', iata: 'EZE', country: 'AR', timezone: 'America/Argentina/Buenos_Aires', displayName: 'Buenos Aires (EZE)', aliases: ['Ezeiza', 'AEP', 'Argentina'] },
  { name: 'Cordoba', iata: 'COR', country: 'AR', timezone: 'America/Argentina/Cordoba', displayName: 'Cordoba (COR)', aliases: ['Córdoba'] },
  { name: 'Mendoza', iata: 'MDZ', country: 'AR', timezone: 'America/Argentina/Mendoza', displayName: 'Mendoza (MDZ)' },
  { name: 'Santiago', iata: 'SCL', country: 'CL', timezone: 'America/Santiago', displayName: 'Santiago (SCL)', aliases: ['Chile'] },
  { name: 'Lima', iata: 'LIM', country: 'PE', timezone: 'America/Lima', displayName: 'Lima (LIM)', aliases: ['Peru'] },
  { name: 'Cusco', iata: 'CUZ', country: 'PE', timezone: 'America/Lima', displayName: 'Cusco (CUZ)', aliases: ['Machu Picchu', 'Cuzco'] },
  { name: 'Bogota', iata: 'BOG', country: 'CO', timezone: 'America/Bogota', displayName: 'Bogota (BOG)', aliases: ['Bogotá', 'El Dorado', 'Colombia'] },
  { name: 'Medellin', iata: 'MDE', country: 'CO', timezone: 'America/Bogota', displayName: 'Medellin (MDE)', aliases: ['Medellín', 'Rionegro'] },
  { name: 'Cartagena', iata: 'CTG', country: 'CO', timezone: 'America/Bogota', displayName: 'Cartagena (CTG)' },
  { name: 'Cali', iata: 'CLO', country: 'CO', timezone: 'America/Bogota', displayName: 'Cali (CLO)' },
  { name: 'Caracas', iata: 'CCS', country: 'VE', timezone: 'America/Caracas', displayName: 'Caracas (CCS)', aliases: ['Venezuela'] },
  { name: 'Quito', iata: 'UIO', country: 'EC', timezone: 'America/Guayaquil', displayName: 'Quito (UIO)', aliases: ['Ecuador'] },
  { name: 'Guayaquil', iata: 'GYE', country: 'EC', timezone: 'America/Guayaquil', displayName: 'Guayaquil (GYE)' },
  { name: 'La Paz', iata: 'LPB', country: 'BO', timezone: 'America/La_Paz', displayName: 'La Paz (LPB)', aliases: ['Bolivia'] },
  { name: 'Asuncion', iata: 'ASU', country: 'PY', timezone: 'America/Asuncion', displayName: 'Asuncion (ASU)', aliases: ['Asunción', 'Paraguay'] },
  { name: 'Montevideo', iata: 'MVD', country: 'UY', timezone: 'America/Montevideo', displayName: 'Montevideo (MVD)', aliases: ['Uruguay'] },

  // ── Atlantic / Indian Ocean ────────────────────────────────────────────────
  { name: 'Funchal', iata: 'FNC', country: 'PT', timezone: 'Atlantic/Madeira', displayName: 'Funchal (FNC)', aliases: ['Madeira'] },
  { name: 'Las Palmas', iata: 'LPA', country: 'ES', timezone: 'Atlantic/Canary', displayName: 'Las Palmas (LPA)', aliases: ['Gran Canaria', 'Canary Islands'] },
  { name: 'Tenerife', iata: 'TFS', country: 'ES', timezone: 'Atlantic/Canary', displayName: 'Tenerife (TFS)', aliases: ['Canary Islands', 'TFN'] },
  { name: 'Male', iata: 'MLE', country: 'MV', timezone: 'Indian/Maldives', displayName: 'Male (MLE)', aliases: ['Maldives', 'Velana'] },
  { name: 'Mahe', iata: 'SEZ', country: 'SC', timezone: 'Indian/Mahe', displayName: 'Mahe (SEZ)', aliases: ['Seychelles'] },
  { name: 'Mauritius', iata: 'MRU', country: 'MU', timezone: 'Indian/Mauritius', displayName: 'Mauritius (MRU)', aliases: ['Port Louis'] },
];

// ── Search ────────────────────────────────────────────────────────────────────

export function searchCities(query: string, limit = 10): City[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim();
  const qLow = q.toLowerCase();
  const qNorm = normalize(q);
  if (qNorm.length === 0) return [];

  const results: Array<{ city: City; score: number }> = [];

  for (const city of CITIES) {
    let score = 0;

    // Exact IATA match → highest priority
    if (city.iata && city.iata.toLowerCase() === qLow) {
      score = 20;
    } else {
      const candidates = [
        city.name,
        city.displayName,
        city.state,
        ...(city.aliases ?? []),
      ].filter(Boolean) as string[];

      for (const c of candidates) {
        const cn = normalize(c);
        if (cn === qNorm) score = Math.max(score, 10);
        else if (cn.startsWith(qNorm)) score = Math.max(score, 4);
        else if (cn.includes(qNorm)) score = Math.max(score, 1);
      }

      // Bonus for primary name match
      const nameNorm = normalize(city.name);
      if (nameNorm === qNorm) score += 5;
      else if (nameNorm.startsWith(qNorm)) score += 2;
    }

    if (score > 0) results.push({ city, score });
  }

  results.sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name));
  return results.slice(0, limit).map(r => r.city);
}
