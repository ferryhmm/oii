const fs = require('fs');
const path = require('path');

// Get the file path and game mode from command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node sql2csv.js <path-to-sql-file> [game-mode]');
    console.error('Game modes: fruits, mania, osu, taiko');
    process.exit(1);
}

const sqlFilePath = args[0];
const gameMode = args[1] || inferGameMode(sqlFilePath);

// Get the directory and filename without extension
const dir = path.dirname(sqlFilePath);
const filename = path.basename(sqlFilePath, '.sql');
const outputPath = path.join(dir, `${filename}.csv`);

// Read the SQL file
const fileContent = fs.readFileSync(sqlFilePath, 'utf8');

// Extract the table name from the file
const tableNameMatch = /INSERT INTO `(osu_user_stats(?:_\w+)?)`/.exec(fileContent);
if (!tableNameMatch) {
    throw new Error('Could not find INSERT INTO statement');
}
const tableName = tableNameMatch[1];

// Parse rows from the VALUES string
const insertRegex = new RegExp(`INSERT INTO \`${tableName}\` VALUES\\s*\\(([\\s\\S]*)\\);`);
const match = insertRegex.exec(fileContent);
if (!match) {
    throw new Error(`Could not find INSERT INTO statement for ${tableName}`);
}

const valuesString = match[1];
const rowRegex = /\(([^)]+)\)/g;
const rows = [];
let rowMatch;

while ((rowMatch = rowRegex.exec(valuesString)) !== null) {
    const rowValues = rowMatch[1];
    const fields = rowValues.split(',').map(field => {
        field = field.trim();
        if (field.startsWith("'") && field.endsWith("'")) {
            return field.slice(1, -1);
        }
        return field;
    });
    rows.push(fields);
}

// Define headers based on game mode
const headers = {
    fruits: ['user_id', 'count300', 'count100', 'count50', 'countMiss', 'accuracy_total', 'accuracy_count',
        'accuracy', 'playcount', 'ranked_score', 'total_score', 'x_rank_count', 'xh_rank_count',
        's_rank_count', 'sh_rank_count', 'a_rank_count', 'rank', 'level', 'replay_popularity',
        'fail_count', 'exit_count', 'max_combo', 'country_acronym', 'rank_score', 'rank_score_index',
        'accuracy_new', 'last_update', 'last_played', 'total_seconds_played'],
    mania: [], // Add your mania headers
    osu: [],   // Add your osu headers
    taiko: []  // Add your taiko headers
};

const header = headers[gameMode] || headers.fruits;
const stringFieldIndices = [22, 26, 27]; // Adjust based on your needs

// Write to CSV
const csvFile = fs.createWriteStream(outputPath);
csvFile.write(header.join(',') + '\n');

rows.forEach(row => {
    const csvRow = row.map((field, index) => {
        if (stringFieldIndices.includes(index)) {
            return `"${field}"`;
        }
        return field;
    }).join(',');
    csvFile.write(csvRow + '\n');
});

csvFile.end();
console.log(`Data has been successfully extracted to ${outputPath}`);

// Helper function to infer game mode from filename
function inferGameMode(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    if (filename.includes('fruits')) return 'fruits';
    if (filename.includes('mania')) return 'mania';
    if (filename.includes('taiko')) return 'taiko';
    return 'osu';
}