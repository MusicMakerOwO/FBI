import BetterSqlite3, { Database } from 'better-sqlite3';

import fs from 'fs';

function ParseQueries(fileContent: string) : string[] {
	const queries = [];
	let buffer = '';
	let inMultilineComment = false;
	let insubQuery = false;

	const lines = fileContent.split('\n');
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();

		if (line.startsWith('--')) continue;

		if (line.startsWith('/*')) {
			inMultilineComment = true;
		}

		if (inMultilineComment) {
			if (line.endsWith('*/')) {
				inMultilineComment = false;
			}
			continue;
		}

		if (line.includes('BEGIN')) {
			insubQuery = true;
		}

		if (line.includes('END')) {
			insubQuery = false;
		}

		buffer += line + '\n';

		if (line.endsWith(';') && !insubQuery) {
			queries.push(buffer.trim());
			buffer = '';
		} else {
			buffer += ' ';
		}
	}

	// Check if there's any remaining content in the buffer (for cases where the file might not end with a semicolon)
	if (buffer.trim()) {
		queries.push(buffer.trim());
	}

	return queries;
}

const DB_SETUP_FILE = `${__dirname}/../../DB_SETUP.sql`;
const FileContent = fs.readFileSync(DB_SETUP_FILE, 'utf8');
const DBQueries = ParseQueries(FileContent);

const database: Database = new BetterSqlite3(`${__dirname}/../fbi.sqlite`);

for (const query of DBQueries) {
	try {
		database.exec(query);
	} catch (error) {
		console.error(query);
		console.error(error);
		process.exit(1);
	}
}

export default database;
module.exports = exports.default;