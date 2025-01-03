import { Guild, GuildBasedChannel } from "discord.js";
import { MicroClient } from "../../typings";
import Database from "../Database";
import Logs from "../Logs";

export const MAX_AUTO_BACKUPS = 7;
export const MAX_MANUAL_BACKUPS = 6;
export const MAX_IMPORTsBACKUPS = 3;

export enum BackupType {
	MANUAL = 0,
	AUTOMATIC = 1,
	IMPORT = 2,
}

const Timings =  {
	ONE_HOUR: 3600_000,
	ONE_DAY: 86400_000,
	ONE_WEEK: 604800_000,
	ONE_MONTH: 2628000_000,
}

export const BackupTTL = {
	[BackupType.MANUAL]: Timings.ONE_MONTH * 6,
	[BackupType.AUTOMATIC]: Timings.ONE_WEEK,
	[BackupType.IMPORT]: Timings.ONE_DAY * 3,
}

export type DB_BackupEntry = {
	id: string,
	guild_id: string,
	type: BackupType,
	created_at: string,
	expires_at: string,
}

const QUERY_CreateBackup = Database.prepare(`
	INSERT INTO Backups (guild_id, type)
	VALUES (?, ?)
`);
const QUERY_CreateChannelBackup = Database.prepare(`
	INSERT INTO BackupChannel (backup_id, parent_id, channel_id, type, name)
	VALUES (?, ?, ?, ?, ?)
`);
const QUERY_CreateRoleBackup = Database.prepare(`
	INSERT INTO BackupRole (backup_id, role_id, name, color, hoist, position, permissions, mentionable)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const QUERY_CreateChannelOverrideBackup = Database.prepare(`
	INSERT INTO BackupChannelOverrides (backup_id, channel_id, role_id, allow, deny)
	VALUES (?, ?, ?, ?, ?)
`);

export default function CreateBackup(guild: Guild, client: MicroClient, type: BackupType) {
	const channels = Array.from(guild.channels.cache.values()) as (GuildBasedChannel & { parentID: string | null })[];
	const roles = Array.from(guild.roles.cache.values());

	let errorMakingBackup = false;
	try {
		Database.exec('BEGIN TRANSACTION');

		// create backup
		var { lastInsertRowid: backupID } = QUERY_CreateBackup.run(guild.id, type);

		// create role backups
		for (let i = 0; i < roles.length; i++) {
			const role = roles[i];
			QUERY_CreateRoleBackup.run(backupID, role.id, role.name, role.color, +role.hoist, role.position, role.permissions.bitfield, +role.mentionable);
		}

		// create channel backups
		for (let i = 0; i < channels.length; i++) {
			const channel = channels[i];
			QUERY_CreateChannelBackup.run(backupID, channel.parentID, channel.id, channel.type, channel.name);
		
			// create channel overrides
			const overrides = 'permissionOverwrites' in channel ? channel.permissionOverwrites : null;
			if (!overrides) continue;
			for (const [id, override] of overrides.cache.entries()) {
				QUERY_CreateChannelOverrideBackup.run(backupID, channel.id, id, override.allow.bitfield, override.deny.bitfield);
			}
		}

		Database.exec('COMMIT');
	} catch (error) {
		errorMakingBackup = true;
		Database.exec('ROLLBACK');
		Logs.error(error);
	}

	// Only delete backups if there is at least one backup remaining
	if (!errorMakingBackup) PurgeBackups(guild.id);

	return errorMakingBackup ? null : backupID!;
}


const QUERY_FindBackups = Database.prepare(`
	SELECT id, type, created_at
	FROM Backups
	WHERE guild_id = ?
	ORDER BY created_at DESC
`);
const QUERY_DeleteBackup = Database.prepare('DELETE FROM Backups WHERE id = ?');
function PurgeBackups(guildID: string) {
	const backups = QUERY_FindBackups.all(guildID) as DB_BackupEntry[];

	if (backups.length < 7) return; // nothing to do

	const now = Date.now();

	const manual 	: DB_BackupEntry[] = [];
	const automatic : DB_BackupEntry[] = [];
	const imports 	: DB_BackupEntry[] = [];

	for (let i = 0; i < backups.length; i++) {
		const backup = backups[i];
		if (now > new Date(backup.created_at).getTime() + BackupTTL[backup.type]) {
			// expired
			QUERY_DeleteBackup.run(backup.id);
			continue;
		}

		if (backup.type === BackupType.MANUAL) {
			manual.push(backup);
		} else if (backup.type === BackupType.AUTOMATIC) {
			automatic.push(backup);
		} else if (backup.type === BackupType.IMPORT) {
			imports.push(backup);
		} else {
			Logs.error(`Unknown backup type: ${backup.type}`);
			Logs.error(backup);
		}
	}

	if (automatic.length > MAX_AUTO_BACKUPS) {
		const toDelete = automatic.length - MAX_AUTO_BACKUPS;
		for (let i = toDelete - 1; i >= 0; i--) {
			QUERY_DeleteBackup.run(automatic[i].id);
		}
	}

}