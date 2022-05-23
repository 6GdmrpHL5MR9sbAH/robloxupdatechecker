const { writeFileSync, readFileSync } = require("fs")
const { upload } = require("youtube-videos-uploader")
const { MessageEmbed } = require("discord.js")
const { EMAIL, PASSWORD } = require("./config.json")

module.exports = {
    writeJSON: function (jsonFileName, path, data, codeToRun) {
        let file = module.exports.readJSON(jsonFileName)

        if (!codeToRun) codeToRun = "file[path] = data"

        eval(codeToRun)

        let newJson = JSON.stringify(file, null, "\t")

        writeFileSync(`./data/${jsonFileName}.json`, newJson)
    },

    readJSON: function (fileName) {
        const file = JSON.parse(readFileSync(`./data/${fileName}.json`, "utf8"))
        return file
    },

    logVersion: function (client, version) {
        const versionData = module.exports.readJSON("versions")
        const guildData = module.exports.readJSON("guilds")

        const versionList = versionData.list
        const previous = versionData.current

        if (version === undefined || version === previous) return

        const embed = module.exports.noColourEmbed()
            .setTitle("Roblox Updated")
            .setDescription(`Sent <t:${(Date.now() / 1000).toFixed(0)}:R>.`)
            .setFields(
                {
                    name: "Previous Version",
                    value: previous,
                    inline: true
                },
                {
                    name: "New Version",
                    value: version,
                    inline: true
                }
            )

        if (versionList.includes(version)) {
            embed.setTitle("Update Reverted")
            embed.setFields(
                {
                    name: "Reverted From",
                    value: previous,
                    inline: true
                },
                {
                    name: "Reverted To",
                    value: version,
                    inline: true
                }
            )
        }

        if (EMAIL !== "YOUR GOOGLE EMAIL HERE" && PASSWORD !== "YOUR GOOGLE PASSWORD HERE") {
            upload(
                {
                    email: EMAIL,
                    pass: PASSWORD
                },
                [
                    {
                        path: "./RUC Default Video.mp4",
                        title: `New Version: ${version} | Previous Version: ${previous}`,
                        description: `${versionList.includes(version) ? "This is a reverted update." : "This is a new update."}
Previous Version: ${previous}
New Version: ${version}

Discord: https://discord.gg/wHy6kkvDQc
Discord Bot: https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands
Discord Bot Source: https://github.com/6GdmrpHL5MR9sbAH/robloxupdatechecker`
                    }
                ]
            )
        }

        versionList.push(version)

        module.exports.writeJSON("versions", "current", version)
        module.exports.writeJSON("versions", "previous", previous)
        module.exports.writeJSON("versions", "list", versionList)

        client.guilds.cache.forEach(async guild => {
            if (!guildData[guild.id] || !guildData[guild.id]["updateChannel"]) return

            const channel = client.channels.cache.get(guildData[guild.id].updateChannel)

            const content = guildData[guild.id]["updateRole"] ? `<@&${guildData[guild.id].updateRole}>` : null

            const message = await channel.send({ content: content, embeds: [embed] })

            if (channel.type === "GUILD_NEWS") message.crosspost()
        })
    },

    successEmbed: function () {
        const embed = new MessageEmbed()
            .setColor("GREEN")
        return embed
    },

    errorEmbed: function () {
        const embed = new MessageEmbed()
            .setColor("RED")
        return embed
    },

    waitEmbed: function () {
        const embed = new MessageEmbed()
            .setColor("ORANGE")
        return embed
    },

    noColourEmbed: function () {
        const embed = new MessageEmbed()
            .setColor("2f3136")
        return embed
    },

    deploySlashCommands: function (client) {
        const data = [
            {
                name: "setupdatechannel",
                description: "Sets the update channel to the provided channel - Requires the ADMINISTRATOR permission.",
                options: [
                    {
                        name: "channel",
                        description: "The update channel.",
                        type: "CHANNEL",
                        required: true
                    }
                ]
            },
            {
                name: "setupdaterole",
                description: "Sets the update mention role to the provided role - Requires the ADMINISTRATOR permission.",
                options: [
                    {
                        name: "role",
                        description: "The update role.",
                        type: "ROLE",
                        required: true
                    }
                ]
            },
            {
                name: "createrolemenu",
                description: "Creates a role menu for the update role - Requires the ADMINISTRATOR permission."
            }
        ]

        client.application.commands.set(data)
    }
}