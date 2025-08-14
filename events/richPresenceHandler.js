const { servers } = require('../servers.json');
const { ActivityType } = require('discord.js'); // U need it
let richPresenceInterval = null;

const richPresenceHandler = async (client, selectedServer) => {
    console.log(`Starting rich presence for server: ${selectedServer}`);

    const updatePresence = async () => {
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        console.log(`Fetching player count from server: ${serverIp}`);

        try {
            const response = await fetch(`https://${serverIp}/api/v1`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "function": "QueryServerState" }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch player data: ${response.statusText}`);
            }

            const data = await response.json();
            const playerCount = data.data.serverGameState.numConnectedPlayers || 0;
            const maxPlayers = data.data.serverGameState.playerLimit || 0;
            const sessionName = data.data.serverGameState.activeSessionName || 'Unknown';

            console.log(`Fetched player count: ${playerCount}/${maxPlayers}`);

            // Update the bot's rich presence for Discord.js v14
            if (client.user) {
                client.user.setActivity(`${sessionName} — ${playerCount}/${maxPlayers} players`, {
                    type: ActivityType.Watching // playing doesnt work ? idk why
                });
                console.log(`Updated rich presence: ${playerCount}/${maxPlayers} players online`);
            } else {
                console.warn('client.user not ready yet');
            }

        } catch (error) {
            console.error('Error fetching player count:', error);
        }
    };

    // Clear any existing interval
    if (richPresenceInterval) {
        clearInterval(richPresenceInterval);
    }

    // Set interval for updating presence every 30 seconds
    richPresenceInterval = setInterval(updatePresence, 30000);

    // Initial presence update
    if (client.user) {
        await updatePresence();
    } else {
        client.once('ready', updatePresence);
    }
};

module.exports = { richPresenceHandler };
