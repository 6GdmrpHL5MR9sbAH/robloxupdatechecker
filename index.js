// Uncomment "deploySlashCommands()" when you need to deploy the slash commands \\
// It's commented to avoid API spam and to avoid "Invalid interaction application command" \\

const Discord = require("discord.js")
const fs = require("fs")
const axios = require("axios")
const puppeteer = require("puppeteer")
const { upload } = require("youtube-videos-uploader")
const config = require("./config.json")
const client = new Discord.Client({ intents: ["GUILDS"] })

/**
 * @param {String} jsonFileName Name of the JSON file
 * @param {String} path JSON path to write to
 * @param {*} data Data to put into the JSON file
 * @param {String} codeToRun Optional code to run
 */
function writeJSON(jsonFileName, path, data, codeToRun = undefined) {
    const file = readJSON(jsonFileName)

    if (!codeToRun) codeToRun = "file[path] = data"

    eval(codeToRun)

    const jsonString = JSON.stringify(file, null, "\t")

    fs.writeFileSync(`./data/${jsonFileName}.json`, jsonString)
}

/**
 * @param {String} jsonFileName Name of the JSON file
 * @returns {Object}
 */
function readJSON(jsonFileName) {
    const file = JSON.parse(fs.readFileSync(`./data/${jsonFileName}.json`, "utf8"))

    return file
}

function deploySlashCommands() {
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

/**
 * @param {String} version
 * @param {String} release
 */
function logVersion(version, release) {
    const versionData = readJSON("versions")
    const guildData = readJSON("guilds")

    const versionList = versionData.list
    const previous = versionData.current

    if (version === undefined || version === previous) return

    const embed = new Discord.MessageEmbed()
        .setColor("#2F3136")
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
        embed.setColor("#2F3136")
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

    versionList.push(version)

    writeJSON("versions", "current", version)
    writeJSON("versions", "previous", previous)
    writeJSON("versions", "list", versionList)

    if (config.EMAIL !== "YOUR GOOGLE EMAIL HERE" && config.PASSWORD !== "YOUR GOOGLE PASSWORD HERE") {
        upload(
            {
                email: config.EMAIL,
                pass: config.PASSWORD
            },
            [
                {
                    path: "./RUC Default Video.mp4",
                    title: `New Version: ${version} | Previous Version: ${previous}`,
                    description: `${versionList.includes(version) ? "This is a reverted update." : "This is a new update."}\n\nDiscord: https://discord.gg/wHy6kkvDQc\nSource: https://github.com/6GdmrpHL5MR9sbAH/robloxupdatechecker`
                }
            ]
        )
    }

    client.guilds.cache.forEach(guild => {
        if (!guildData[guild.id] || !guildData[guild.id]["updateChannel"]) return

        const channel = client.channels.cache.get(guildData[guild.id].updateChannel)

        const content = guildData[guild.id]["updateRole"] ? `<@&${guildData[guild.id].updateRole}>` : null

        channel.send({ content: content, embeds: [embed] })
            .then(message => {
                if (channel.type === "GUILD_NEWS") {
                    message.crosspost()
                }
            })
    })

    getReleaseNotes(release)
}

/**
 * @param {String} release
 * @param {puppeteer.Browser} browser
 * @param {puppeteer.Page} page
 */
async function getReleaseNotes(release, browser, page) {
    const guildData = readJSON("guilds")

    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--disk-cache-size=0"]
        })

        page = await browser.newPage()
    }

    await page.setCacheEnabled(false)

    try {
        await page.goto(`https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release}`)

        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })

        await page.waitForSelector("div[class=\"table-responsive\"]", { visible: true, timeout: 15000 })
    } catch (error) {
        return getReleaseNotes(release, browser, page)
    }

    const element = await page.$("body > div.main-container.generic-pages.sub-pages > div.container-fluid > div > main > div > div.page-elements > div:nth-child(2) > table")

    const box = await element.boundingBox()

    await element.screenshot({ path: `./releasenotes/${release}.png`, clip: { "x": box.x, "y": box.y - 50, "width": box.width, "height": box.height + 50 } })

    await browser.close()

    const file = new Discord.MessageAttachment(`./releasenotes/${release}.png`)

    const embed = new Discord.MessageEmbed()
        .setColor("#2F3136")
        .setTitle("Release Notes")
        .setURL(`https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release}`)
        .setDescription(`The preview has been attached.
[Click here to view the full release notes.](https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release})
Sent <t:${(Date.now() / 1000).toFixed(0)}:R>.`)
        .setImage(`attachment://${release}.png`)

    client.guilds.cache.forEach(guild => {
        if (!guildData[guild.id] || !guildData[guild.id]["updateChannel"]) return

        const channel = client.channels.cache.get(guildData[guild.id].updateChannel)

        channel.send({ embeds: [embed], files: [file] })
            .then(message => {
                if (channel.type === "GUILD_NEWS") {
                    message.crosspost()
                }
            })
    })
}

client.on("ready", _ => {
    console.log(`${client.user.tag} is online`)

    setInterval(_ => {
        axios.get("https://clientsettings.roblox.com/v2/client-version/WindowsPlayer")
            .then(response => {
                if (response.data.clientVersionUpload) {
                    logVersion(response.data.clientVersionUpload, response.data.version.slice(2, -10))
                }
            })
            .catch(error => {
                // console.error(error) // Uncomment to log errors
            })
    }, 3000)

    // deploySlashCommands()

    setInterval(_ => {
        client.user.setPresence({
            activities: [{
                name: `${client.guilds.cache.size} server${client.guilds.cache.size === 1 ? "" : "s"} | Ping: ${client.ws.ping}ms`,
                type: "WATCHING"
            }],
            status: "dnd"
        })
    }, 15000)
})

client.on("interactionCreate", async interaction => {
    const guildData = readJSON("guilds")

    if (interaction.isCommand()) {
        if (!readJSON("guilds")[interaction.guild.id]) {
            writeJSON("guilds", interaction.guild.id, {})
        }

        switch (interaction.commandName) {
            case "setupdatechannel":
                if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("You need the `Administrator` permission to use this command.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else {
                    writeJSON("guilds", interaction.guild.id, interaction.options.getChannel("channel", true).id, `file[path]["updateChannel"] = data`)

                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`The update channel is now <#${readJSON("guilds")[interaction.guild.id].updateChannel}>.`)

                    await interaction.deferReply()
                    await interaction.editReply({ embeds: [embed] })
                }
                break
            case "setupdaterole":
                if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("You need the `Administrator` permission to use this command.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else if (interaction.options.getRole("role", true) === interaction.guild.roles.everyone) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("Invalid role.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else {
                    writeJSON("guilds", interaction.guild.id, interaction.options.getRole("role", true).id, `file[path]["updateRole"] = data`)

                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`The update role is now <@&${readJSON("guilds")[interaction.guild.id].updateRole}>.`)

                    await interaction.deferReply()
                    await interaction.editReply({ embeds: [embed] })
                }
                break
            case "createrolemenu":
                if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("You need the `Administrator` permission to use this command.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else if (!readJSON("guilds")[interaction.guild.id].updateRole) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("An update role is required to use this. Use `/setupdaterole`.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else {
                    const updateRole = interaction.guild.roles.cache.get(readJSON("guilds")[interaction.guild.id].updateRole)

                    const row = new Discord.MessageActionRow()
                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId("getUpdateRole")
                                .setLabel(`Get ${updateRole.name} Role`)
                                .setStyle("SUCCESS"),
                            new Discord.MessageButton()
                                .setCustomId("removeUpdateRole")
                                .setLabel(`Remove ${updateRole.name} Role`)
                                .setStyle("DANGER")
                        )

                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .addField(`@${updateRole.name}`, "Be notified of new updates.")
                        .setFooter("If it fails make sure the bot is online.")

                    await interaction.deferReply()
                    await interaction.editReply({ embeds: [embed], components: [row] })
                }
                break
        }
    } else if (interaction.isButton()) {
        switch (interaction.customId) {
            case "getUpdateRole":
                if (!guildData[interaction.guild.id].updateRole || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("This server doesn't have a valid update role setup.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else if (interaction.member.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`You already have <@&${guildData[interaction.guild.id].updateRole}>.`)

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else {
                    await interaction.member.roles.add(guildData[interaction.guild.id].updateRole)

                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`Got <@&${guildData[interaction.guild.id].updateRole}>.`)

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                }
                break
            case "removeUpdateRole":
                if (!guildData[interaction.guild.id]["updateRole"] || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription("This server doesn't have a valid update role setup.")

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else if (!interaction.member.roles.cache.has(guildData[interaction.guild.id]["updateRole"])) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`You don't have <@&${guildData[interaction.guild.id].updateRole}>.`)

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                } else {
                    await interaction.member.roles.remove(guildData[interaction.guild.id].updateRole)

                    const embed = new Discord.MessageEmbed()
                        .setColor("#2F3136")
                        .setDescription(`Removed <@&${guildData[interaction.guild.id].updateRole}>.`)

                    await interaction.deferReply({ ephemeral: true })
                    await interaction.editReply({ embeds: [embed] })
                }
                break
        }
    }
})

client.on("guildCreate", guild => {
    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setLabel("Invite Bot")
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.application.id}&permissions=8&scope=bot%20applications.commands`)
                .setStyle("LINK")
        )

    const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setDescription(`Hello, I am Roblox Update Checker. As the name suggests I check for Roblox updates.
This bot uses [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ).

Users with the \`Administrator\` permission can get started by using the following commands:
\`/setupdatechannel #channel\`
\`/setupdaterole @role\`
\`/createrolemenu\`
Examples:
\`/setupdatechannel #roblox-updates\`
\`/setupdaterole @Roblox Update Pings\``)

    guild.channels.cache.get(guild.systemChannelId || guild.channels.cache.find(channel => channel.type === "GUILD_TEXT" && channel.permissionsFor(guild.me).has("SEND_MESSAGES")).id).send({
        embeds: [embed],
        components: [row]
    })
})

process.on("uncaughtException", console.error)

client.login(config.TOKEN)

process.title = "RUC" // Sets command prompt tab title, remove if you don't need it