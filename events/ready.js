const { Client } = require("discord.js")
const { get } = require("axios")
const { logVersion } = require("../functions")

module.exports = {
    name: "ready",
    once: true,
    /**
     * @param {Client} client
     */
    async execute(client) {
        console.log(`${client.user.tag} is online`)

        setInterval(async _ => {
            const response = await get("https://clientsettings.roblox.com/v2/client-version/WindowsPlayer")

            if (response.data.clientVersionUpload) logVersion(response.data.clientVersionUpload)
        }, 3000)

        setInterval(_ => {
            client.user.setPresence({
                activities: [{
                    name: `${client.guilds.cache.size} server${client.guilds.cache.size === 1 ? "" : "s"}`,
                    type: "WATCHING"
                }],
                status: "dnd"
            })
        }, 15000)
    }
}