const { Client } = require("discord.js")
const { get } = require("axios")
const { logVersion, deploySlashCommands } = require("../functions")

module.exports = {
    name: "ready",
    once: true,
    /**
     * @param {Client} client
     */
    async execute(client) {
        // deploySlashCommands(client)

        console.log(`${client.user.tag} is online`)

        setInterval(async _ => {
            const response = await get("https://clientsettings.roblox.com/v2/client-version/WindowsPlayer").catch(_ => { })

            if (response && response.data.clientVersionUpload) logVersion(client, response.data.clientVersionUpload)
        }, 3000)

        setInterval(_ => {
            client.user.setPresence({
                activities: [
                    {
                        name: `${client.guilds.cache.size} server${client.guilds.cache.size === 1 ? "" : "s"}`,
                        type: "WATCHING"
                    }
                ],
                status: "dnd"
            })
        }, 15000)
    }
}