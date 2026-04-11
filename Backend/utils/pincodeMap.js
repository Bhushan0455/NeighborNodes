// ===== PINCODE TO COORDINATES MAPPING =====
// Each pincode maps to approximate center coordinates for that area.
// Add more pincodes as needed for your community coverage.

const PINCODE_COORDS = {
    // --- THANE DISTRICT ---
    "400601": { lat: 19.1964, lng: 72.9631, area: "Thane West" },
    "400602": { lat: 19.1860, lng: 72.9750, area: "Thane East" },
    "400603": { lat: 19.2183, lng: 72.9781, area: "Thane (Naupada)" },
    "400604": { lat: 19.2403, lng: 72.9710, area: "Thane (Wagle Estate)" },
    "400605": { lat: 19.2094, lng: 72.9870, area: "Thane (Kolshet)" },
    "400606": { lat: 19.2285, lng: 72.9645, area: "Thane (Pokharan)" },
    "400607": { lat: 19.2520, lng: 72.9680, area: "Thane (Manpada)" },
    "400610": { lat: 19.2590, lng: 72.9590, area: "Thane (Ghodbunder Road)" },

    // --- KALYAN / DOMBIVLI ---
    "421301": { lat: 19.2403, lng: 73.1305, area: "Kalyan West" },
    "421302": { lat: 19.2350, lng: 73.1450, area: "Kalyan East" },
    "421303": { lat: 19.2180, lng: 73.0900, area: "Dombivli West" },
    "421304": { lat: 19.2140, lng: 73.1000, area: "Dombivli East" },
    "421305": { lat: 19.2500, lng: 73.1600, area: "Ambernath West" },
    "421306": { lat: 19.2560, lng: 73.1850, area: "Ambernath East" },

    // --- NAVI MUMBAI ---
    "400701": { lat: 19.0330, lng: 73.0297, area: "Vashi" },
    "400703": { lat: 19.0178, lng: 73.0390, area: "Nerul" },
    "400705": { lat: 19.0470, lng: 73.0180, area: "Kopar Khairane" },
    "400706": { lat: 19.0625, lng: 73.0020, area: "Airoli" },
    "400708": { lat: 19.0730, lng: 73.0220, area: "Ghansoli" },
    "400709": { lat: 18.9950, lng: 73.0430, area: "Panvel" },
    "400710": { lat: 18.9700, lng: 73.1100, area: "Kharghar" },
    "410206": { lat: 18.9388, lng: 73.0865, area: "Panvel (New)" },
    "410210": { lat: 19.0000, lng: 73.0500, area: "Kamothe" },

    // --- MUMBAI CITY ---
    "400001": { lat: 18.9398, lng: 72.8355, area: "Fort / CST" },
    "400002": { lat: 18.9543, lng: 72.8321, area: "Kalbadevi" },
    "400003": { lat: 18.9580, lng: 72.8295, area: "Mandvi" },
    "400004": { lat: 18.9620, lng: 72.8317, area: "Girgaon" },
    "400007": { lat: 18.9750, lng: 72.8258, area: "Grant Road" },
    "400008": { lat: 18.9836, lng: 72.8210, area: "Mumbai Central" },
    "400010": { lat: 18.9988, lng: 72.8170, area: "Byculla" },
    "400012": { lat: 19.0120, lng: 72.8430, area: "Parel" },
    "400014": { lat: 19.0176, lng: 72.8562, area: "Dadar" },
    "400016": { lat: 19.0240, lng: 72.8420, area: "Mahim" },
    "400017": { lat: 19.0330, lng: 72.8350, area: "Dharavi" },
    "400018": { lat: 19.0380, lng: 72.8270, area: "Worli" },
    "400019": { lat: 19.0440, lng: 72.8560, area: "Sion" },
    "400020": { lat: 19.0510, lng: 72.8420, area: "Chunabhatti" },
    "400022": { lat: 19.0530, lng: 72.8310, area: "Matunga" },
    "400025": { lat: 19.0580, lng: 72.8200, area: "Prabhadevi" },
    "400028": { lat: 19.0630, lng: 72.8530, area: "Kurla" },

    // --- MUMBAI SUBURBS ---
    "400049": { lat: 19.0176, lng: 72.8562, area: "Bandra West" },
    "400050": { lat: 19.0596, lng: 72.8295, area: "Bandra East" },
    "400051": { lat: 19.0660, lng: 72.8390, area: "Khar" },
    "400052": { lat: 19.0760, lng: 72.8777, area: "Santacruz East" },
    "400053": { lat: 19.0888, lng: 72.8398, area: "Andheri West" },
    "400054": { lat: 19.0728, lng: 72.8347, area: "Santacruz West" },
    "400055": { lat: 19.0800, lng: 72.8650, area: "Andheri East" },
    "400056": { lat: 19.0869, lng: 72.8365, area: "Vile Parle West" },
    "400057": { lat: 19.0920, lng: 72.8575, area: "Vile Parle East" },
    "400058": { lat: 19.1000, lng: 72.8470, area: "Jogeshwari" },
    "400059": { lat: 19.0850, lng: 72.8900, area: "Chakala" },
    "400060": { lat: 19.1050, lng: 72.8630, area: "Jogeshwari East" },
    "400063": { lat: 19.1160, lng: 72.8780, area: "Goregaon East" },
    "400064": { lat: 19.1240, lng: 72.8560, area: "Malad West" },
    "400066": { lat: 19.1420, lng: 72.8740, area: "Goregaon" },
    "400067": { lat: 19.1540, lng: 72.8370, area: "Kandivali" },
    "400068": { lat: 19.1560, lng: 72.8580, area: "Dahisar" },
    "400069": { lat: 19.1200, lng: 72.8650, area: "Oshiwara" },
    "400072": { lat: 19.0720, lng: 72.8990, area: "Vikhroli" },
    "400076": { lat: 19.0660, lng: 72.9080, area: "Powai" },
    "400078": { lat: 19.0950, lng: 72.9070, area: "Bhandup" },
    "400080": { lat: 19.0820, lng: 72.9210, area: "Mulund" },
    "400086": { lat: 19.1350, lng: 72.9100, area: "Ghatkopar" },
    "400089": { lat: 19.1710, lng: 72.9500, area: "Borivali East" },
    "400092": { lat: 19.1070, lng: 72.9050, area: "Bhandup West" },
    "400093": { lat: 19.1150, lng: 72.8900, area: "Hiranandani" },
    "400097": { lat: 19.1580, lng: 72.8370, area: "Malad East" },
    "400101": { lat: 19.1400, lng: 72.8510, area: "Kandivali West" },
    "400104": { lat: 19.1830, lng: 72.8480, area: "Borivali West" },

    // --- MIRA-BHAYANDER ---
    "401101": { lat: 19.2800, lng: 72.8600, area: "Mira Road" },
    "401105": { lat: 19.2940, lng: 72.8530, area: "Bhayander West" },
    "401107": { lat: 19.3010, lng: 72.8700, area: "Bhayander East" },

    // --- VASAI / VIRAR ---
    "401201": { lat: 19.3607, lng: 72.8340, area: "Virar West" },
    "401202": { lat: 19.4559, lng: 72.8090, area: "Vasai West" },
    "401203": { lat: 19.3700, lng: 72.8500, area: "Virar East" },
    "401209": { lat: 19.3900, lng: 72.8360, area: "Nalasopara" },

    // --- PUNE ---
    "411001": { lat: 18.5196, lng: 73.8553, area: "Pune Camp" },
    "411004": { lat: 18.5308, lng: 73.8475, area: "Pune Station" },
    "411006": { lat: 18.5082, lng: 73.8070, area: "Deccan Gymkhana" },
    "411007": { lat: 18.4970, lng: 73.8275, area: "Shivajinagar" },
    "411011": { lat: 18.5010, lng: 73.8590, area: "Bibwewadi" },
    "411014": { lat: 18.5600, lng: 73.7800, area: "Hinjewadi" },
    "411027": { lat: 18.4440, lng: 73.8930, area: "Hadapsar" },
    "411028": { lat: 18.4790, lng: 73.9060, area: "Kharadi" },
    "411033": { lat: 18.5320, lng: 73.8050, area: "Kothrud" },
    "411038": { lat: 18.5900, lng: 73.7400, area: "Wakad" },
    "411041": { lat: 18.5610, lng: 73.7750, area: "Aundh" },
    "411045": { lat: 18.5896, lng: 73.7383, area: "Pimple Saudagar" },
    "411048": { lat: 18.5754, lng: 73.8213, area: "Baner" },
    "411057": { lat: 18.4680, lng: 73.8800, area: "Wanowrie" },
};

/**
 * Look up coordinates for a given pincode.
 * @param {string} pincode - The 6-digit Indian pincode
 * @returns {{ lat: number, lng: number, area: string } | null}
 */
const getPincodeCoords = (pincode) => {
    const code = String(pincode).trim();
    return PINCODE_COORDS[code] || null;
};

module.exports = { getPincodeCoords, PINCODE_COORDS };
